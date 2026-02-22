import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { fetchPhoto, deletePhoto } from "@/lib/api";
import { PhotoDetail, Comment } from "@/types";
import CommentSection from "@/components/CommentSection";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const photoId = Number(id);

  const [photo, setPhoto] = useState<PhotoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPhoto = useCallback(async () => {
    try {
      const data = await fetchPhoto(photoId);
      setPhoto(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    loadPhoto();
  }, [loadPhoto]);

  // 헤더 삭제 버튼
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} hitSlop={8}>
          <Text style={styles.deleteHeaderBtn}>삭제</Text>
        </Pressable>
      ),
    });
  }, [photo]);

  const handleDelete = () => {
    Alert.alert(
      "사진 삭제",
      "이 사진과 모든 코멘트가 삭제됩니다. 계속할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await deletePhoto(photoId);
            router.back();
          },
        },
      ]
    );
  };

  const handleCommentsChange = (comments: Comment[]) => {
    if (!photo) return;
    setPhoto({ ...photo, comments });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !photo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>사진을 불러올 수 없습니다.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Photo */}
      <Image
        source={{ uri: photo.s3_url }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.filename} numberOfLines={2}>
          {photo.original_filename}
        </Text>
        <Text style={styles.metaDetail}>
          {new Date(photo.created_at).toLocaleString("ko-KR")} ·{" "}
          {(photo.file_size / 1024).toFixed(1)} KB
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Comments */}
      <View style={styles.commentContainer}>
        <CommentSection
          photoId={photo.id}
          comments={photo.comments}
          onCommentsChange={handleCommentsChange}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#6b7280",
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 14,
    color: "#374151",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: "#111827",
  },
  meta: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filename: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  metaDetail: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
  commentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  deleteHeaderBtn: {
    fontSize: 15,
    color: "#ef4444",
    fontWeight: "500",
    marginRight: 4,
  },
});
