"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PhotoListItem } from "@/types";

function ImageFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 gap-1.5">
      <svg
        className="w-10 h-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.2} />
        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
          d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-[10px] text-gray-400">이미지 없음</span>
    </div>
  );
}

function PhotoCard({ photo }: { photo: PhotoListItem }) {
  const [failed, setFailed] = useState(false);
  const src = photo.thumbnail_url ?? photo.s3_url;

  return (
    <Link
      href={`/photos/${photo.id}`}
      className="group block rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-square">
        {failed ? (
          <ImageFallback />
        ) : (
          <Image
            src={src}
            alt={photo.original_filename}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="text-xs text-gray-500 truncate">{photo.original_filename}</p>
      </div>
    </Link>
  );
}

interface PhotoGridProps {
  photos: PhotoListItem[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 3.75h7.5A2.25 2.25 0 0123.25 6v13.5M3.75 18.75V6a2.25 2.25 0 012.25-2.25h10.5"
          />
        </svg>
        <p className="text-lg font-medium">사진이 없습니다</p>
        <p className="text-sm mt-1">위에서 첫 번째 사진을 업로드해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
