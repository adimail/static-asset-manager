CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

-- Add indexes for common query patterns (sorting by date, filtering by type)
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_file_type ON assets(file_type);
