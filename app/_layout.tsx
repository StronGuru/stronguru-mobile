import { addNotificationListener, startBeams } from "@/api/pusherBeamsService";
import { useGlobalChatRealtime } from "@/hooks/use-global-chat-realtime";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { usePermissionsStore } from "@/src/store/permissionsStore";
import { Kanit_200ExtraLight, Kanit_400Regular, Kanit_600SemiBold, useFonts } from "@expo-google-fonts/kanit";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";

import { useHeroStore } from "@/src/store/heroStore";
import "./globals.css";

// Configura come gestire le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  // Hook globale per ascoltare messaggi in tempo reale e aggiornare badge
  useGlobalChatRealtime();
  const { isAuthenticated, isHydrated: authHydrated } = useAuthStore();
  const { hasCompletedOnboarding, isHydrated: onboardingHydrated } = useOnboardingStore();
  const { isHydrated: heroHydrated, fetchHero } = useHeroStore();
  const { requestNotificationPermission, notificationsGranted } = usePermissionsStore();

  const [fontsLoaded, fontError] = useFonts({
    Kanit_200ExtraLight,
    Kanit_400Regular,
    Kanit_600SemiBold
  });

  // Mantieni la splash fino a quando gli store non sono idratati
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);
  
  // Inizializza Pusher Beams all'avvio dell'app
  useEffect(() => {
    const initBeams = async () => {
      try {
        await startBeams();
        
        // Listener per notifiche in foreground (mostra Alert su Android)
        const subscription = await addNotificationListener((notification) => {
          if (Platform.OS === "android" && notification) {
            Alert.alert(
              notification?.title || "Nuova Notifica",
              notification?.body || notification?.message || "Hai ricevuto un messaggio",
              [{ text: "OK" }]
            );
          }
        });
        
        // Listener per notifiche ricevute (app in foreground)
        const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(() => {
          // Notifica ricevuta in foreground
        });

        // Listener per tap su notifica (app in background/killed)
        const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          
          // TODO: Naviga alla conversazione quando viene tappata
          if (data?.type === 'chat_message' && data?.conversationId) {
            // router.push(`/(tabs)/chat/${data.conversationId}`);
          }
        });
        
        // Cleanup al unmount
        return () => {
          subscription?.remove?.();
          notificationReceivedSubscription.remove();
          notificationResponseSubscription.remove();
        };
      } catch (error) {
        console.error("⚠️ Errore inizializzazione Beams all'avvio (non bloccante):", error);
        // Non blocca l'app se Beams fallisce
      }
    };
    
    initBeams();
  }, []);

  // Richiedi permessi notifiche all'avvio (dopo idratazione e autenticazione)
  useEffect(() => {
    const requestPermissions = async () => {
      if (authHydrated && isAuthenticated && Platform.OS === 'android') {
        try {
          await requestNotificationPermission();
        } catch (error) {
          console.error("❌ Errore richiesta permessi:", error);
        }
      }
    };
    
    requestPermissions();
  }, [authHydrated, isAuthenticated, requestNotificationPermission]);

  // Fetch Hero data al mount (solo se autenticato)
  useEffect(() => {
    if (authHydrated && isAuthenticated) {
      fetchHero();
    } else if (authHydrated && !isAuthenticated) {
      // Se non autenticato, segna Hero come hydrated senza fetch
      useHeroStore.setState({ isHydrated: true });
    }
  }, [authHydrated, isAuthenticated, fetchHero]);

  useEffect(() => {
    if (authHydrated && onboardingHydrated && heroHydrated && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authHydrated, onboardingHydrated, heroHydrated, fontsLoaded, fontError]);

  // Non renderizzare nulla finché gli store e i font non sono pronti (la splash native rimane visibile)
  if (!authHydrated || !onboardingHydrated || !heroHydrated || (!fontsLoaded && !fontError)) {
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
