package assets

import (
	"context"
)

type Processor struct{}

func NewProcessor() *Processor {
	return &Processor{}
}

func (p *Processor) Process(ctx context.Context, fileType FileType, data []byte) ([]byte, error) {
	return data, nil
}
