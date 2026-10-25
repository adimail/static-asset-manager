package preprocessing

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/ent/asset"
	"github.com/adimail/asset-manager/ent/compressionjob"
	"github.com/adimail/asset-manager/internal/config"
)

type JobStatus string

const (
	StatusPending    JobStatus = "pending"
	StatusProcessing JobStatus = "processing"
	StatusCompleted  JobStatus = "completed"
	StatusFailed     JobStatus = "failed"
)

type Service struct {
	client *ent.Client
	config config.CompressionConfig
	queue  chan string
	wg     sync.WaitGroup
}

func NewService(client *ent.Client, cfg config.CompressionConfig) *Service {
	s := &Service{
		client: client,
		config: cfg,
		queue:  make(chan string, 100),
	}

	if cfg.Enabled {
		for i := 0; i < cfg.WorkerCount; i++ {
			s.wg.Add(1)
			go s.worker(i)
		}
	}

	return s
}

func (s *Service) Enqueue(ctx context.Context, assetID string) error {
	if !s.config.Enabled {
		return nil
	}

	_, err := s.client.CompressionJob.Create().
		SetAssetID(assetID).
		SetStatus(string(StatusPending)).
		Save(ctx)
	if err != nil {
		return err
	}

	select {
	case s.queue <- assetID:
		return nil
	default:
		return fmt.Errorf("compression queue full")
	}
}

func (s *Service) worker(id int) {
	defer s.wg.Done()

	for assetID := range s.queue {
		s.processJob(assetID)
	}
}

func (s *Service) processJob(assetID string) {
	ctx := context.Background()
	startTime := time.Now()

	a, err := s.client.Asset.Query().Where(asset.ID(assetID)).Only(ctx)
	if err != nil {
		return
	}

	job, err := a.QueryCompressionJobs().
		Where(compressionjob.StatusEQ(string(StatusPending))).
		Order(ent.Desc(compressionjob.FieldStartedAt)).
		First(ctx)

	if err != nil {
		job, _ = s.client.CompressionJob.Create().
			SetAssetID(assetID).
			SetStatus(string(StatusProcessing)).
			SetStartedAt(startTime).
			Save(ctx)
	} else {
		job.Update().
			SetStatus(string(StatusProcessing)).
			SetStartedAt(startTime).
			Save(ctx)
	}

	publicStoragePath := a.StoragePath
	ext := filepath.Ext(publicStoragePath)
	tempOutput := strings.TrimSuffix(publicStoragePath, ext) + "_compressed" + ext

	err = s.runFFmpeg(publicStoragePath, tempOutput, a.FileType)
	if err != nil {
		errMsg := err.Error()
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError(errMsg).
			Save(ctx)
		return
	}

	infoOrig, errOrig := os.Stat(publicStoragePath)
	infoComp, errComp := os.Stat(tempOutput)
	if errOrig != nil || errComp != nil {
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError("failed stat on compressed output").
			Save(ctx)
		return
	}

	ratio := float64(infoComp.Size()) / float64(infoOrig.Size())

	if err := os.MkdirAll(s.config.OriginalsDir, 0o755); err != nil {
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError("failed to create private originals directory").
			Save(ctx)
		return
	}

	isolatedOriginalPath := filepath.Join(s.config.OriginalsDir, assetID+"_original"+ext)

	if err := os.Rename(publicStoragePath, isolatedOriginalPath); err != nil {
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError("failed isolating original file").
			Save(ctx)
		return
	}

	if err := os.Rename(tempOutput, publicStoragePath); err != nil {
		os.Rename(isolatedOriginalPath, publicStoragePath)
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError("failed moving optimized file to public path").
			Save(ctx)
		return
	}

	thumbPath := filepath.Join(s.config.ThumbnailsDir, assetID+".webp")
	_ = s.GenerateThumbnail(publicStoragePath, thumbPath, a.FileType)

	s.client.Asset.UpdateOneID(assetID).
		SetIsCompressed(true).
		SetOriginalPath(isolatedOriginalPath).
		SetCompressionRatio(ratio).
		SetFileSizeBytes(infoComp.Size()).
		SetCdnStatus("local_only").
		Save(ctx)

	job.Update().
		SetStatus(string(StatusCompleted)).
		SetProgress(100).
		SetCompletedAt(time.Now()).
		Save(ctx)
}

func (s *Service) GenerateThumbnail(input, output, fileType string) error {
	if err := os.MkdirAll(filepath.Dir(output), 0o755); err != nil {
		return err
	}

	var args []string
	if fileType == "image" {
		args = []string{
			"-i", input,
			"-vf", "scale=256:256:force_original_aspect_ratio=decrease,format=rgba",
			"-vcodec", "libwebp",
			"-lossless", "0",
			"-compression_level", "4",
			"-q:v", "75",
			"-y", output,
		}
	} else if fileType == "video" {
		args = []string{
			"-ss", "00:00:01",
			"-i", input,
			"-vframes", "1",
			"-vf", "scale=256:256:force_original_aspect_ratio=decrease",
			"-vcodec", "libwebp",
			"-q:v", "75",
			"-y", output,
		}
	} else {
		return nil
	}

	cmd := exec.Command(s.config.FFmpegPath, args...)
	return cmd.Run()
}

func (s *Service) runFFmpeg(input, output, fileType string) error {
	var args []string

	if fileType == "video" {
		args = []string{
			"-i", input,
			"-c:v", "libx264",
			"-crf", "23",
			"-preset", "medium",
			"-c:a", "aac",
			"-b:a", "128k",
			"-movflags", "+faststart",
			"-y", output,
		}
	} else if fileType == "image" {
		ext := strings.ToLower(filepath.Ext(input))
		if ext == ".gif" {
			args = []string{
				"-i", input,
				"-vf", "fps=15,scale='min(1080,iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
				"-y", output,
			}
		} else {
			args = []string{
				"-i", input,
				"-vf", "scale='min(4096,iw)':-1",
				"-q:v", fmt.Sprintf("%d", s.config.ImageQuality),
				"-y", output,
			}
		}
	} else {
		return fmt.Errorf("unsupported file type for compression")
	}

	cmd := exec.Command(s.config.FFmpegPath, args...)
	return cmd.Run()
}
