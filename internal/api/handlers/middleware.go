package handlers

import (
	"net/http"
	"time"

	"github.com/adimail/asset-manager/pkg/logger"
	"go.uber.org/zap"
)

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func LoggingMiddleware(next http.Handler) http.Handler {
	log := logger.New()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(sw, r)

		fields := []zap.Field{
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.Int("status", sw.status),
			zap.Duration("duration", time.Since(start)),
		}

		if sw.status >= 500 {
			log.Error("Server Error", fields...)
		} else if sw.status >= 400 {
			log.Warn("Client Error", fields...)
		} else if r.Method != http.MethodGet {
			log.Info("Resource Mutation", fields...)
		}
	})
}
