import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadPhoto } from "@/lib/api";
import { PhotoListItem } from "@/types";
import { useState } from "react";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (photo: PhotoListItem) => void;
}

export default function UploadModal({
  visible,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (uri: string, filename: string, mimeType: string) => {
    setUploading(true);
    try {
      const photo = await uploadPhoto(uri, filename, mimeType);
      onSuccess({
        id: photo.id,
        original_filename: photo.original_filename,
        s3_url: photo.s3_url,
        thumbnail_url: photo.thumbnail_url,
        created_at: photo.created_at,
      });
    } catch (e) {
      Alert.alert("업로드 실패", e instanceof Error ? e.message : "다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.\n설정에서 허용해주세요.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? "image/jpeg";
      await handleUpload(asset.uri, filename, mimeType);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.\n설정에서 허용해주세요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? "image/jpeg";
      await handleUpload(asset.uri, filename, mimeType);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.uploadingText}>업로드 중...</Text>
            </View>
          ) : (
            <>
              <View style={styles.handle} />
              <Text style={styles.title}>사진 업로드</Text>

              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={openCamera}
              >
                <View style={styles.optionIcon}>
                  <Text style={styles.optionEmoji}>📷</Text>
                </View>
                <View>
                  <Text style={styles.optionLabel}>카메라로 촬영</Text>
                  <Text style={styles.optionDesc}>즉석에서 사진을 찍어 업로드</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={openGallery}
              >
                <View style={styles.optionIcon}>
                  <Text style={styles.optionEmoji}>🖼️</Text>
                </View>
                <View>
                  <Text style={styles.optionLabel}>갤러리에서 선택</Text>
                  <Text style={styles.optionDesc}>기기 앨범에서 사진 선택</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.optionPressed]}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  optionDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  uploadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  uploadingText: {
    fontSize: 15,
    color: "#6b7280",
  },
});
