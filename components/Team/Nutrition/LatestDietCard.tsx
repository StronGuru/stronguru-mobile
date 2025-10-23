import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { DietType } from "@/lib/zod/userSchemas";
import DietElementCard from "./DietElementCard";

interface LatestDietCardProps {
  diet: DietType;
  profileId: string;
}

export default function LatestDietCard({ diet, profileId }: LatestDietCardProps) {
  return (
    <Card className="my-6">
      <AppText w="semi" className="text-xl text-primary mb-3">
        La più recente
      </AppText>
      <DietElementCard diet={diet} profileId={profileId} variant="latest" />
    </Card>
  );
}
