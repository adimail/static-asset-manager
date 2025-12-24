export type FileType = "image" | "document" | "audio" | "video" | "other";

export interface Asset {
  id: string;
  original_filename: string;
  file_type: FileType;
  extension: string;
  file_size_bytes: number;
  created_at: string;
}
