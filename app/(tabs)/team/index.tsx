import ProfessionalCard from "@/components/Team/ProfessionalCardTeam";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { ProfileType } from "@/lib/zod/userSchemas";
import { useAuthStore } from "@/src/store/authStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dumbbell, Salad } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

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
    let dietsLabel = "";
    let measurementsLabel = "";
    if (hasNutrition) {
      const totalMeasurements = userProfiles.reduce((acc, p) => acc + (p.nutrition?.measurements?.length || 0), 0);
      const totalBia = userProfiles.reduce((acc, p) => acc + (p.nutrition?.bia?.length || 0), 0);
      const totalDiets = userProfiles.reduce((acc, p) => acc + (p.nutrition?.diets?.length || 0), 0);

      dietsLabel = totalDiets > 0 ? `${totalDiets}` : "0";
      measurementsLabel = totalMeasurements > 0 ? `${totalMeasurements}` : "0";

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
        trainingStats = `${totalTrainingPlans}`;
      }
    }

    return {
      nutrition: { available: hasNutrition, stats: nutritionStats, dietsLabel, measurementsLabel },
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
        <AppText w="semi" className="mt-4 text-lg">
          Caricamento del Team...
        </AppText>
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
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className=""
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
        <View className="bg-primary dark:bg-card dark:border-b dark:border-secondary pt-5 pb-[55px] px-6 shadow-sm">
          {/* Quick Stats in Hero */}
          <View className="flex-row gap-3">
            <Card className="bg-white dark:bg-input rounded-2xl px-4 py-3 flex-1 items-center">
              <AppText w="semi" className="text-primary text-2xl ">
                {availableServices.nutrition.dietsLabel}
              </AppText>
              <AppText w="semi" className="text-muted-foreground text-xs">
                Piani nutrizionali
              </AppText>
            </Card>
            <Card className="bg-white dark:bg-input  rounded-2xl px-4 py-3 flex-1 items-center">
              <AppText w="semi" className="text-primary text-2xl ">
                {availableServices.nutrition.measurementsLabel}
              </AppText>
              <AppText w="semi" className="text-muted-foreground text-xs">
                Misurazioni
              </AppText>
            </Card>
            <Card className="bg-white dark:bg-input rounded-2xl px-4 py-3 flex-1 items-center">
              <AppText w="semi" className="text-primary text-2xl ">
                {availableServices.training.stats ? availableServices.training.stats : "0"}
              </AppText>
              <AppText w="semi" className="text-muted-foreground text-xs">
                Allenamenti
              </AppText>
            </Card>
          </View>
        </View>

        {/* Team Section */}
        <Card className="mb-6 mt-[-29px] mx-4 gap-3">
          <AppText w="semi" className="text-xl">
            Il tuo Team
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6" contentContainerStyle={{ gap: 15 }}>
            {profiles.map((profile) => (
              <View key={profile._id} className="">
                <ProfessionalCard professional={profile.createdBy} />
              </View>
            ))}
          </ScrollView>
        </Card>

        {/* Services Section */}
        <View className=" flex-1 px-4 mb-4">
          <AppText w="semi" className="text-xl ">
            I tuoi Servizi
          </AppText>

          {hasAnyService ? (
            <View className=" mt-4 pb-8">
              {/* Logica per layout dinamico basato su numero di servizi */}
              {(() => {
                const activeServices = [availableServices.nutrition.available, availableServices.training.available].filter(Boolean);

                const isSingleService = activeServices.length === 1;

                return (
                  <>
                    {isSingleService ? (
                      /* Layout full-width se singolo servizio */
                      <View className="mb-4">
                        {/* Nutrizione - Full Width */}
                        {availableServices.nutrition.available && (
                          <TouchableOpacity onPress={handleNutritionPress} className="bg-primary rounded-3xl p-5 mb-4">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                                  <Salad size={24} color="#10b981" />
                                </View>
                                <Text className="text-white font-bold text-lg mb-1">Nutrizione</Text>
                                <Text className="text-white text-xs opacity-80">Dati, Grafici e Diete</Text>
                              </View>
                              <View className="items-center">
                                <View className="bg-white rounded-xl px-4 py-2">
                                  <Text className="text-primary font-bold text-2xl">{availableServices.nutrition.measurementsLabel}</Text>
                                </View>
                                <Text className="text-white text-xs mt-1">misurazioni</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}

                        {/* Allenamento - Full Width */}
                        {availableServices.training.available && (
                          <TouchableOpacity onPress={handleTrainingPress} className="bg-destructive rounded-3xl p-5 mb-4">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                                  <Dumbbell size={24} color="#ef4444" />
                                </View>
                                <Text className="text-white font-bold text-lg mb-1">Allenamenti</Text>
                                <Text className="text-white text-xs opacity-80">Schede fitness</Text>
                              </View>
                              <View className="items-center">
                                <View className="bg-white rounded-xl px-4 py-2">
                                  <Text className="text-red-500 font-bold text-2xl">{availableServices.training.stats}</Text>
                                </View>
                                <Text className="text-white text-xs mt-1">piani allenamento</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}

                        {/* Psicologia - Sempre Full Width */}
                        {/* <TouchableOpacity onPress={handlePsychologyPress} className="bg-blue-500 rounded-3xl p-5">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                                <Brain size={24} color="#3b82f6" />
                              </View>
                              <Text className="text-white font-bold text-lg mb-1">Psicologia</Text>
                              <Text className="text-white text-xs opacity-80">Supporto mentale e coaching</Text>
                            </View>
                            <View className="items-center">
                              <View className="bg-white rounded-xl px-4 py-2">
                                <Text className="text-blue-500 font-bold text-2xl">3</Text>
                              </View>
                              <Text className="text-white text-xs mt-1">sessioni</Text>
                            </View>
                          </View>
                        </TouchableOpacity> */}
                      </View>
                    ) : (
                      // Layout grid per più servizi
                      <View className="flex-row mb-4" style={{ gap: 12 }}>
                        {/* Nutrizione */}
                        {availableServices.nutrition.available && (
                          <TouchableOpacity onPress={handleNutritionPress} className="flex-1 bg-primary rounded-3xl p-5 shadow-sm">
                            <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                              <Salad size={24} color="#10b981" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-1">Nutrizione</Text>
                            <Text className="text-white text-sm mb-3">Dati, Grafici e Diete</Text>
                            <View className="flex-row items-center justify-between">
                              <View className="bg-white rounded-xl px-3 py-1">
                                <Text className="text-primary font-bold text-lg">{availableServices.nutrition.dietsLabel}</Text>
                              </View>
                              <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                          </TouchableOpacity>
                        )}

                        {/* Allenamento */}
                        {availableServices.training.available && (
                          <TouchableOpacity onPress={handleTrainingPress} className="flex-1 bg-destructive rounded-3xl p-5 shadow-sm">
                            <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                              <Dumbbell size={24} color="#ef4444" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-1">Allenamenti</Text>
                            <Text className="text-white text-sm mb-3">Schede fitness</Text>
                            <View className="flex-row items-center justify-between">
                              <View className="bg-white rounded-xl px-3 py-1">
                                <Text className="text-red-500 font-bold text-lg">{availableServices.training.stats}</Text>
                              </View>
                              <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                          </TouchableOpacity>
                        )}
                        {/* Psicologia */}
                        {/* {availableServices.psychology.available && (
                          <TouchableOpacity onPress={handlePsychologyPress} className="flex-1 bg-blue-500 rounded-3xl p-5 shadow-sm">
                            <View className="bg-white rounded-2xl w-12 h-12 items-center justify-center mb-3">
                              <Brain size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-1">Psicologia</Text>
                            <Text className="text-white text-sm mb-3">Supporto mentale e coaching</Text>
                            <View className="flex-row items-center justify-between">
                              <View className="bg-white rounded-xl px-3 py-1">
                                <Text className="text-blue-500 font-bold text-lg">{availableServices.psychology.stats}</Text>
                              </View>
                              <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                          </TouchableOpacity>
                        )} */}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          ) : (
            <View className="bg-muted p-6 rounded-2xl border border-secondary">
              <AppText className="text-foreground text-center text-lg">📋 Nessun servizio disponibile</AppText>
              <AppText className="text-foreground text-center mt-2">Connetti un professionista al tuo team per visualizzare i tuoi dati</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
