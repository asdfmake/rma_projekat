import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

const GreenTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000",
    card: "#000",
    text: "#2ecc71",
    border: "#2ecc71",
    primary: "#2ecc71",
    notification: "#2ecc71",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={GreenTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
