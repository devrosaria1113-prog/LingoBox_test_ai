"use client";

import { useState } from "react";
import { Comment } from "@/types";
import { createComment, updateComment, deleteComment } from "@/lib/api";

interface CommentSectionProps {
  photoId: number;
  comments: Comment[];
  onCommentsChange: (comments: Comment[]) => void;
}

export default function CommentSection({
  photoId,
  comments,
  onCommentsChange,
}: CommentSectionProps) {
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = await createComment(photoId, newContent.trim());
      onCommentsChange([...comments, comment]);
      setNewContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId: number) => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await updateComment(commentId, editContent.trim());
      onCommentsChange(
        comments.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("코멘트를 삭제할까요?")) return;
    await deleteComment(commentId);
    onCommentsChange(comments.filter((c) => c.id !== commentId));
  };

  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        코멘트 {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {/* Comment List */}
      <ul className="space-y-3 mb-6">
        {comments.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-4">
            첫 번째 코멘트를 남겨보세요.
          </li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="bg-gray-50 rounded-xl px-4 py-3">
            {editingId === comment.id ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(comment.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  onClick={() => handleUpdate(comment.id)}
                  disabled={isSubmitting}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-700 flex-1 break-words">
                  {comment.content}
                </p>
                <div className="flex gap-2 shrink-0 pt-0.5">
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">
              {new Date(comment.created_at).toLocaleString("ko-KR")}
            </p>
          </li>
        ))}
      </ul>

      {/* New Comment Form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="코멘트를 입력하세요..."
          className="flex-1 text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newContent.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          등록
        </button>
      </form>
    </div>
  );
}
