import apiClient from "@/api/apiClient";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { getOrCreateRoom } from "@/src/services/chatService.native";
import { useUserDataStore } from "@/src/store/userDataStore";
import { router, useLocalSearchParams } from "expo-router";
import { Award, Book, Building2, ExternalLink, Mail, MapPin, Phone, Rocket, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, Linking, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Address {
  street: string;
  city: string;
  cap: string;
  province: string;
  country: string;
}

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

const specializationLabels: Record<string, string> = {
  nutritionist: "Nutrizionista",
  trainer: "Allenatore",
  psychologist: "Psicologo"
};

export default function ProfessionalDetails() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const { user } = useUserDataStore();
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);

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

  const backgroundImage = getBackgroundImage(professional.specializations);

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
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          className="p-0 mb-4 items-center min-h-[140px] border border-border shadow-sm rounded-2xl  overflow-hidden"
          imageStyle={{ borderRadius: 12, opacity: 0.4 }}
        >
          {/* Avatar */}
          {/* ✅ Avatar cliccabile */}
          <TouchableOpacity
            onPress={() => professional.profileImg && setImageModalVisible(true)}
            activeOpacity={0.8}
            className={`w-52 h-52 rounded-full items-center justify-center my-8 bg-muted-foreground shadow-lg overflow-hidden border-2 ${
              professional.specializations.includes("nutritionist")
                ? "border-primary"
                : professional.specializations.includes("psychologist")
                  ? "border-blue-500"
                  : "border-red-500"
            }`}
          >
            {professional.profileImg ? (
              <Image source={{ uri: professional.profileImg }} className="w-52 h-52 rounded-full" resizeMode="cover" />
            ) : (
              <Text className="text-5xl font-bold text-white">{getInitials(professional.firstName, professional.lastName)}</Text>
            )}
          </TouchableOpacity>

          <Card className="w-full shadow-sm rounded-b-none px-6 ">
            {/* Nome e Cognome */}
            <AppText w="bold" className="text-3xl font-bold text-center ">
              {professional.firstName} {professional.lastName}
            </AppText>

            {professional.specializations?.length === 1 ? (
              <AppText w="semi" className="text-lg text-center">
                {specializationLabels[professional.specializations[0]] || professional.specializations[0]}
              </AppText>
            ) : (
              <View className="text-lg flex flex-wrap gap-1">
                {professional.specializations!.map((specialization, index) => (
                  <AppText w="semi" key={index} className="whitespace-nowrap">
                    {specializationLabels[specialization] || specialization}
                    {index < professional.specializations!.length - 1 && ","}
                  </AppText>
                ))}
              </View>
            )}
            <View className="flex-row justify-center items-center gap-1">
              <MapPin size={15} color={"red"} />
              <AppText className="text-center ">
                {professional.address?.city || "N/A"}, {professional.address?.province || "N/A"}
              </AppText>
            </View>

            <View className="mt-2">
              <TouchableOpacity onPress={handleChatPress} className="bg-primary px-4 py-2 rounded-xl" disabled={chatLoading}>
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppText w="semi" className="text-white text-center">
                    Chatta con il professionista
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </Card>
          {professional.ambassador === true && (
            <View className="absolute top-2 left-2 w-[120px] h-10 rounded-full items-center justify-center bg-orange-400">
              <View className="flex-row items-center">
                <Rocket size={20} color="white" />
                <AppText w="bold" className="text-white text-md ms-1">
                  Ambassador
                </AppText>
              </View>
            </View>
          )}
        </ImageBackground>

        {/* Contatti */}
        <Card className="">
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
        </Card>
        {/* Certificazioni */}
        {professional.certifications && professional.certifications.length > 0 && (
          <Card className=" mt-4">
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
                          <View className="flex-row items-center gap-1">
                            <AppText className="text-muted-foreground">Link</AppText>
                            <ExternalLink size={13} color="#64748b" />
                          </View>

                          <AppText className=" text-primary underline" numberOfLines={1} onPress={() => Linking.openURL(cert.certificationUrl)}>
                            {cert.certificationUrl}
                          </AppText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Qualifications */}
        {professional.qualifications && professional.qualifications.length > 0 && (
          <Card className="mt-4">
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
          </Card>
        )}
      </ScrollView>
      {/* ✅ Modal per preview immagine a schermo intero */}
      <Modal visible={imageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <View className="flex-1 bg-black/95 justify-center items-center">
          {/* Pulsante chiudi */}
          <TouchableOpacity
            onPress={() => setImageModalVisible(false)}
            className="absolute top-16 right-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center z-10"
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          {/* Immagine full-size */}
          {professional?.profileImg && <Image source={{ uri: professional.profileImg }} className="w-full h-full" resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
