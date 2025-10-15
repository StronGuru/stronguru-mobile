import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

export default function HomeLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#1e293b" : "#10b981"
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          fontFamily: "Kanit_400Regular"
        },
        headerBackTitleStyle: { fontFamily: "Kanit_400Regular" }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="hero-details"
        options={{
          headerShown: true,
          title: "Dettagli",
          headerBackTitle: "Home"
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: "Impostazioni",
          headerBackTitle: "Home"
        }}
      />
      <Stack.Screen
        name="profile-page"
        options={{
          headerShown: true,
          title: "Il tuo Profilo",
          headerBackTitle: "Home"
        }}
      />
      <Stack.Screen
        name="mindfulness/index"
        options={{
          headerShown: true,
          title: "Mindfulness",
          headerBackTitle: "Home"
        }}
      />
      <Stack.Screen
        name="mindfulness/breathing/breathingAnimation"
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: "Indietro"
        }}
      />
      <Stack.Screen
        name="trainings/trainingsHome"
        options={{
          headerShown: true,
          title: "Trainings",
          headerBackTitle: "Home"
        }}
      />
      <Stack.Screen
        name="myprotein-details"
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: "Home"
        }}
      />
    </Stack>
  );
}
