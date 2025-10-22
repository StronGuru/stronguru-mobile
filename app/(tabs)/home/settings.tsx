import ThemeToggle from "@/components/ThemeToggle";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/src/store/authStore";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { usePermissionsStore } from "@/src/store/permissionsStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native"; // ✅ Import corretto
import Constants from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { FileText, Shield } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Alert, AppState, Platform, ScrollView, Switch, TouchableOpacity, View, useColorScheme } from "react-native";

export default function Settings() {
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const { setHasCompletedOnboarding } = useOnboardingStore();
  const user = useUserDataStore((state) => state.user);
  const colorScheme = useColorScheme();
  const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL as string;
  const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL as string;
  const isFocused = useIsFocused();
  const { notificationsGranted, locationGranted, requestNotificationPermission, requestLocationPermission, checkAllPermissions } = usePermissionsStore();
  const router = useRouter(); // ✅ Router per navigazione
  const appState = useRef(AppState.currentState); // ✅ Track app state
  // ✅ SOLUZIONE: Detect ritorno da background (OS Settings) + redirect a Home
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // App torna in foreground DA background
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("🔄 App returned from background - checking if on Settings screen...");

        if (isFocused) {
          console.log("✅ User is on Settings screen - redirecting to Home to refresh permissions...");
          // Redirect a Home (permissionsStore checkAllPermissions si triggera su mount Home)
          router.replace("/(tabs)/home");
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, router]);

  // ✅ Check permessi quando Settings screen diventa focused (navigazione interna)
  useEffect(() => {
    if (isFocused) {
      console.log("🔄 Settings screen focused - refreshing permissions...");
      checkAllPermissions();
    }
  }, [isFocused, checkAllPermissions]);

  const resetOnboarding = () => {
    console.log("🔄 Resetting onboarding...");
    setHasCompletedOnboarding(false);
    console.log("✅ Onboarding reset - will show on next launch");
  };

  // ✅ Helper per aprire Settings app specifiche (non generiche device)
  const openAppSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        // iOS: apre Settings > [Nome App]
        console.log("🔄 Opening iOS app settings...");
        const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || "stronguru-test";
        await Linking.openURL(`app-settings:${bundleId}`); //controlla se errore apertura in deploy
      } else if (Platform.OS === "android") {
        // Android: apre Settings > Apps > [Nome App]
        console.log("🔄 Opening Android app settings...");
        const pkg = Constants.expoConfig?.android?.package || "com.stronguru.mobile";
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, { data: `package:${pkg}` });
      }
      console.log("✅ App settings opened");
    } catch (error) {
      console.error("❌ Error opening app settings:", error);
      Alert.alert("Errore", "Impossibile aprire le impostazioni dell'app.");
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🔄 Logging out...");
      await logoutUser();
      console.log("✅ Logout completato");
    } catch (error) {
      console.error("❌ Errore durante il logout:", error);
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
      console.error(`❌ Errore nell'apertura di ${platform}:`, error);
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
      console.error(`❌ Errore nell'apertura di ${platform}:`, error);
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
      console.error("❌ Errore nell'apertura del client email:", error);
      Alert.alert("Errore", "Impossibile aprire il client di posta.");
    }
  };

  // ✅ Handler notifiche SEMPLIFICATO
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // ✅ ATTIVAZIONE: mostra dialog nativo (requestPermission gestisce tutto)
      console.log("🔄 User toggled notifications ON - requesting permission...");
      const granted = await requestNotificationPermission();

      if (!granted) {
        // ✅ Se negato, offri Settings (iOS/Android potrebbero non mostrare più dialog dopo prima negazione)
        console.log("⚠️ Permission denied - offering Settings redirect");
        Alert.alert("Permesso Negato", "Per attivare le notifiche, vai nelle impostazioni dell'app.", [
          { text: "Annulla", style: "cancel" },
          { text: "Apri Impostazioni", onPress: () => openAppSettings() }
        ]);
      }
      // Se granted=true, lo switch si aggiorna automaticamente via store
    } else {
      // ✅ DISATTIVAZIONE: vai in Settings (non si può revocare da app)
      console.log("🔄 User toggled notifications OFF - redirecting to Settings");
      Alert.alert("Disattiva Notifiche", "Per disattivare le notifiche, vai nelle impostazioni dell'app.", [
        { text: "Annulla", style: "cancel" },
        { text: "Apri Impostazioni", onPress: () => openAppSettings() }
      ]);
    }
  };

  // ✅ Handler posizione SEMPLIFICATO
  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      console.log("🔄 User toggled location ON - requesting permission...");
      const granted = await requestLocationPermission();

      if (!granted) {
        console.log("⚠️ Permission denied - offering Settings redirect");
        Alert.alert("Permesso Negato", "Per attivare la posizione, vai nelle impostazioni dell'app.", [
          { text: "Annulla", style: "cancel" },
          { text: "Apri Impostazioni", onPress: () => openAppSettings() }
        ]);
      }
    } else {
      console.log("🔄 User toggled location OFF - redirecting to Settings");
      Alert.alert("Disattiva Posizione", "Per disattivare la posizione, vai nelle impostazioni dell'app.", [
        { text: "Annulla", style: "cancel" },
        { text: "Apri Impostazioni", onPress: () => openAppSettings() }
      ]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-8">
        {/* Appearance Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Aspetto
          </AppText>
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Feather name="sun" size={20} color={colorScheme === "dark" ? "white" : "var(--color-primary)"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Tema</AppText>
                  <AppText className="text-md text-muted-foreground">Scegli il tuo tema preferito</AppText>
                </View>
              </View>
              <ThemeToggle />
            </View>
          </Card>
        </View>

        {/* Autorizzazioni Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Autorizzazioni
          </AppText>
          <Card>
            {/* Posizione */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Feather name="map-pin" size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Posizione</AppText>
                  <AppText className="text-md text-muted-foreground">
                    {locationGranted ? "Accesso alla posizione attivo" : "Consenti l'accesso alla posizione"}
                  </AppText>
                </View>
              </View>
              <Switch
                value={locationGranted || false}
                onValueChange={handleLocationToggle}
                trackColor={{ false: "#e2e8f0", true: "#10b981" }}
                thumbColor={locationGranted ? "#fff" : "#64748b"}
                ios_backgroundColor={colorScheme === "dark" ? "#334155" : "#e2e8f0"}
              />
            </View>

            {/* Notifiche */}
            <View className="flex-row items-center justify-between pt-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Feather name="bell" size={24} color={colorScheme === "dark" ? "white" : "black"} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Notifiche</AppText>
                  <AppText className="text-md text-muted-foreground">{notificationsGranted ? "Notifiche attive" : "Consenti l'invio di notifiche"}</AppText>
                </View>
              </View>
              <Switch
                value={notificationsGranted || false}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#e2e8f0", true: "#10b981" }}
                thumbColor={notificationsGranted ? "#fff" : "#64748b"}
                ios_backgroundColor={colorScheme === "dark" ? "#334155" : "#e2e8f0"}
              />
            </View>
          </Card>
        </View>

        {/* Community Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Community
          </AppText>
          <Card>
            <TouchableOpacity
              className="flex-row items-center justify-between pb-3 border-b border-border"
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
              className="flex-row items-center justify-between pt-3"
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
          </Card>
        </View>

        {/* Contatti Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Contatti
          </AppText>
          <Card>
            <TouchableOpacity className="flex-row items-center justify-between" onPress={openEmailClient}>
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
          </Card>
        </View>

        {/* Termini e Privacy Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Termini e Privacy
          </AppText>
          <Card>
            <TouchableOpacity
              className="flex-row items-center justify-between pb-3 border-b border-border"
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

            <TouchableOpacity className="flex-row items-center justify-between pt-3" onPress={() => openTermsLink(PRIVACY_URL, "Privacy Policy")}>
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
          </Card>
        </View>

        {/* App Management Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Gestione App
          </AppText>
          <Card>
            <TouchableOpacity className="flex-row items-center justify-between" onPress={resetOnboarding}>
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
          </Card>
        </View>

        {/* Account Section */}
        <View className="mb-8">
          <AppText w="semi" className="text-xl mb-4">
            Account
          </AppText>
          <Card>
            <TouchableOpacity className="flex-row items-center justify-between" onPress={handleLogout}>
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-destructive/10 items-center justify-center mr-3">
                  <Feather name="log-out" size={20} color={colorScheme === "dark" ? "white" : ""} />
                </View>
                <View className="flex-1">
                  <AppText className="text-lg">Logout</AppText>
                  <AppText className="text-md text-muted-foreground">{user?.email || "Esci dal tuo account"}</AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colorScheme === "dark" ? "white" : "var(--color-muted-foreground)"} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Version Info */}
        <View className="items-center py-4">
          <AppText className="text-md text-muted-foreground">Stronguru Mobile</AppText>
          <AppText className="text-sm text-muted-foreground mt-1">Versione {Constants.expoConfig?.version || "1.0.0"}</AppText>
        </View>
      </View>
    </ScrollView>
  );
}
