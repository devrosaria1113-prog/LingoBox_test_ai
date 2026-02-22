"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { getPhoto, deletePhoto } from "@/lib/api";
import { Comment, PhotoDetail } from "@/types";
import CommentSection from "@/components/CommentSection";

export default function PhotoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const photoId = Number(params.id);

  const { data: photo, mutate, isLoading, error } = useSWR<PhotoDetail>(
    `/photos/${photoId}`,
    getPhoto
  );

  const [imgFailed, setImgFailed] = useState(false);

  const handleDelete = async () => {
    if (!confirm("사진을 삭제할까요? 관련 코멘트도 모두 삭제됩니다.")) return;
    await deletePhoto(photoId);
    router.push("/");
  };

  const handleCommentsChange = (comments: Comment[]) => {
    if (!photo) return;
    mutate({ ...photo, comments }, false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">사진을 불러올 수 없습니다.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로
      </button>

      {/* Photo */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: "66.67%" }}>
          {imgFailed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 gap-3">
              <svg
                className="w-16 h-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1} />
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-sm text-gray-400">이미지를 불러올 수 없습니다</p>
            </div>
          ) : (
            <Image
              src={photo.s3_url}
              alt={photo.original_filename}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain bg-gray-900"
              priority
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        <div className="p-6">
          {/* Meta */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 break-all">
                {photo.original_filename}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(photo.created_at).toLocaleString("ko-KR")} ·{" "}
                {(photo.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          </div>

          <hr className="my-5 border-gray-100" />

          {/* Comments */}
          <CommentSection
            photoId={photo.id}
            comments={photo.comments}
            onCommentsChange={handleCommentsChange}
          />
        </div>
      </div>
    </div>
  );
}
