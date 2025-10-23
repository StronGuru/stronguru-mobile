import AppText from "@/components/ui/AppText";
import { MealType, SupplementationType, WeeklyPlanItemType } from "@/lib/zod/userSchemas";
import { getAutoSelectedMeal, getCurrentMealTime, hasMealContent } from "@/utils/mealUtils";
import { Apple, ChevronDown, ChevronUp, Coffee, Cookie, Moon, Pill, UtensilsCrossed } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import MealSection from "./MealSection";

interface DayPlanViewProps {
  dayPlan: WeeklyPlanItemType;
  weeklyPlan?: any;
  scrollViewRef?: React.RefObject<any>;
}

const mealLabels = {
  breakfast: { label: "Colazione", Icon: Coffee, time: "06:00 - 10:00" },
  morningSnack: { label: "Spuntino Mattina", Icon: Apple, time: "10:01 - 12:00" },
  lunch: { label: "Pranzo", Icon: UtensilsCrossed, time: "12:01 - 15:00" },
  afternoonSnack: { label: "Spuntino Pomeriggio", Icon: Cookie, time: "15:01 - 18:00" },
  dinner: { label: "Cena", Icon: Moon, time: "18:01 - 22:00" },
  supplementation: { label: "Integratori", Icon: Pill, time: "Durante il giorno" }
};

export default function DayPlanView({ dayPlan, weeklyPlan, scrollViewRef }: DayPlanViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const mealRefs = useRef<Record<string, View | null>>({});
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Auto-selezione con gestione fallback
  useEffect(() => {
    if (hasAutoSelected) return;

    let mealToSelect: string | null = null;

    if (!weeklyPlan) {
      const currentMeal = getCurrentMealTime();
      if (currentMeal && hasMealContent(dayPlan.plan[currentMeal as keyof typeof dayPlan.plan])) {
        mealToSelect = currentMeal;
      }
    } else {
      const autoSelection = getAutoSelectedMeal(weeklyPlan, dayPlan);
      if (autoSelection) {
        mealToSelect = autoSelection.meal;
      }
    }

    if (mealToSelect) {
      setExpandedSections(new Set([mealToSelect]));
      // Scroll dopo un breve delay per permettere il rendering
      setTimeout(() => scrollToMeal(mealToSelect!), 400);
    }

    setHasAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayPlan, weeklyPlan, hasAutoSelected]);

  const scrollToMeal = (mealKey: string) => {
    const targetRef = mealRefs.current[mealKey];
    if (!targetRef || !scrollViewRef?.current) return;

    targetRef.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 50),
          animated: true
        });
      },
      () => {} // Error callback vuoto
    );
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const hasMealContentLocal = (meal: MealType) => {
    return meal.foods.length > 0 || meal.substitutes.length > 0;
  };

  const hasSupplementContent = (supp: SupplementationType) => {
    return supp.supplements.length > 0 || supp.substitutes.length > 0;
  };

  const setMealRef = (mealKey: string) => (ref: View | null) => {
    mealRefs.current[mealKey] = ref;
  };

  const renderMealAccordion = (mealKey: keyof typeof mealLabels, meal: MealType | SupplementationType, isSupplementation = false) => {
    const mealInfo = mealLabels[mealKey];
    const isExpanded = expandedSections.has(mealKey);
    const hasContent = isSupplementation ? hasSupplementContent(meal as SupplementationType) : hasMealContentLocal(meal as MealType);

    if (!hasContent) {
      return (
        <View key={mealKey} ref={setMealRef(mealKey)} className="bg-muted p-4 rounded-2xl mb-3 border border-card dark:border-secondary opacity-50">
          <View className="flex-row items-center">
            <mealInfo.Icon size={24} color="#9ca3af" />
            <View className="flex-1 ms-3">
              <AppText className="text-lg">{mealInfo.label}</AppText>
            </View>
            <AppText className="text-sm">Non definito</AppText>
          </View>
        </View>
      );
    }

    return (
      <View key={mealKey} ref={setMealRef(mealKey)} className="bg-card p-4 shadow-sm rounded-2xl mb-3 border border-card dark:border-secondary">
        <TouchableOpacity onPress={() => toggleSection(mealKey)} className="flex-row items-center">
          <mealInfo.Icon size={24} color="#10b981" />
          <View className="flex-1 ms-3">
            <AppText w="semi" className="text-lg ">
              {mealInfo.label}
            </AppText>
          </View>
          {isExpanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#10b981" />}
        </TouchableOpacity>

        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-secondary">
            <MealSection meal={meal} isSupplementation={isSupplementation} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="px-4 pb-8">
      {renderMealAccordion("breakfast", dayPlan.plan.breakfast)}
      {renderMealAccordion("morningSnack", dayPlan.plan.morningSnack)}
      {renderMealAccordion("lunch", dayPlan.plan.lunch)}
      {renderMealAccordion("afternoonSnack", dayPlan.plan.afternoonSnack)}
      {renderMealAccordion("dinner", dayPlan.plan.dinner)}
      {renderMealAccordion("supplementation", dayPlan.plan.supplementation, true)}
    </View>
  );
}
