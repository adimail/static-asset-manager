package assets

import (
	"path/filepath"
	"strings"
)

func GeneratePath(baseDir string, fileType FileType, id, ext string) string {
	return filepath.Join(baseDir, string(fileType), id+ext)
}

func DetermineFileType(filename string) FileType {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return FileTypeImage
	case ".pdf", ".doc", ".docx", ".txt":
		return FileTypeDocument
	case ".mp3", ".wav", ".ogg":
		return FileTypeAudio
	case ".mp4", ".mov", ".avi":
		return FileTypeVideo
	default:
		return FileTypeOther
	}
}
