import AppText from "@/components/ui/AppText";
import { FoodItemType, MealType, SupplementationType } from "@/lib/zod/userSchemas";
import { Text, View } from "react-native";

interface MealSectionProps {
  meal: MealType | SupplementationType;
  isSupplementation?: boolean;
}

export default function MealSection({ meal, isSupplementation = false }: MealSectionProps) {
  const renderFoodItem = (item: FoodItemType, index: number) => (
    <View key={`${item._id}-${index}`} className="flex-row justify-between items-center border-b border-secondary last:border-b-0">
      <AppText className="text-lg flex-1 mr-2">• {item.description}</AppText>
      <Text className="text-foreground dark:text-accent font-medium">
        {item.quantity} {item.unit}
      </Text>
    </View>
  );

  const renderSection = (title: string, items: FoodItemType[], emptyText: string) => {
    if (items.length === 0) return null;

    return (
      <View className="mb-4">
        <AppText className="text-lg mb-2">{title} :</AppText>
        <View className="bg-secondary dark:bg-muted rounded-lg p-3 ">{items.map((item, index) => renderFoodItem(item, index))}</View>
      </View>
    );
  };

  if (isSupplementation) {
    const suppMeal = meal as SupplementationType;
    return (
      <View>
        {renderSection("Integratori", suppMeal.supplements, "Nessun integratore")}
        {renderSection("Alternative", suppMeal.substitutes, "Nessuna alternativa")}
      </View>
    );
  }

  const regularMeal = meal as MealType;
  return (
    <View>
      {renderSection("Alimenti Principali", regularMeal.foods, "Nessun alimento")}
      {renderSection("Alternative", regularMeal.substitutes, "Nessuna alternativa")}
    </View>
  );
}
