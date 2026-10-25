export type FileType =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "code"
  | "other";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Asset {
  id: string;
  original_filename: string;
  file_type: FileType;
  extension: string;
  file_size_bytes: number;
  created_at: string;
  is_compressed: boolean;
  compression_ratio?: number;
  content_hash?: string;
  mime_type: string;
  cdn_status: "local_only" | "live" | "failed";
  last_synced_at?: string;
  tags: Tag[];
}

export interface Assets {
  assets: Asset[];
  total_count: number;
  page: number;
  limit: number;
}

export interface CDNStatus {
  total_local_only: number;
  total_live: number;
  total_failed: number;
  last_synced_at?: string;
}
