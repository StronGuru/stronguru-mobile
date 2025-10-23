import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { useUserDataStore } from "@/src/store/userDataStore";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function TrainingSelector() {
  const { user } = useUserDataStore();

  const trainingProfiles = useMemo(() => user?.profiles?.filter((p) => p.training) || [], [user?.profiles]);

  const handleProfileSelect = (profileId: string) => {
    router.push(`/team/training?profileId=${profileId}`);
  };
  const getInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase();
  };

  return (
    <View className="flex-1 bg-background p-4 justify-center items-center">
      <View className="w-full max-w-sm">
        <AppText w="semi" className="text-primary text-2xl text-center mb-1 ">
          Hai più allenatori nel tuo team.
        </AppText>
        <AppText className="text-xl text-center mb-8">I dati di quale allenatore vuoi vedere?</AppText>

        <FlatList
          data={trainingProfiles}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleProfileSelect(item._id)} className="p-2 ">
              <Card className="shadow-sm flex-row items-center justify-center gap-4">
                <View className="w-16 h-16 rounded-full items-center justify-center bg-secondary overflow-hidden border border-border">
                  {item.createdBy?.profileImg ? (
                    <Image source={{ uri: item.createdBy.profileImg }} className="w-16 h-16 rounded-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-3xl text-primary dark:text-white ">{getInitials(item.createdBy?.firstName, item.createdBy?.lastName)}</Text>
                  )}
                </View>

                <AppText className="text-lg">
                  {item.createdBy?.firstName} {item.createdBy?.lastName}
                </AppText>
              </Card>
              {/* {item.createdBy?.specializations && <Text className="text-sm text-foreground mt-1">{item.createdBy.specializations.join(", ")}</Text>} */}
            </TouchableOpacity>
          )}
          className="w-full"
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}
