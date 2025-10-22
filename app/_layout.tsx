import { useGlobalChatRealtime } from "@/hooks/use-global-chat-realtime";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { Kanit_200ExtraLight, Kanit_400Regular, Kanit_600SemiBold, useFonts } from "@expo-google-fonts/kanit";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";

import "./globals.css";

export default function RootLayout() {
  // Hook globale per ascoltare messaggi in tempo reale e aggiornare badge
  useGlobalChatRealtime();
  const { isAuthenticated, isHydrated: authHydrated } = useAuthStore();
  const { hasCompletedOnboarding, isHydrated: onboardingHydrated } = useOnboardingStore();

  const [fontsLoaded, fontError] = useFonts({
    Kanit_200ExtraLight,
    Kanit_400Regular,
    Kanit_600SemiBold
  });

  // Mantieni la splash fino a quando gli store non sono idratati
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (authHydrated && onboardingHydrated && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authHydrated, onboardingHydrated, fontsLoaded, fontError]);

  // Non renderizzare nulla finché gli store e i font non sono pronti (la splash native rimane visibile)
  if (!authHydrated || !onboardingHydrated || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack>
          {/* Utente autenticato e onboard completo -> tabs */}
          <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>

          {/* Utente autenticato ma NON ha completato onboarding -> onboarding */}
          <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          </Stack.Protected>

          {/* Utente non autenticato -> auth flow */}
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
