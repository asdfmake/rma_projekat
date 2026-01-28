import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen
          name="weather"
          options={{
            title: "Weather",
            tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🌤️</Text>,
          }}
      />

      <Tabs.Screen
        name="my-plants"
        options={{
          title: "My Plants",
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🪴</Text>,
        }}
      />

      <Tabs.Screen
        name="plant-doctor"
        options={{
          title: "Plant Doctor",
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🩺</Text>,
        }}
      />
    </Tabs>
  );
}
