package preprocessing

import (
	"context"
	"fmt"
	"log"
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
	queue  chan string // Asset IDs
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

	// Create job record
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
	log.Printf("Compression worker %d started", id)

	for assetID := range s.queue {
		s.processJob(assetID)
	}
}

func (s *Service) processJob(assetID string) {
	ctx := context.Background()

	// Fetch asset and job
	a, err := s.client.Asset.Query().Where(asset.ID(assetID)).Only(ctx)
	if err != nil {
		log.Printf("Worker failed to fetch asset %s: %v", assetID, err)
		return
	}

	// Find the pending job
	job, err := a.QueryCompressionJobs().
		Where(compressionjob.StatusEQ(string(StatusPending))).
		Order(ent.Desc(compressionjob.FieldStartedAt)).
		First(ctx)

	if err != nil {
		// Create a new job if missing (recovery)
		job, _ = s.client.CompressionJob.Create().
			SetAssetID(assetID).
			SetStatus(string(StatusProcessing)).
			SetStartedAt(time.Now()).
			Save(ctx)
	} else {
		job.Update().
			SetStatus(string(StatusProcessing)).
			SetStartedAt(time.Now()).
			Save(ctx)
	}

	// Determine paths
	originalPath := a.StoragePath
	ext := filepath.Ext(originalPath)
	tempOutput := strings.TrimSuffix(originalPath, ext) + "_compressed" + ext

	// Run FFmpeg
	err = s.runFFmpeg(originalPath, tempOutput, a.FileType)
	if err != nil {
		errMsg := err.Error()
		job.Update().
			SetStatus(string(StatusFailed)).
			SetError(errMsg).
			Save(ctx)
		return
	}

	// Calculate stats
	infoOrig, _ := os.Stat(originalPath)
	infoComp, _ := os.Stat(tempOutput)
	ratio := float64(infoComp.Size()) / float64(infoOrig.Size())

	// Move files
	backupPath := strings.TrimSuffix(originalPath, ext) + "_original" + ext
	os.Rename(originalPath, backupPath)
	os.Rename(tempOutput, originalPath)

	// Update DB
	s.client.Asset.UpdateOneID(assetID).
		SetIsCompressed(true).
		SetOriginalPath(backupPath).
		SetCompressionRatio(ratio).
		SetFileSizeBytes(infoComp.Size()).
		Save(ctx)

	job.Update().
		SetStatus(string(StatusCompleted)).
		SetProgress(100).
		SetCompletedAt(time.Now()).
		Save(ctx)
}

func (s *Service) runFFmpeg(input, output, fileType string) error {
	var args []string

	if fileType == "video" {
		// H.264, CRF 23, AAC Audio
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
		// Scale down if too large, optimize
		args = []string{
			"-i", input,
			"-vf", "scale='min(4096,iw)':-1",
			"-q:v", fmt.Sprintf("%d", s.config.ImageQuality),
			"-y", output,
		}
	} else {
		return fmt.Errorf("unsupported file type for compression")
	}

	cmd := exec.Command(s.config.FFmpegPath, args...)
	return cmd.Run()
}
