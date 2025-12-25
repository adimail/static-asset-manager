.PHONY: run build clean test dev-backend dev-frontend generate

generate:
	@echo "Generating Ent code..."
	go run -mod=mod entgo.io/ent/cmd/ent generate ./ent/schema

run: generate
	cd web && npm run build
	go run cmd/server/main.go

build: generate
	go build -o bin/server cmd/server/main.go

clean:
	rm -rf bin/ data/assets.db static/

test: generate
	go test ./...

dev-backend: generate
	@echo "Starting backend server (http://localhost:8080)..."
	go run cmd/server/main.go

dev-frontend:
	@echo "Starting frontend dev server (http://localhost:5173)..."
	cd web && npm run dev
