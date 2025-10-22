import { useOnboardingStore } from "@/src/store/onboardingStore";
import { usePermissionsStore } from "@/src/store/permissionsStore"; // ✅ Import store
import { Bell, ChevronLeft, ChevronRight, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresPermissions?: boolean;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: "Benvenuto in Stronguru!",
    description: "Sei pronto a iniziare il tuo percorso verso una vita più sana e attiva. Scopri tutto quello che puoi fare con la nostra app.",
    icon: <Image source={require("@/assets/images/onboarding/welcome.png")} style={{ width: 190, height: 190 }} />
  },
  {
    id: 2,
    title: "Trova il tuo Pro",
    description:
      "Connettiti con professionisti qualificati che ti aiuteranno a raggiungere i tuoi obiettivi. Scegli tra Nutrizionisti e Personal Trainer nella tua zona e crea il tuo team di esperti.",
    icon: <Image source={require("@/assets/images/onboarding/search.png")} style={{ width: 190, height: 190 }} />
  },
  {
    id: 3,
    title: "Segui i tuoi progressi",
    description: "Monitora i tuoi miglioramenti e mantieni il tuo percorso di allenamento sempre sotto controllo. Ogni piccolo passo conta!",
    icon: <Image source={require("@/assets/images/onboarding/progress.png")} style={{ width: 190, height: 190 }} />
  },
  {
    id: 4,
    title: "Personalizza la tua esperienza",
    description: "Attiva le notifiche e la posizione per ricevere aggiornamenti personalizzati e trovare i professionisti più vicini a te.",
    icon: <Image source={require("@/assets/images/onboarding/permission.png")} style={{ width: 190, height: 190 }} />,

    requiresPermissions: true
  }
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setHasCompletedOnboarding } = useOnboardingStore();

  // ✅ Usa store invece di state locale
  const { notificationsGranted, locationGranted, requestNotificationPermission, requestLocationPermission } = usePermissionsStore();

  const nextSlide = () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // ✅ Aggiornato per usare store actions
  const requestPermissions = async () => {
    try {
      console.log("🔄 Requesting permissions from onboarding...");

      // Richiedi notifiche
      const notifGranted = await requestNotificationPermission();

      // Richiedi posizione
      const locGranted = await requestLocationPermission();

      if (notifGranted || locGranted) {
        Alert.alert("Perfetto!", "Hai attivato i permessi. Potrai sempre modificarli dalle impostazioni.", [{ text: "Continua", onPress: completeOnboarding }]);
      } else {
        Alert.alert("Nessun problema!", "Potrai attivare i permessi in qualsiasi momento dalle impostazioni dell'app.", [
          { text: "Continua", onPress: completeOnboarding }
        ]);
      }
    } catch (error) {
      console.error("❌ Error requesting permissions:", error);
      completeOnboarding(); // Continua comunque
    }
  };

  const completeOnboarding = () => {
    console.log("✅ Onboarding completed");
    setHasCompletedOnboarding(true);
  };

  const skipOnboarding = () => {
    console.log("⏭️ Onboarding skipped");
    setHasCompletedOnboarding(true);
  };

  const handleNext = () => {
    if (isLastSlide && currentData.requiresPermissions) {
      requestPermissions();
    } else if (isLastSlide) {
      completeOnboarding();
    } else {
      nextSlide();
    }
  };

  const currentData = onboardingData[currentSlide];
  const isLastSlide = currentSlide === onboardingData.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Skip Button */}
        <View className="flex-row justify-end p-4">
          <TouchableOpacity onPress={skipOnboarding} className="px-4 py-2">
            <Text className="text-muted-foreground dark:text-primary font-medium">Salta</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Icon */}
          <View className="w-80 h-80 items-center justify-center mb-7 rounded-full bg-white overflow-hidden">{currentData.icon}</View>

          {/* Title */}
          <Text className="text-3xl font-bold text-primary text-center mb-6">{currentData.title}</Text>

          {/* Description */}
          <Text className="text-lg text-foreground text-center leading-relaxed max-w-sm px-4">{currentData.description}</Text>

          {/* ✅ Permissions Status (usa store invece di state locale) */}
          {currentData.requiresPermissions && (
            <View className="flex-col mt-8 gap-3">
              <View className="flex-row items-center justify-center">
                <Bell size={20} color={notificationsGranted ? "#059669" : "#6b7280"} />
                <Text className={`ml-2 ${notificationsGranted ? "text-primary" : "text-muted-foreground"}`}>
                  Notifiche {notificationsGranted ? "attivate" : ""}
                </Text>
              </View>
              <View className="flex-row items-center justify-center">
                <MapPin size={20} color={locationGranted ? "#059669" : "#6b7280"} />
                <Text className={`ml-2 ${locationGranted ? "text-primary" : "text-muted-foreground"}`}>Posizione {locationGranted ? "attivata" : ""}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Section - invariato */}
        <View className="p-6">
          <View className="flex-row justify-center items-center mb-8">
            {onboardingData.map((_, index) => (
              <View key={index} className={`w-3 h-3 rounded-full mx-1 ${index === currentSlide ? "bg-primary" : "bg-muted-foreground"}`} />
            ))}
          </View>

          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={prevSlide}
              disabled={currentSlide === 0}
              className={`flex-row items-center px-4 py-3 rounded-lg ${currentSlide === 0 ? "opacity-50" : ""}`}
            >
              <ChevronLeft size={20} color={currentSlide === 0 ? "#9ca3af" : "#059669"} />
              <Text className={`ml-2 font-medium ${currentSlide === 0 ? "text-muted-foreground" : "text-primary"}`}>Indietro</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} className="flex-row items-center px-6 py-3 bg-primary rounded-xl shadow-sm">
              <Text className="text-white text-lg mr-1">{isLastSlide ? (currentData.requiresPermissions ? "Attiva permessi" : "Inizia") : "Avanti"}</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
