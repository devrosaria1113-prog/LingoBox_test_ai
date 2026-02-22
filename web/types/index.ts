export interface Photo {
  id: number;
  filename: string;
  original_filename: string;
  s3_key: string;
  s3_url: string;
  thumbnail_url: string | null;
  content_type: string;
  file_size: number;
  created_at: string;
  updated_at: string | null;
}

export interface PhotoListItem {
  id: number;
  original_filename: string;
  s3_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  photo_id: number;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export interface PhotoDetail extends Photo {
  comments: Comment[];
}
