import ThemeToggle from "@/components/ThemeToggle";
import AppText from "@/components/ui/AppText";
import { useAuthStore } from "@/src/store/authStore";
/* import { useOnboardingStore } from "@/src/store/onboardingStore"; */
import { useUserDataStore } from "@/src/store/userDataStore";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { FileText, Shield } from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, TouchableOpacity, View, useColorScheme } from "react-native";

export default function Settings() {
  const logoutUser = useAuthStore((state) => state.logoutUser);
  /*   const { setHasCompletedOnboarding } = useOnboardingStore(); */
  const user = useUserDataStore((state) => state.user);
  const colorScheme = useColorScheme();
  const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL as string;
  const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL as string; // cambia url in file env, qui è gia collegata

  /*   const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    // L'app mostrerà di nuovo l'onboarding
  }; */

  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("Logout completato"); // DEBUG
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  const openSocialLink = async (url: string, platform: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Errore", `Impossibile aprire ${platform}. Assicurati che l'app sia installata.`);
      }
    } catch (error) {
      console.error(`Errore nell'apertura di ${platform}:`, error);
      Alert.alert("Errore", `Impossibile aprire ${platform}.`);
    }
  };

  const openTermsLink = async (url: string, platform: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Errore", `Impossibile aprire ${platform}.`);
      }
    } catch (error) {
      console.error(`Errore nell'apertura di ${platform}:`, error);
      Alert.alert("Errore", `Impossibile aprire ${platform}.`);
    }
  };

  const openEmailClient = async () => {
    try {
      const emailUrl = "mailto:hello@stronguru.com?subject=Supporto Stronguru&body=Salve,%0D%0A%0D%0A";
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert("Errore", "Impossibile aprire il client di posta. Assicurati che sia configurato un client email.");
      }
    } catch (error) {
      console.error("Errore nell'apertura del client email:", error);
      Alert.alert("Errore", "Impossibile aprire il client di posta.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-8">
        {/* Appearance Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Aspetto
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Feather name="sun" size={20} color={colorScheme === "dark" ? "white" : "var(--color-primary)"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg ">Tema</AppText>
                  <AppText className="text-md text-muted-foreground">Scegli il tuo tema preferito</AppText>
                </View>
              </View>
              <ThemeToggle />
            </View>
          </View>
        </View>

        {/* Community Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Community
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <TouchableOpacity
              className="flex-row items-center justify-between py-3 border-b border-border"
              onPress={() => openSocialLink("https://instagram.com/stronguru_app", "Instagram")}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Feather name="instagram" size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Instagram</AppText>
                  <AppText className="text-md text-muted-foreground">Seguici su Instagram</AppText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={() => openSocialLink("https://linkedin.com/company/stronguru", "LinkedIn")}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Feather name="linkedin" size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">LinkedIn</AppText>
                  <AppText className="text-md text-muted-foreground">Connettiti con noi su LinkedIn</AppText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contacts Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Contatti
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <TouchableOpacity className="flex-row items-center justify-between py-3" onPress={openEmailClient}>
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-3">
                  <Feather name="mail" size={20} color={colorScheme === "dark" ? "white" : "var(--color-accent)"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Contatta Supporto</AppText>
                  <AppText className="text-md text-muted-foreground">Ottieni aiuto e supporto</AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Community Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Termini e Privacy
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <TouchableOpacity
              className="flex-row items-center justify-between py-3 border-b border-border"
              onPress={() => openTermsLink(TERMS_URL, "Termini e condizioni")}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <FileText size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Termini e Condizioni</AppText>
                  <AppText className="text-md text-muted-foreground">Visualizza i termini e condizioni</AppText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between py-3" onPress={() => openTermsLink(PRIVACY_URL, "Privacy Policy")}>
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Shield size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Privacy Policy</AppText>
                  <AppText className="text-md text-muted-foreground">Visualizza la nostra Privacy Policy</AppText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Management Section */}
        {/*  <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Gestione App
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <TouchableOpacity className="flex-row items-center justify-between py-3" onPress={resetOnboarding}>
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Feather name="refresh-cw" size={20} color={colorScheme === "dark" ? "white" : "var(--color-secondary-foreground)"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Ripristina Onboarding</AppText>
                  <AppText className="text-md text-muted-foreground">Mostra di nuovo le schermate di benvenuto</AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Account Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl  mb-4">
            Account
          </AppText>
          <View className="bg-card rounded-xl p-4 border border-border">
            <TouchableOpacity className="flex-row items-center justify-between py-3" onPress={handleLogout}>
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-destructive/10 items-center justify-center mr-3">
                  <Feather name="log-out" size={20} color={colorScheme === "dark" ? "white" : "var(--color-destructive)"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Logout</AppText>
                  <AppText className="text-md text-muted-foreground">{user?.email || "Esci dal tuo account"}</AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="items-center py-4">
          <AppText className="text-md text-muted-foreground">Stronguru Mobile</AppText>
          <AppText className="text-sm text-muted-foreground mt-1">Versione {Constants.expoConfig?.version || "1.0.0"}</AppText>
        </View>
      </View>
    </ScrollView>
  );
}
