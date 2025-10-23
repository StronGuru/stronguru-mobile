import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

export default function TeamLayout() {
  const colorScheme = useColorScheme();

  const colors = {
    light: {
      background: "#10b981",
      border: "#e5e7eb"
    },
    dark: {
      background: "#1e293b",
      border: "#94a3b8"
    }
  };
  const currentColors = colors[colorScheme ?? "light"];
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#fff",
        headerStyle: { backgroundColor: currentColors.background },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          fontFamily: "Kanit_400Regular"
        },
        headerBackTitleStyle: { fontFamily: "Kanit_400Regular" }
      }}
    >
      <Stack.Screen name="index" options={{ title: "Team", headerShadowVisible: false }} />
      <Stack.Screen name="nutrition/index" options={{ title: "Dati Nutrizione", headerBackTitle: "Indietro" }} />
      <Stack.Screen name="nutrition/selector" options={{ title: "" }} />
      <Stack.Screen name="nutrition/diet/[dietId]" options={{ title: "Dettagli Dieta", headerBackTitle: "Indietro" }} />
      <Stack.Screen name="psychology" options={{ title: "Psicologia" }} />
      <Stack.Screen name="training/index" options={{ title: "Allenamento" }} />
      <Stack.Screen name="training/selector" options={{ title: "" }} />
      <Stack.Screen name="training/training-plan/[trainingPlanId]" options={{ title: "Scheda" }} />
      <Stack.Screen name="[professionalId]" options={{ title: "Dettagli Professionista" }} />
    </Stack>
  );
}
