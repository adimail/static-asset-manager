export type FileType =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "code"
  | "other";

export interface Asset {
  id: string;
  original_filename: string;
  file_type: FileType;
  extension: string;
  file_size_bytes: number;
  created_at: string;
}

export interface Assets {
  assets: Asset[];
  total_count: number;
  page: number;
  limit: number;
}
