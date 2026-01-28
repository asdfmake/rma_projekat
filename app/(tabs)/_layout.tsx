import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen
        name="my-plants"
        options={{ title: "My Plants" }}
      />
      <Tabs.Screen
        name="plant-doctor"
        options={{ title: "Plant Doctor" }}
      />
    </Tabs>
  );
}
