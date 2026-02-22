import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createComment(photoId, newContent.trim());
      onCommentsChange([...comments, comment]);
      setNewContent("");
    } catch {
      Alert.alert("오류", "코멘트 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: number) => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      const updated = await updateComment(commentId, editContent.trim());
      onCommentsChange(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch {
      Alert.alert("오류", "코멘트 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: number) => {
    Alert.alert("코멘트 삭제", "이 코멘트를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteComment(commentId);
          onCommentsChange(comments.filter((c) => c.id !== commentId));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      {editingId === item.id ? (
        <View style={styles.editRow}>
          <TextInput
            autoFocus
            value={editContent}
            onChangeText={setEditContent}
            style={styles.editInput}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={() => handleUpdate(item.id)}
          />
          <Pressable onPress={() => handleUpdate(item.id)} disabled={submitting}>
            <Text style={styles.saveBtn}>저장</Text>
          </Pressable>
          <Pressable onPress={() => setEditingId(null)}>
            <Text style={styles.cancelBtn}>취소</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.commentContent}>{item.content}</Text>
          <View style={styles.commentMeta}>
            <Text style={styles.commentDate}>
              {new Date(item.created_at).toLocaleString("ko-KR")}
            </Text>
            <View style={styles.commentActions}>
              <Pressable
                onPress={() => { setEditingId(item.id); setEditContent(item.content); }}
                hitSlop={8}
              >
                <Text style={styles.actionEdit}>수정</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                <Text style={styles.actionDelete}>삭제</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>
        코멘트{comments.length > 0 ? ` (${comments.length})` : ""}
      </Text>

      {comments.length === 0 && (
        <Text style={styles.emptyText}>첫 번째 코멘트를 남겨보세요.</Text>
      )}

      <FlatList
        data={comments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="코멘트를 입력하세요..."
          placeholderTextColor="#9ca3af"
          value={newContent}
          onChangeText={setNewContent}
          multiline
          editable={!submitting}
          returnKeyType="send"
          onSubmitEditing={handleCreate}
        />
        <Pressable
          style={[styles.submitBtn, (!newContent.trim() || submitting) && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={!newContent.trim() || submitting}
        >
          <Text style={styles.submitText}>등록</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 16,
  },
  commentItem: {
    paddingVertical: 10,
  },
  commentContent: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  commentDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionEdit: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionDelete: {
    fontSize: 12,
    color: "#ef4444",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#111827",
  },
  saveBtn: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  cancelBtn: {
    fontSize: 13,
    color: "#6b7280",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#111827",
    maxHeight: 100,
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
