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
  tags: Tag[];
}

export interface Assets {
  assets: Asset[];
  total_count: number;
  page: number;
  limit: number;
}
