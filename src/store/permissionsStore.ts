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
          const notifStatus = await Notifications.getPermissionsAsync();
          const notifGranted = notifStatus.status === "granted";

          const locationStatus = await Location.getForegroundPermissionsAsync();
          const locGranted = locationStatus.status === "granted";

          set({
            notificationsGranted: notifGranted,
            locationGranted: locGranted
          });
        } catch (error) {
          console.error("❌ Error checking permissions:", error);
        }
      },

      // ✅ FIX: Richiedi SEMPRE se non granted (mostra dialog nativo anche se denied prima)
      requestNotificationPermission: async () => {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();

          if (existingStatus === "granted") {
            set({ notificationsGranted: true });
            return true;
          }

          const { status: newStatus } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          const granted = newStatus === "granted";

          set({ notificationsGranted: granted });

          return granted;
        } catch (error) {
          console.error("❌ Error requesting notification permission:", error);
          return false;
        }
      },

      requestLocationPermission: async () => {
        try {
          const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

          if (existingStatus === "granted") {
            set({ locationGranted: true });
            return true;
          }

          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          const granted = newStatus === "granted";

          set({ locationGranted: granted });

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
