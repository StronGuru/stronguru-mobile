import { ProfessionalType } from "@/lib/zod/userSchemas";
import { useRouter } from "expo-router";
import { Brain, Dumbbell, Salad } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import AppText from "../ui/AppText";
type BadgeType = "salad" | "dumbbell" | "brain";

const ProfessionalCardTeam = ({ professional }: { professional: ProfessionalType }) => {
  const router = useRouter();

  const getInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase();
  };
  if (!professional || !professional.specializations) {
    return null;
  }

  const getBadgesFromSpecializations = (specializations: string[]): BadgeType[] => {
    const badges: BadgeType[] = [];

    if (specializations.includes("trainer")) {
      badges.push("dumbbell");
    }
    if (specializations.includes("psychologist")) {
      badges.push("brain");
    }
    if (specializations.includes("nutritionist")) {
      badges.push("salad");
    }

    return badges;
  };

  const renderBadgeIcon = (badge: BadgeType) => {
    switch (badge) {
      case "dumbbell":
        return <Dumbbell size={16} color="white" />;
      case "brain":
        return <Brain size={16} color="white" />;
      case "salad":
        return <Salad size={16} color="white" />;
      default:
        return null;
    }
  };

  const badges = getBadgesFromSpecializations(professional.specializations);

  return (
    <TouchableOpacity
      onPress={() => {
        router.push(`/team/${professional._id}` as any);
      }}
    >
      <View className="items-center mb-1 relative ">
        {/* Avatar */}
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-1 bg-secondary overflow-hidden border-2 ${
            professional.specializations.includes("nutritionist")
              ? "border-primary"
              : professional.specializations.includes("psychologist")
                ? "border-blue-500"
                : "border-destructive"
          }`}
        >
          {professional.profileImg ? (
            <Image source={{ uri: professional.profileImg }} className="w-24 h-24 rounded-full" resizeMode="cover" />
          ) : (
            <Text className="text-3xl font-bold text-primary dark:text-white ">{getInitials(professional.firstName, professional.lastName)}</Text>
          )}
        </View>

        {/* Badges */}
        <View className="absolute bottom-7 right-1 flex-row gap-2 ">
          {badges.map((badge: BadgeType, index: number) => (
            <View
              key={`${professional._id}-${badge}-${index}`}
              className={`w-8 h-8 ${
                professional.specializations.includes("nutritionist")
                  ? "bg-primary"
                  : professional.specializations.includes("psychologist")
                    ? "bg-blue-500"
                    : "bg-destructive"
              } rounded-full items-center justify-center`}
            >
              {renderBadgeIcon(badge)}
            </View>
          ))}
        </View>

        <View className="items-center  ">
          {/* Name */}
          <AppText w="semi" className="text-mdtext-center text-wrap">
            {professional.firstName} {professional.lastName}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProfessionalCardTeam;
