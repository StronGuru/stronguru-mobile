import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PermissionsState {
  notificationsGranted: boolean | null;
  locationGranted: boolean | null;
  isHydrated: boolean;

  checkAllPermissions: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  requestLocationPermission: () => Promise<boolean>;
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set) => ({
      notificationsGranted: null,
      locationGranted: null,
      isHydrated: false,

      checkAllPermissions: async () => {
        try {
          console.log("🔄 Checking permissions status...");

          const notifStatus = await Notifications.getPermissionsAsync();
          const notifGranted = notifStatus.status === "granted";

          const locationStatus = await Location.getForegroundPermissionsAsync();
          const locGranted = locationStatus.status === "granted";

          set({
            notificationsGranted: notifGranted,
            locationGranted: locGranted
          });

          console.log("✅ Permissions checked:", { notifications: notifGranted, location: locGranted });
        } catch (error) {
          console.error("❌ Error checking permissions:", error);
        }
      },

      // ✅ FIX: Richiedi SEMPRE se non granted (mostra dialog nativo anche se denied prima)
      requestNotificationPermission: async () => {
        try {
          console.log("🔄 Requesting notification permission...");

          const { status: existingStatus } = await Notifications.getPermissionsAsync();

          if (existingStatus === "granted") {
            console.log("✅ Notification permission already granted");
            set({ notificationsGranted: true });
            return true;
          }

          // ✅ Richiedi sempre (anche se denied prima - iOS/Android mostreranno Settings se necessario)
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          const granted = newStatus === "granted";

          set({ notificationsGranted: granted });

          if (granted) {
            console.log("✅ Notification permission granted");
          } else {
            console.log("❌ Notification permission denied (status:", newStatus, ")");
          }

          return granted;
        } catch (error) {
          console.error("❌ Error requesting notification permission:", error);
          return false;
        }
      },

      requestLocationPermission: async () => {
        try {
          console.log("🔄 Requesting location permission...");

          const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

          if (existingStatus === "granted") {
            console.log("✅ Location permission already granted");
            set({ locationGranted: true });
            return true;
          }

          // ✅ Richiedi sempre (anche se denied prima)
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          const granted = newStatus === "granted";

          set({ locationGranted: granted });

          if (granted) {
            console.log("✅ Location permission granted");
          } else {
            console.log("❌ Location permission denied (status:", newStatus, ")");
          }

          return granted;
        } catch (error) {
          console.error("❌ Error requesting location permission:", error);
          return false;
        }
      }
    }),
    {
      name: "permissions-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          // ✅ Check permessi dopo hydration
          state.checkAllPermissions();
        }
      }
    }
  )
);
