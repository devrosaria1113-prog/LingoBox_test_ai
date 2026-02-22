"use client";

import { useState } from "react";
import useSWR from "swr";
import { getPhotos } from "@/lib/api";
import { PhotoListItem, PhotoDetail } from "@/types";
import UploadZone from "@/components/UploadZone";
import PhotoGrid from "@/components/PhotoGrid";

export default function HomePage() {
  const { data: photos = [], mutate } = useSWR<PhotoListItem[]>(
    "/photos",
    getPhotos
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (photo: PhotoDetail) => {
    const listItem: PhotoListItem = {
      id: photo.id,
      original_filename: photo.original_filename,
      s3_url: photo.s3_url,
      thumbnail_url: photo.thumbnail_url,
      created_at: photo.created_at,
    };
    mutate([listItem, ...photos], false);
    setIsUploading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사진 피드</h1>
        <p className="text-sm text-gray-500 mt-1">
          총 {photos.length}장
        </p>
      </div>

      <UploadZone onUploadSuccess={handleUploadSuccess} />
      <PhotoGrid photos={photos} />
    </div>
  );
}
