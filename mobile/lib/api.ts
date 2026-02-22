import { API_URL } from "@/constants/api";
import { PhotoListItem, PhotoDetail, Comment } from "@/types";

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
export const fetchPhotos = (): Promise<PhotoListItem[]> =>
  request<PhotoListItem[]>("/photos");

export const fetchPhoto = (id: number): Promise<PhotoDetail> =>
  request<PhotoDetail>(`/photos/${id}`);

export async function uploadPhoto(
  uri: string,
  filename: string,
  mimeType: string
): Promise<PhotoDetail> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  return request<PhotoDetail>("/photos", {
    method: "POST",
    body: formData,
  });
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
