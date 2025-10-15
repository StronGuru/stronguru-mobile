import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";

import { ExternalLink } from "lucide-react-native";

import { Image, Linking, ScrollView, TouchableOpacity, View } from "react-native";

export default function MyProteinDetailsPage() {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="w-80 h-10 overflow-hidden self-center my-4">
        <Image source={require("@/assets/images/myprotein.png")} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className=" rounded-3xl overflow-hidden shadow-sm my-4">
        <Image source={require("@/assets/images/bundle.avif")} className="w-full h-80" resizeMode="cover" />
      </View>

      <TouchableOpacity
        className="bg-primary rounded-full py-4 px-6 self-center flex-row items-center justify-center gap-3 shadow-sm mb-4"
        onPress={() => {
          Linking.openURL("https://www.myprotein.it/c/nutrition/");
        }}
      >
        <AppText w="semi" className="text-white text-xl">
          Shop MyProtein
        </AppText>
        <ExternalLink size={20} color="white" />
      </TouchableOpacity>

      <Card className="p-6 mb-5">
        <AppText w="semi" className="text-3xl mb-3">
          In partnership con MyProtein
        </AppText>

        <View className="gap-3">
          <AppText className="text-lg leading-relaxed">
            Siamo orgogliosi di collaborare con MyProtein, uno dei brand leader nel mondo della nutrizione sportiva.
          </AppText>
          <AppText className="text-lg leading-relaxed">
            Insieme condividiamo un’unica missione: aiutarti a raggiungere la tua migliore versione, con prodotti di qualità e performance reali.
          </AppText>
          <AppText className="text-lg leading-relaxed">
            Scopri i migliori integratori, snack proteici e prodotti per il recupero su myprotein.it e approfitta del nostro codice esclusivo.
          </AppText>
          <AppText className="text-lg leading-relaxed">
            Usa il codice sconto <AppText w="bold">STRONGURU</AppText> al checkout per ottenere uno sconto dedicato alla nostra community.
          </AppText>
          <AppText className="text-lg leading-relaxed">Allenati, nutri i tuoi progressi e trasforma il tuo percorso con Myprotein e Stronguru.</AppText>
        </View>
      </Card>
    </ScrollView>
  );
}
