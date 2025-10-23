import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { BiaEntryType, MeasurementEntryType } from "@/lib/zod/userSchemas";
import { useUserDataStore } from "@/src/store/userDataStore";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

const formatDate = (d?: string) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString("it-IT");
};

const getLatest = <T, K extends keyof T>(arr?: T[], dateKey?: K) => {
  if (!arr?.length || !dateKey) return null;
  return (
    arr.filter(Boolean).sort((a, b) => {
      const da = new Date(String(a[dateKey])).getTime() || 0;
      const db = new Date(String(b[dateKey])).getTime() || 0;
      return db - da;
    })[0] || null
  );
};

function HorizontalCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="bg-secondary dark:bg-primary shadow-sm rounded-2xl p-1 my-1 mr-1 ml-1 min-w-[90px] items-center">
      <AppText w="bold" className="text-lg  text-primary dark:text-card text-center">
        {value ?? "—"}
      </AppText>
      <AppText className="text-md text-muted-foreground dark:text-card text-center">{label}</AppText>
    </View>
  );
}

interface LatestMeasuresCardProps {
  profileId?: string;
}

export default function HorizontalCardsLayout({ profileId }: LatestMeasuresCardProps) {
  const { user } = useUserDataStore();

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
      <View className="bg-card p-4 rounded-lg my-6 mx-4 border border-secondary">
        <AppText w="semi" className="text-xl ">
          Ultime misurazioni
        </AppText>
        <AppText className="text-sm mt-1">Nessun dato disponibile.</AppText>
      </View>
    );
  }

  const { nutrition } = profileWithNutrition;
  const latestMeasurement = getLatest<MeasurementEntryType, "date">(nutrition.measurements, "date");
  const latestBia = getLatest<BiaEntryType, "examDate">(nutrition.bia, "examDate");

  return (
    <Card className="mt-4">
      <AppText w="semi" className="text-xl  text-primary">
        Ultime misurazioni
      </AppText>

      <View className=" mb-3">
        <AppText className="text-md  text-muted-foreground dark:text-foreground ">
          Ultima misurazione: {formatDate(latestMeasurement?.date)} • Ultima BIA: {formatDate(latestBia?.examDate)}
        </AppText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row ">
        <HorizontalCard label="Peso" value={latestMeasurement?.weightKg ? `${latestMeasurement.weightKg} kg` : "—"} />
        <HorizontalCard label="BMI" value={latestMeasurement?.bmi ?? "—"} />
        <HorizontalCard label="Vita" value={latestMeasurement?.waistCm ? `${latestMeasurement.waistCm} cm` : "—"} />
        <HorizontalCard label="M. grassa" value={latestBia?.fatMassKg ? `${latestBia.fatMassKg} kg` : "—"} />
        <HorizontalCard label="M. magra" value={latestBia?.leanMassKg ? `${latestBia.leanMassKg} kg` : "—"} />
        <HorizontalCard label="Metabolismo" value={latestBia?.basalMetabolismKg ? `${latestBia.basalMetabolismKg} kcal` : "—"} />
      </ScrollView>
    </Card>
  );
}
