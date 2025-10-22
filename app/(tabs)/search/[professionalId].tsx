// app/ProfessionalDetails.tsx
import apiClient from "@/api/apiClient";
import AppText from "@/components/ui/AppText";
import { getOrCreateRoom } from "@/src/services/chatService.native";
import { useUserDataStore } from "@/src/store/userDataStore";
import { router, useLocalSearchParams } from "expo-router";
import { Award, Book, Brain, Building2, Dumbbell, Mail, Phone, Rocket, Salad } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Address {
  street: string;
  city: string;
  cap: string;
  province: string;
  country: string;
}

type BadgeType = "salad" | "dumbbell" | "brain";

type Professional = {
  id: string;
  firstName: string;
  lastName: string;
  address: Address;
  profileImg: string | null;
  ambassador: boolean;
  specializations: string[];
  gender: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  certifications: Certification[];
  qualifications: Qualification[];
};

interface Certification {
  certificationName: string;
  issuingOrganization: string;
  level: string;
  certificationId: string;
  certificationUrl: string;
  issueDate: string;
  expirationDate: string;
}
interface Qualification {
  degreeTitle: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  completionDate: string;
}

export default function ProfessionalDetails() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const { user } = useUserDataStore();

  // Ottieni l'ID dai parametri di ricerca con Expo Router
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();

  useEffect(() => {
    const fetchProfessionals = async () => {
      //   console.log("Fetching professional with ID:", professionalId);
      try {
        setLoading(true);
        const resp = await apiClient.get(`/professionals/${professionalId}`);
        if (!resp.data) {
          throw new Error("Errore nel caricamento del professionista");
        } else {
          setProfessional(resp.data);
        }
      } catch (error) {
        console.error("Errore nel caricamento del professionista:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [professionalId]);

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
        return <Dumbbell size={20} color="white" />;
      case "brain":
        return <Brain size={20} color="white" />;
      case "salad":
        return <Salad size={20} color="white" />;
      default:
        return null;
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <AppText className=" mt-2">Caricamento...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!professional) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <AppText className="text-lg">Professionista non trovato</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const badges = getBadgesFromSpecializations(professional.specializations);

  // Handler per il click su "Chatta con il professionista"
  const handleChatPress = async () => {
    if (!user?._id || !professionalId) return;
    try {
      setChatLoading(true);
      const room = await getOrCreateRoom(professionalId as string, user._id as string);
      if (room && room.id) {
        // Prepara i dati del professionista per l'header della chat
        const chatUserData = {
          id: professionalId as string,
          name: `${professional.firstName} ${professional.lastName}`,
          avatar: professional.profileImg || undefined
        };
        
        // Naviga alla chat sostituendo la schermata corrente
        // In questo modo premendo "indietro" si torna alla lista chat
        router.replace({
          pathname: `/(tabs)/chat/[room]` as any,
          params: { 
            room: room.id.toString(),
            chatUser: JSON.stringify(chatUserData)
          }
        });
      } else {
        Alert.alert("Errore", "Impossibile avviare la chat.");
      }
    } catch (err) {
      console.error("Errore nella creazione/recupero room:", err);
      Alert.alert("Errore", "Impossibile avviare la chat.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header verde con immagine e nome */}
        <View className="bg-primary shadow-sm rounded-2xl p-6 mb-6 items-center">
          {/* Avatar */}
          <View className="w-24 h-24 rounded-full items-center justify-center mb-4 bg-muted-foreground overflow-hidden">
            {professional.profileImg ? (
              <Image source={{ uri: professional.profileImg }} className="w-24 h-24 rounded-full" resizeMode="cover" />
            ) : (
              <Text className="text-3xl font-bold text-primary-foreground">{getInitials(professional.firstName, professional.lastName)}</Text>
            )}
          </View>

          {/* Nome e Cognome */}
          <AppText w="bold" className="text-3xl font-bold text-white text-center mb-4">
            {professional.firstName} {professional.lastName}
          </AppText>

          {/* Badges Specializzazioni */}
          <View className="flex-row gap-3">
            {badges.map((badge: BadgeType, index: number) => (
              <View key={badge} className="w-12 h-12 bg-accent rounded-full items-center justify-center">
                {renderBadgeIcon(badge)}
              </View>
            ))}
          </View>
          <View className="mt-4">
            <TouchableOpacity onPress={handleChatPress} className="bg-secondary px-4 py-2 rounded-xl" disabled={chatLoading}>
              {chatLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppText w="semi" className=" text-center">
                  Chatta con il professionista
                </AppText>
              )}
            </TouchableOpacity>
          </View>
          {professional.ambassador === true && (
            <View className="absolute top-4 left-4 w-[120px] h-10 rounded-full items-center justify-center bg-orange-400">
              <View className="flex-row items-center">
                <Rocket size={20} color="white" />
                <AppText w="bold" className="text-white text-md">
                  Ambassador
                </AppText>
              </View>
            </View>
          )}
        </View>

        {/* Informazioni personali */}
        <View className="bg-card rounded-2xl p-6 mb-4 shadow-sm">
          <AppText w="semi" className="text-2xl text-primary mb-4">
            Informazioni
          </AppText>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2">
              <AppText className="text-muted-foreground">Data di nascita</AppText>
              <AppText>{formatDate(professional.dateOfBirth)}</AppText>
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row justify-between items-center py-2">
              <AppText className="text-muted-foreground">Genere</AppText>
              <AppText>{professional.gender === "male" ? "Uomo" : professional.gender === "female" ? "Donna" : "Non specificato"}</AppText>
            </View>

            <View className="h-px bg-border " />

            <View className="flex-row justify-between items-center py-2 ">
              <AppText className="text-muted-foreground">Posizione</AppText>
              <AppText>
                {professional.address?.city || "N/A"}, {professional.address?.province || "N/A"}
              </AppText>
            </View>
          </View>
        </View>

        {/* Contatti */}
        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <AppText w="semi" className="text-2xl text-primary mb-4">
            Contatti
          </AppText>

          <View className="space-y-4">
            {/* Email */}
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center mr-3">
                <Mail size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <AppText className="text-muted-foreground text-sm">Email</AppText>
                <AppText>{professional.email}</AppText>
              </View>
            </View>

            <View className="h-px bg-border ml-13 " />

            {/* Telefono */}
            <View className="flex-row items-center mt-3">
              <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center mr-3">
                <Phone size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <AppText className="text-muted-foreground text-sm">Cellulare</AppText>
                <AppText>{professional.phone}</AppText>
              </View>
            </View>
          </View>
        </View>
        {/* Certificazioni */}
        {professional.certifications && professional.certifications.length > 0 && (
          <View className="bg-card rounded-2xl p-6 shadow-sm mt-4">
            <View className="flex-row items-center mb-4">
              <Award size={24} color="#10b981" />
              <AppText w="semi" className="text-2xl text-primary ml-2">
                Certificazioni
              </AppText>
            </View>

            <View className="space-y-4">
              {professional.certifications.map((cert: Certification, index: number) => (
                <View key={`${cert.certificationId}-${index}`} className="border border-border my-3 rounded-xl p-4">
                  {/* Nome certificazione */}
                  <AppText className="text-lg  mb-2">{cert.certificationName}</AppText>

                  {/* Organizzazione */}
                  <View className="flex-row items-center mb-3">
                    <Building2 size={16} color="#64748b" />
                    <AppText className="text-muted-foreground ml-2">{cert.issuingOrganization}</AppText>
                  </View>

                  <View className="space-y-2">
                    {/* Livello */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">Livello</AppText>
                      <AppText>{cert.level}</AppText>
                    </View>

                    <View className="h-px bg-border" />

                    {/* Data rilascio */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">Data rilascio</AppText>
                      <AppText>{formatDate(cert.issueDate)}</AppText>
                    </View>

                    <View className="h-px bg-border" />

                    {/* Data scadenza */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">Data scadenza</AppText>
                      <AppText>{formatDate(cert.expirationDate)}</AppText>
                    </View>

                    <View className="h-px bg-border" />

                    {/* ID Certificazione */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">ID Certificazione</AppText>
                      <AppText>{cert.certificationId}</AppText>
                    </View>

                    {/* URL se presente */}
                    {cert.certificationUrl && (
                      <>
                        <View className="h-px bg-border" />
                        <View className="flex-row justify-between items-center py-1">
                          <AppText className="text-muted-foreground">URL</AppText>
                          <AppText className=" text-primary underline" numberOfLines={1}>
                            {cert.certificationUrl}
                          </AppText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Qualifications */}
        {professional.qualifications && professional.qualifications.length > 0 && (
          <View className="bg-card rounded-2xl p-6 shadow-sm mt-4">
            <View className="flex-row items-center mb-4">
              <Book size={24} color="#10b981" />
              <AppText w="semi" className="text-2xl text-primary ml-2">
                Titoli di studio
              </AppText>
            </View>

            <View className="space-y-4">
              {professional.qualifications.map((qual: Qualification, index: number) => (
                <View key={`qualifica-${index}`} className="border border-border my-3 rounded-xl p-4">
                  {/* titolo di studio e campo  */}
                  <AppText className="text-lg font-semibold text-card-foreground mb-2">
                    {qual.degreeTitle} in {qual.fieldOfStudy}
                  </AppText>

                  {/* istituzione  */}
                  <View className="flex-row items-center mb-3">
                    <Building2 size={16} color="#64748b" />
                    <AppText className="text-muted-foreground ml-2">{qual.institution}</AppText>
                  </View>

                  <View className="space-y-2">
                    {/* Data rilascio */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">Data inizio</AppText>
                      <AppText>{formatDate(qual.startDate)}</AppText>
                    </View>

                    <View className="h-px bg-border" />

                    {/* Data scadenza */}
                    <View className="flex-row justify-between items-center py-1">
                      <AppText className="text-muted-foreground">Data fine</AppText>
                      <AppText>{formatDate(qual.completionDate)}</AppText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
