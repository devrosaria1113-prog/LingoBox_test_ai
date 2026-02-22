import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#111827",
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#f9fafb" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "LingoBox" }}
        />
        <Stack.Screen
          name="photos/[id]"
          options={{ title: "사진 상세" }}
        />
      </Stack>
    </>
  );
}
