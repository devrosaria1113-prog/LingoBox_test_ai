import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchPhotos } from "@/lib/api";
import { PhotoListItem } from "@/types";
import PhotoGrid from "@/components/PhotoGrid";
import UploadModal from "@/components/UploadModal";

export default function FeedScreen() {
  const [photos, setPhotos] = useState<PhotoListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      const data = await fetchPhotos();
      setPhotos(data);
    } catch (e) {
      Alert.alert("오류", "사진 목록을 불러오지 못했습니다.");
    }
  }, []);

  // 화면 포커스 시마다 새로고침
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handleUploadSuccess = (newPhoto: PhotoListItem) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setShowUpload(false);
  };

  const ListHeader = (
    <View style={styles.header}>
      <Text style={styles.count}>총 {photos.length}장</Text>
      <Pressable
        style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
        onPress={() => setShowUpload(true)}
      >
        <Text style={styles.uploadBtnText}>+ 사진 업로드</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <PhotoGrid
        photos={photos}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListHeaderComponent={ListHeader}
      />

      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={handleUploadSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  count: {
    fontSize: 13,
    color: "#6b7280",
  },
  uploadBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.75,
  },
  uploadBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
