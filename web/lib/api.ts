import { PhotoListItem, PhotoDetail, Comment } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API 오류가 발생했습니다.");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Photos
export const getPhotos = (url: string): Promise<PhotoListItem[]> =>
  request<PhotoListItem[]>(url);

export const getPhoto = (url: string): Promise<PhotoDetail> =>
  request<PhotoDetail>(url);

export async function uploadPhoto(file: File): Promise<PhotoDetail> {
  const formData = new FormData();
  formData.append("file", file);
  return request<PhotoDetail>("/photos", { method: "POST", body: formData });
}

export async function deletePhoto(id: number): Promise<void> {
  return request<void>(`/photos/${id}`, { method: "DELETE" });
}

// Comments
export async function createComment(
  photoId: number,
  content: string
): Promise<Comment> {
  return request<Comment>(`/photos/${photoId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function updateComment(
  commentId: number,
  content: string
): Promise<Comment> {
  return request<Comment>(`/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/comments/${commentId}`, { method: "DELETE" });
}
