import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { DietType } from "@/lib/zod/userSchemas";
import { useMemo } from "react";
import { FlatList, View } from "react-native";
import DietElementCard from "./DietElementCard";

interface AllDietsCardProps {
  diets: DietType[];
  profileId: string;
}

export default function AllDietsCard({ diets, profileId }: AllDietsCardProps) {
  const sortedDiets = useMemo(() => {
    return [...diets].sort((a, b) => {
      const aStartDate = new Date(a.startDate).getTime();
      const bStartDate = new Date(b.startDate).getTime();

      // Prima ordina per startDate decrescente (più recente prima)
      if (aStartDate !== bStartDate) {
        return bStartDate - aStartDate;
      }

      // Se stesso startDate, ordina per endDate decrescente
      const aEndDate = new Date(a.endDate).getTime();
      const bEndDate = new Date(b.endDate).getTime();
      return bEndDate - aEndDate;
    });
  }, [diets]);

  const renderDietItem = ({ item }: { item: DietType }) => (
    <View className="mb-3 mx-1 mt-1">
      <DietElementCard diet={item} profileId={profileId} variant="list" />
    </View>
  );

  return (
    <Card className="mt-1">
      <AppText w="semi" className="text-xl text-primary mb-2">
        Altre Diete • {sortedDiets.length}
      </AppText>
      <FlatList data={sortedDiets} renderItem={renderDietItem} keyExtractor={(item) => item._id} scrollEnabled={false} showsVerticalScrollIndicator={false} />
    </Card>
  );
}
