import AppText from "@/components/ui/AppText";
import { TrainingPlanType } from "@/lib/zod/userSchemas";
import { useRouter } from "expo-router";
import { Calendar, Gauge, Target } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, useColorScheme, View } from "react-native";

interface TrainingPlanElementCardProps {
  trainingPlan: TrainingPlanType;
  profileId: string;
  variant?: "latest" | "list";
}

export default function TrainingPlanElementCard({ trainingPlan, profileId, variant = "list" }: TrainingPlanElementCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    router.push(`/team/training/training-plan/${trainingPlan._id}?profileId=${profileId}`);
  };

  return (
    <View className={`bg-muted p-4 shadow-sm rounded-2xl border border-card dark:border-secondary`}>
      {/* Header con titolo e status */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-1 mr-3">
          <AppText w="semi" className={` text-xl `}>
            {trainingPlan.planName}
          </AppText>
        </View>

        <TouchableOpacity onPress={handlePress} className="bg-primary px-5 py-3 rounded-lg">
          <AppText w="semi" className="text-primary-foreground text-lg">
            Mostra
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Info secondarie */}
      <View className="mt-1 gap-1">
        <View className="flex-row items-center">
          <Calendar size={14} color={colorScheme === "dark" ? "white" : "#000000"} />
          <AppText w="semi" className="text-md text-primary font-semibold ms-2">
            {trainingPlan.weeklyPlanning?.length || 0} {trainingPlan.weeklyPlanning?.length === 1 ? "settimana" : "settimane"}
          </AppText>
        </View>

        <View className="gap-0.5">
          <View className="flex-row items-center">
            <Target size={14} color={colorScheme === "dark" ? "white" : "#000000"} />
            <AppText className="text-md ms-2">{trainingPlan.goal}</AppText>
          </View>
          <View className="mx-2"></View>
          <View className="flex-row items-center">
            <Gauge size={14} color={colorScheme === "dark" ? "white" : "#000000"} />
            <AppText className="text-md  ms-2">{trainingPlan.level}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
