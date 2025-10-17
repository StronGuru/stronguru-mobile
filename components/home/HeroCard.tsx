import { HeroType } from "@/src/types/heroTypes";
import { router } from "expo-router";
import { MoveRight } from "lucide-react-native";
import { Image, TouchableOpacity, View } from "react-native";
import AppText from "../ui/AppText";

interface HeroCardProps {
  hero: HeroType;
  onPress?: (hero: HeroType) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ hero, onPress }) => {
  const handlePress = () => {
    if (hero) {
      if (onPress) {
        onPress(hero);
      } else {
        // Passa solo l'oggetto hero serializzato
        router.push({
          pathname: `/(tabs)/home/hero-details`,
          params: {
            heroData: JSON.stringify(hero)
          }
        });
      }
    }
  };

  return (
    <TouchableOpacity className="mx-4 mt-8 mb-4" onPress={handlePress}>
      {/* imposta colore default se non presente da db */}
      <View className=" bg-blue-400 min-h-[170px] shadow-sm  rounded-3xl flex-row items-center gap-4 p-4 overflow-visible">
        <View className="w-2/3 shadow-sm">
          <AppText w="bold" className="text-2xl mb-1 text-white text-wrap">
            {hero.homeTitle}
          </AppText>
          <AppText w="semi" className="text-white text-lg">
            {hero.homeSubtitle.length > 65 ? hero.homeSubtitle.slice(0, 65) + "..." : hero.homeSubtitle}
          </AppText>
          <View className="flex-row items-center gap-2 mt-8">
            <AppText w="semi" className="text-white text-lg mb-1 ">
              Scopri di più
            </AppText>
            <MoveRight size={16} color="white" />
          </View>
        </View>
        <View className="w-1/3 relative">
          <Image
            source={{ uri: hero.homeImage }}
            resizeMode="contain"
            style={{
              width: 190,
              aspectRatio: 3 / 4, // mantiene proporzioni
              position: "absolute",
              bottom: -115, // fa "uscire" la testa sopra la card
              right: 10 // piccolo offset laterale
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HeroCard;
