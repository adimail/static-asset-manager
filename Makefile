.PHONY: run build clean test dev-backend dev-frontend

run:
	cd web && npm run build
	go run cmd/server/main.go

build:
	go build -o bin/server cmd/server/main.go

clean:
	rm -rf bin/ data/assets.db assets/

test:
	go test ./...

dev-backend:
	@echo "Starting backend server (http://localhost:8080)..."
	go run cmd/server/main.go

dev-frontend:
	@echo "Starting frontend dev server (http://localhost:5173)..."
	cd web && npm run dev
