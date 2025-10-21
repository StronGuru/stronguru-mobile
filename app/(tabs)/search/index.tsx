import apiClient from "@/api/apiClient";
import AppText from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { Filter, MapPin, Rocket, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface Address {
  street: string;
  city: string;
  cap: string;
  province: string;
  country: string;
}

type Professional = {
  _id: string;
  firstName: string;
  lastName: string;
  address: Address;
  profileImg: string | null;
  ambassador: boolean;
  specializations: string[];
};

interface FilterOption {
  label: string;
  value: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const filterOptions: FilterOption[] = [
    { label: "Trainer", value: "trainer" },
    { label: "Nutrizionisti", value: "nutritionist" }
  ];

  const fetchProfessionals = async () => {
    try {
      console.log("🔄 Fetching professionals...");
      const resp = await apiClient.get("/professionals");
      if (!resp.data) {
        throw new Error("Errore nel caricamento dei professionisti");
      }
      setProfessionals(resp.data);
      console.log("✅ Professionals loaded:", resp.data.length);
    } catch (error) {
      console.error("❌ Error fetching professionals:", error);
    }
  };

  // Fetch iniziale al mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await fetchProfessionals();
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Funzione per pull-to-refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Refreshing professionals...");
      await fetchProfessionals();
    } finally {
      setRefreshing(false);
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getBackgroundColor = (professional: Professional): string => {
    return professional.ambassador ? "#8b5cf6" : "#64748b";
  };

  // ✅ Helper per ottenere immagine background in base alla specializzazione
  const getBackgroundImage = (specializations: string[]) => {
    // Priorità: nutritionist > trainer > psychologist
    if (specializations.includes("nutritionist")) {
      return require("@/assets/images/bg-nutrition.png");
    } else if (specializations.includes("trainer")) {
      return require("@/assets/images/bg-training.png");
    } else if (specializations.includes("psychologist")) {
      return require("@/assets/images/bg-psychology.png");
    }
    return null; // Fallback a colore solido
  };

  const handleFilterSelect = (option: FilterOption) => {
    setSelectedFilters((prev) => {
      if (prev.includes(option.value)) {
        //se gia presente rimuove
        return prev.filter((filter) => filter !== option.value);
      } else {
        return [...prev, option.value];
      }
    });
  };

  const removeFilter = (filterValue: string) => {
    setSelectedFilters((prev) => prev.filter((filter) => filter !== filterValue));
  };

  const filteredProfessionals = professionals
    .filter((professional) =>
      selectedFilters.length === 0 ? true : selectedFilters.some((selectedFilter) => professional.specializations.includes(selectedFilter))
    )
    .filter(
      (professional) =>
        professional.firstName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        professional.address?.city.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

  const ProfessionalCard = ({ professional }: { professional: Professional }) => {
    if (!professional || !professional.specializations) {
      return null;
    }
    const backgroundImage = getBackgroundImage(professional.specializations);

    return (
      <TouchableOpacity
        onPress={() => {
          router.push(`/search/${professional._id}` as any);
        }}
        className="shadow-sm"
      >
        <View className="bg-card border border-gray-200 dark:border-secondary rounded-xl mb-4 overflow-hidden">
          {/* ✅ Top section con background image */}
          <ImageBackground
            source={backgroundImage}
            resizeMode="cover"
            className="p-4 items-center min-h-[140px]"
            imageStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, opacity: 0.4 }}
          >
            {/* Fallback color layer se no immagine */}
            {!backgroundImage && <View className="absolute inset-0 rounded-t-xl" style={{ backgroundColor: getBackgroundColor(professional) }} />}

            {/* Ambassador Badge */}
            {professional.ambassador === true && (
              <View className="absolute top-4 left-4 w-8 h-8 rounded-full items-center justify-center bg-orange-400 shadow-md">
                <Rocket size={16} color="white" />
              </View>
            )}

            {/* Avatar */}
            <View
              className={`w-[100px] h-[100px] rounded-full items-center justify-center mb-1 mt-2 border-2 ${
                professional.specializations.includes("nutritionist")
                  ? "border-primary"
                  : professional.specializations.includes("psychologist")
                    ? "border-blue-500"
                    : "border-red-500"
              } shadow-md`}
              style={{ backgroundColor: getBackgroundColor(professional) }}
            >
              {professional.profileImg ? (
                <Image
                  source={{ uri: professional.profileImg }}
                  className={`w-[100px] h-[100px] rounded-full border-2 ${
                    professional.specializations.includes("nutritionist")
                      ? "border-primary"
                      : professional.specializations.includes("psychologist")
                        ? "border-blue-500"
                        : "border-red-500"
                  }`}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl font-bold text-white">{getInitials(professional.firstName, professional.lastName)}</Text>
              )}
            </View>
          </ImageBackground>

          {/* ✅ Bottom section - NO background image */}
          <View className="items-center mt-4">
            <AppText w="semi" className="text-lg mb-2 text-center">
              {professional.firstName} {professional.lastName}
            </AppText>

            {/* Location */}
            {professional.address?.city && (
              <View className="flex-row items-center mb-2">
                <MapPin size={14} color="#ef4444" />
                <AppText className="text-card-foreground text-sm ml-1">
                  {professional.address?.city}, {professional.address?.province || ""}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="bg-background px-4 py-3 border-b border-border">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-input rounded-lg px-3 mr-3">
            <Search size={20} color="#64748b" />
            <TextInput
              className="flex-1 ml-2 text-card-foreground"
              style={{
                minHeight: 40,
                fontSize: 16,
                fontFamily: "Kanit_400Regular"
              }}
              placeholder="Cerca professionisti per nome/città"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity className="p-2" onPress={() => setOpenFilter(true)}>
            <Filter size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters */}
      {selectedFilters.length > 0 && (
        <View className="px-4 py-2 bg-background">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {selectedFilters.map((filterValue, index) => {
                const filterOption = filterOptions.find((opt) => opt.value === filterValue);
                return (
                  <View key={`filter-${filterValue}-${index}`} className="flex-row items-center bg-secondary border border-border rounded-full px-3 py-1">
                    <AppText w="semi" className="text-secondary-foreground text-sm mr-2">
                      {filterOption?.label}
                    </AppText>
                    <TouchableOpacity onPress={() => removeFilter(filterValue)}>
                      <X size={16} color="#10b981" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <AppText className="mt-2">Caricamento professionisti...</AppText>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 py-4 bg-background"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={["#10b981"]}
              title="Aggiornamento..."
              titleColor="#10b981"
            />
          }
        >
          <View className="flex-row flex-wrap justify-between">
            {filteredProfessionals.length > 0 ? (
              filteredProfessionals.map((professional: Professional) => (
                <View key={professional._id} className="w-[48%]">
                  <ProfessionalCard professional={professional} />
                </View>
              ))
            ) : (
              <View className="w-full items-center justify-center py-12">
                <AppText className="text-muted-foreground text-lg">Nessun professionista trovato</AppText>
                {searchQuery && <AppText className="text-muted-foreground text-sm mt-2">Prova con un&apos;altra ricerca</AppText>}
              </View>
            )}
          </View>

          {/* Filter Modal */}
          <Modal visible={openFilter} transparent={true} animationType="fade" onRequestClose={() => setOpenFilter(false)}>
            <TouchableOpacity
              className="flex-1 bg-white/50 dark:bg-black/50 justify-center items-center"
              activeOpacity={1}
              onPress={() => setOpenFilter(false)}
            >
              <TouchableOpacity className="bg-popover rounded-xl p-4 shadow-sm mx-8 w-[85vw]" activeOpacity={1}>
                <View className="flex-row justify-between items-center mb-4">
                  <AppText w="semi" className="text-lg">
                    Filtra Professionisti
                  </AppText>
                  <TouchableOpacity onPress={() => setOpenFilter(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View className="flex gap-2 items-center justify-center p-6">
                  {filterOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-2 w-[50%] rounded-lg border ${
                        selectedFilters.includes(option.value) ? "bg-green-100 border-primary" : "bg-transparent border-border"
                      }`}
                      onPress={() => handleFilterSelect(option)}
                    >
                      <AppText
                        w="semi"
                        className={`text-lg ${selectedFilters.includes(option.value) ? "text-primary font-medium" : "text-popover-foreground"}`}
                      >
                        {option.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
