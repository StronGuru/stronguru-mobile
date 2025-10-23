import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { useUserDataStore } from "@/src/store/userDataStore";
import React, { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import LatestComparisonChart from "./LatestComparisonChart";
import ProgressLineChart from "./ProgressLineChart";

interface NutritionChartsCardProps {
  profileId?: string;
}

type ChartType = "progress" | "comparison";

const chartOptions = [
  { key: "progress" as ChartType, label: "Peso" },
  { key: "comparison" as ChartType, label: "Confronto" }
];

export default function NutritionChartsCard({ profileId }: NutritionChartsCardProps) {
  const { user } = useUserDataStore();
  const [selectedChart, setSelectedChart] = useState<ChartType>("progress");

  const profileWithNutrition = useMemo(() => {
    if (!user?.profiles) return null;

    if (profileId) {
      return user.profiles.find((p) => p._id === profileId && p.nutrition) || null;
    } else {
      return user.profiles.find((p) => p.nutrition) || null;
    }
  }, [user?.profiles, profileId]);

  if (!profileWithNutrition?.nutrition) {
    return (
      <View className="bg-card p-4 rounded-lg my-6 border border-secondary">
        <AppText w="semi" className="text-xl ">
          Grafici Nutrizione
        </AppText>
        <AppText className="text-sm mt-1">Nessun dato disponibile.</AppText>
      </View>
    );
  }

  const { nutrition } = profileWithNutrition;

  const renderSelectedChart = () => {
    switch (selectedChart) {
      case "progress":
        return <ProgressLineChart nutrition={nutrition} />;
      case "comparison":
        return <LatestComparisonChart nutrition={nutrition} />;
      default:
        return <ProgressLineChart nutrition={nutrition} />;
    }
  };

  return (
    <Card className="my-6">
      {/* Custom Segmented Control */}
      <View className="flex-row bg-secondary dark:bg-input shadow-sm rounded-lg p-1 mb-6">
        {chartOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setSelectedChart(option.key)}
            className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-md ${selectedChart === option.key ? "bg-primary" : "bg-transparent"}`}
          >
            <AppText w="semi" className={`text-lg  ${selectedChart === option.key ? "text-primary-foreground" : "text-foreground"}`}>
              {option.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart selezionato */}
      {renderSelectedChart()}
    </Card>
  );
}
