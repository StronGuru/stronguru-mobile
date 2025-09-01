import ThemeToggle from "@/components/ThemeToggle";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../src/store/authStore";

export default function Settings() {
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("Logout completato"); // DEBUG
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-5 bg-background">
      <Text className="text-base text-foreground mb-4">Settings</Text>
      <ThemeToggle />
      <TouchableOpacity className="mt-6 px-4 py-3 rounded-md bg-destructive" onPress={handleLogout}>
        <Text className="font-bold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
