import AppText from "@/components/ui/AppText";
import { TrainingPlanType } from "@/lib/zod/userSchemas";
import { useMemo } from "react";
import { FlatList, View } from "react-native";
import TrainingPlanElementCard from "./TrainingPlanElementCard";

interface AllTrainingsPlansCardProps {
  trainingPlans: TrainingPlanType[];
  profileId: string;
}

export default function AllTrainingPlansCard({ trainingPlans, profileId }: AllTrainingsPlansCardProps) {
  const sortedTrainingPlans = useMemo(() => {
    return [...trainingPlans].sort((a, b) => {
      // Ordina per createdAt decrescente (più recente prima)
      const aCreatedAt = new Date(a.createdAt || 0).getTime();
      const bCreatedAt = new Date(b.createdAt || 0).getTime();

      if (aCreatedAt !== bCreatedAt) {
        return bCreatedAt - aCreatedAt;
      }

      // Se stesso createdAt, ordina per nome
      return a.planName.localeCompare(b.planName);
    });
  }, [trainingPlans]);

  const renderTrainingPlanItem = ({ item }: { item: TrainingPlanType }) => (
    <View className="mb-3 mx-1 mt-1">
      <TrainingPlanElementCard trainingPlan={item} profileId={profileId} variant="list" />
    </View>
  );

  return (
    <View className="bg-card shadow-sm p-4 rounded-2xl my-4 border border-card dark:border-secondary">
      <AppText className="text-xl text-primary mb-2">Altri Piani di Allenamento • {sortedTrainingPlans.length}</AppText>
      <FlatList
        data={sortedTrainingPlans}
        renderItem={renderTrainingPlanItem}
        keyExtractor={(item) => item._id || item.planName}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
