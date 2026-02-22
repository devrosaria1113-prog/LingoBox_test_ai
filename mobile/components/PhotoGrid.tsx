import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { PhotoListItem } from "@/types";

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 4) / NUM_COLUMNS; // 2px gap each side

interface PhotoGridProps {
  photos: PhotoListItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
}

export default function PhotoGrid({
  photos,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
}: PhotoGridProps) {
  if (photos.length === 0 && !ListHeaderComponent) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>사진이 없습니다</Text>
        <Text style={styles.emptyDesc}>위 버튼으로 첫 사진을 업로드해보세요.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => String(item.id)}
      numColumns={NUM_COLUMNS}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>사진이 없습니다</Text>
          <Text style={styles.emptyDesc}>위 버튼으로 첫 사진을 업로드해보세요.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
          ]}
          onPress={() => router.push(`/photos/${item.id}`)}
        >
          <Image
            source={{ uri: item.thumbnail_url ?? item.s3_url }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
    backgroundColor: "#e5e7eb",
  },
  itemPressed: {
    opacity: 0.75,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
});
