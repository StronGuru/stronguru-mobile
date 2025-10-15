import ProfessionalCard from "@/components/Team/ProfessionalCardTeam";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { ProfileType } from "@/lib/zod/userSchemas";
import { useAuthStore } from "@/src/store/authStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, TouchableOpacity, View } from "react-native";

export default function Team() {
  const { userId } = useAuthStore();
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { fetchUserData } = useUserDataStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Calcola servizi disponibili
  const availableServices = useMemo(() => {
    const { user } = useUserDataStore.getState();
    const userProfiles = user?.profiles || [];

    const hasNutrition = userProfiles.some((p) => p.nutrition?._id);
    const hasTraining = userProfiles.some((p) => p.training?._id);
    const hasPsychology = userProfiles.some((p) => p.psychology?._id);

    // Calcola statistiche per nutrition
    let nutritionStats = "";
    if (hasNutrition) {
      const totalMeasurements = userProfiles.reduce((acc, p) => acc + (p.nutrition?.measurements?.length || 0), 0);
      const totalBia = userProfiles.reduce((acc, p) => acc + (p.nutrition?.bia?.length || 0), 0);
      const totalDiets = userProfiles.reduce((acc, p) => acc + (p.nutrition?.diets?.length || 0), 0);

      const statsParts: string[] = [];
      if (totalMeasurements > 0) statsParts.push(`${totalMeasurements} misurazioni`);
      if (totalBia > 0) statsParts.push(`${totalBia} BIA`);
      if (totalDiets > 0) statsParts.push(`${totalDiets} diete`);

      nutritionStats = statsParts.join(" • ");
    }

    // Calcola statistiche per training
    let trainingStats = "";
    if (hasTraining) {
      const totalTrainingPlans = userProfiles.reduce((acc, p) => acc + (p.training?.trainingPlans?.length || 0), 0);

      if (totalTrainingPlans > 0) {
        trainingStats = `${totalTrainingPlans} piani`;
      }
    }

    return {
      nutrition: { available: hasNutrition, stats: nutritionStats },
      training: { available: hasTraining, stats: trainingStats },
      psychology: { available: hasPsychology }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]); // Ricalcola quando cambiano i profiles

  // Fetch iniziale al mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await fetchUserData(userId);
        const latestUser = useUserDataStore.getState().user;
        setProfiles(latestUser?.profiles ?? []);
      } catch (error) {
        console.error("❌ Error fetching profiles:", error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Funzione per pull-to-refresh
  const onRefresh = async () => {
    if (!userId) return;

    try {
      setRefreshing(true);
      console.log("🔄 Refreshing team data...");
      await fetchUserData(userId);
      const latestUser = useUserDataStore.getState().user;
      setProfiles(latestUser?.profiles ?? []);
      console.log("✅ Team data refreshed");
    } catch (error) {
      console.error("❌ Error refreshing profiles:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNutritionPress = () => {
    const { user } = useUserDataStore.getState();
    const nutritionProfiles = user?.profiles?.filter((p) => p.nutrition?._id) || [];

    if (nutritionProfiles.length === 0) {
      // Nessun nutrizionista
      return;
    } else if (nutritionProfiles.length === 1) {
      // Un solo nutrizionista, vai diretto
      router.push(`/team/nutrition?profileId=${nutritionProfiles[0]._id}`);
    } else {
      // Più nutrizionisti, vai alla selezione
      router.push("/team/nutrition/selector");
    }
  };

  const handleTrainingPress = () => {
    const { user } = useUserDataStore.getState();
    const trainingProfiles = user?.profiles?.filter((p) => p.training?._id) || [];

    if (trainingProfiles.length === 0) {
      // Nessun allenatore
      return;
    } else if (trainingProfiles.length === 1) {
      // Un solo allenatore, vai diretto
      router.push(`/team/training?profileId=${trainingProfiles[0]._id}`);
    } else {
      // Più allenatori, vai alla selezione
      router.push("/team/training/selector");
    }
  };

  /*   const handlePsychologyPress = () => {
    const { user } = useUserDataStore.getState();
    const psychologyProfiles = user?.profiles?.filter((p) => p.psychology?._id) || [];

    if (psychologyProfiles.length === 0) {
      // Nessun psicologo
      return;
    } else if (psychologyProfiles.length === 1) {
      // Un solo psicologo, vai diretto
      router.push(`/team/psychology?profileId=${psychologyProfiles[0]._id}`);
    } else {
      // Più psicologi, vai alla selezione
      router.push("/team/psychology/selector");
    }
  }; */

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <AppText className="text-3xl">Nessun professionista collegato al tuo account.</AppText>
      </View>
    );
  }

  const hasAnyService = availableServices.nutrition.available || availableServices.training.available || availableServices.psychology.available;

  return (
    <SafeAreaView className="flex-1   bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981" // iOS spinner color
            colors={["#10b981"]} // Android spinner color
            title="Aggiornamento..." // iOS text (optional)
            titleColor="#10b981" // iOS text color (optional)
          />
        }
      >
        <Card className="flex-row flex-wrap mb-6 mt-2">
          <AppText w="semi" className="text-2xl text-primary">
            Il tuo Team
          </AppText>
          <View className="flex-row flex-wrap w-full">
            {profiles.map((profile) => (
              <View key={profile._id} className="w-[33.33%] ">
                <ProfessionalCard professional={profile.createdBy} />
              </View>
            ))}
          </View>
        </Card>

        <Card className="flex-1 ">
          <AppText w="semi" className=" text-primary text-2xl ">
            I tuoi Dati
          </AppText>

          {hasAnyService ? (
            <View className="shadow-sm">
              {/* Nutrition Button - mostra solo se disponibile */}
              {availableServices.nutrition.available && (
                <TouchableOpacity onPress={handleNutritionPress} className="mt-2 bg-muted dark:bg-primary rounded-2xl p-4 items-center border border-secondary">
                  <AppText className="text-primary dark:text-card text-2xl font-bold">Nutrizione</AppText>
                  {availableServices.nutrition.stats && (
                    <AppText className="text-primary dark:text-card text-sm mt-1">{availableServices.nutrition.stats}</AppText>
                  )}
                </TouchableOpacity>
              )}

              {/* Training Button - mostra solo se disponibile */}
              {availableServices.training.available && (
                <TouchableOpacity onPress={handleTrainingPress} className="mt-2 bg-muted dark:bg-primary rounded-xl p-4 items-center border border-secondary">
                  <AppText className="text-primary dark:text-card text-2xl font-bold">Allenamento</AppText>
                  {availableServices.training.stats && (
                    <AppText className="text-primary dark:text-card text-sm mt-1">{availableServices.training.stats}</AppText>
                  )}
                </TouchableOpacity>
              )}

              {/* Psychology Button - mostra solo se disponibile */}
              {/* {availableServices.psychology.available && (
                <TouchableOpacity
                  onPress={handlePsychologyPress}
                  className="mt-2 bg-muted dark:bg-primary rounded-2xl p-4 items-center border border-secondary"
                >
                  <AppText className="text-primary dark:text-card text-2xl font-bold">Psicologia</AppText>
                </TouchableOpacity>
              )} */}
            </View>
          ) : (
            <View className="bg-muted p-6 rounded-2xl border border-secondary">
              <AppText className="text-foreground text-center text-lg">📋 Nessun servizio disponibile</AppText>
              <AppText className="text-foreground text-center mt-2">Connetti un professionista al tuo team per visualizzare i tuoi dati</AppText>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
