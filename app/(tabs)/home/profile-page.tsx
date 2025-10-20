import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { ProfileFormSchema, ProfileFormType } from "@/lib/zod/userSchemas";
import { useUserDataStore } from "@/src/store/userDataStore";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Edit, MapPin, Phone, User } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export const GENDER_OPTIONS = [
  /* { value: "", label: "Seleziona genere" }, */
  { value: "male", label: "Uomo" },
  { value: "female", label: "Donna" },
  { value: "other", label: "Altro" }
];

export default function ProfilePage() {
  const { user, updateUserProfile } = useUserDataStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

  const form = useForm<ProfileFormType>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      dateOfBirth: user?.dateOfBirth || "",
      gender: user?.gender,
      address: {
        street: user?.address?.street || "",
        city: user?.address?.city || "",
        cap: user?.address?.cap || "",
        province: user?.address?.province || "",
        country: user?.address?.country || ""
      },
      phone: user?.phone || ""
    }
  });
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName || !lastName) return "NN";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  const formatDateOfBirth = (dateString?: string): string => {
    if (!dateString) return "Non specificata";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data non valida";
    }
  };
  const getDropdownStyles = (fieldState: any) => {
    const isDark = colorScheme === "dark";

    return {
      container: [
        dropdownStyles.container,
        {
          // ✅ Usa i valori hex diretti dal tailwind.config.js
          backgroundColor: isDark
            ? "#334155" // --color-input dal tailwind config
            : "#f1f5f9" // bg-slate-100
        },
        fieldState.error
          ? dropdownStyles.containerError
          : {
              borderColor: isDark
                ? "#e2e8f0" // --color-border dal tailwind config
                : "#e2e8f0" // border-slate-200
            }
      ],
      placeholder: {
        fontSize: 14,
        color: isDark
          ? "#6b7280" // --color-muted-foreground dal tailwind config
          : "#94a3b8",
        fontFamily: "Kanit_200ExtraLight" // text-slate-400
      },
      selectedText: {
        fontSize: 14,
        color: isDark
          ? "#f1f5f9" // --color-foreground dal tailwind config
          : "#0f172a", // text-foreground
        fontFamily: "Kanit_200ExtraLight"
      }
    };
  };

  const onSubmit = async (data: ProfileFormType) => {
    console.log("📝 Partito il submit del form da pagina profilo:", data);
    setIsLoading(true);
    try {
      await updateUserProfile(data);
      setIsEditing(false);
    } catch (error: any) {
      console.error("❌ Update failed:", error.message);
      alert(`Errore nella modifica del profilo. Riprova più tardi.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView>
          <View className="px-4 py-8 gap-5">
            <View className="items-center justify-center">
              <View className="w-40 h-40 rounded-full items-center justify-center mb-4 bg-border">
                {/* {user && user?.profileImg ? (
              <Image source={{ uri: user.profileImg }} className="w-40 h-40 rounded-full" resizeMode="cover" />
            ) : (
              <Text className="text-4xl font-bold text-white">{getInitials(user?.firstName, user?.lastName)}</Text>
            )} */}
                <Text className="text-4xl font-bold text-white">{getInitials(user?.firstName, user?.lastName)}</Text>
              </View>
              <AppText w="semi" className="text-2xl  mb-1">
                {user?.firstName} {user?.lastName}
              </AppText>
              <AppText className="text-lg">{user?.email}</AppText>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg px-4 py-3 flex-row items-center justify-center gap-2 self-center"
              onPress={() => setIsEditing(true)}
              style={{ display: isEditing ? "none" : "flex" }}
            >
              <Edit size={20} color="white" />
              <AppText w="semi" className="text-white text-lg">
                Modifica profilo
              </AppText>
            </TouchableOpacity>

            {!isEditing ? (
              <Card className="gap-4">
                <View className="flex-row items-center gap-4 px-1">
                  <View className="w-10 h-10 bg-secondary dark:bg-accent rounded-full items-center justify-center">
                    <Phone size={20} color={colorScheme === "dark" ? "white" : "#10b981"} />
                  </View>
                  <View className="flex-1">
                    <AppText w="semi" className="text-lg ">
                      Telefono
                    </AppText>
                    <AppText className="text-lg text-muted-foreground">{user?.phone || "Non specificato"}</AppText>
                  </View>
                </View>

                <View className="flex-row items-center gap-4 px-1">
                  <View className="w-10 h-10 bg-secondary dark:bg-accent rounded-full items-center justify-center">
                    <Calendar size={20} color={colorScheme === "dark" ? "white" : "#10b981"} />
                  </View>
                  <View className="flex-1">
                    <AppText w="semi" className="text-lg">
                      Data di nascita
                    </AppText>
                    <AppText className="text-lg text-muted-foreground">{formatDateOfBirth(user?.dateOfBirth)}</AppText>
                  </View>
                </View>

                <View className="flex-row items-center gap-4 px-1">
                  <View className="w-10 h-10 bg-secondary dark:bg-accent rounded-full items-center justify-center">
                    <User size={20} color={colorScheme === "dark" ? "white" : "#10b981"} />
                  </View>
                  <View className="flex-1">
                    <AppText w="semi" className="text-lg">
                      Genere
                    </AppText>
                    <AppText className="text-lg text-muted-foreground">
                      {user?.gender === "male" ? "Uomo" : user?.gender === "female" ? "Donna" : user?.gender === "other" ? "Altro" : "Non specificato"}
                    </AppText>
                  </View>
                </View>

                <View className="flex-row items-center gap-4 px-1">
                  <View className="w-10 h-10 bg-secondary dark:bg-accent rounded-full items-center justify-center">
                    <MapPin size={20} color={colorScheme === "dark" ? "white" : "#10b981"} />
                  </View>
                  <View className="flex-1">
                    <AppText w="semi" className="text-lg">
                      Indirizzo
                    </AppText>
                    <AppText className="text-lg text-muted-foreground">
                      {user?.address
                        ? [user.address.street, user.address.city, user.address.cap, user.address.province, user.address.country].filter(Boolean).join(", ")
                        : "Non specificato"}
                    </AppText>
                  </View>
                </View>
              </Card>
            ) : (
              <Card>
                <AppText w="semi" className="text-xl mb-4 ">
                  Modifica i tuoi dati
                </AppText>
                <Controller
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText className="text-lg mb-2">Nome</AppText>
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci il tuo nome"
                        value={field.value}
                        onChangeText={field.onChange}
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />
                <Controller
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText className="text-lg mb-2">Cognome</AppText>
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci il tuo cognome"
                        value={field.value}
                        onChangeText={field.onChange}
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText className="text-lg mb-2">Telefono</AppText>
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci il tuo numero di telefono"
                        value={field.value}
                        onChangeText={field.onChange}
                        keyboardType="phone-pad"
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <Text className="text-red-500 text-xs mt-1">{fieldState.error.message}</Text>}
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field, fieldState }) => (
                    <View className=" flex-row items-center justify-between mb-2">
                      <AppText className="text-lg mb-2">Data di nascita</AppText>
                      {Platform.OS === "ios" ? (
                        // iOS: DateTimePicker sempre visibile

                        <DateTimePicker
                          value={field.value ? new Date(field.value) : new Date()}
                          mode="date"
                          display="compact"
                          onChange={(event, selectedDate) => {
                            if (selectedDate && event.type !== "dismissed") {
                              field.onChange(selectedDate.toISOString().split("T")[0]);
                            }
                          }}
                          maximumDate={new Date()}
                          style={{ backgroundColor: "transparent" }}
                        />
                      ) : (
                        // Android: TouchableOpacity + DateTimePicker modal
                        <>
                          <TouchableOpacity
                            className={`bg-slate-100 rounded-lg p-3 border flex-row justify-between items-center ${
                              fieldState.error ? "border-red-500" : "border-slate-200"
                            }`}
                            onPress={() => setShowDatePicker(true)}
                          >
                            <AppText className={field.value ? "text-foreground" : "text-slate-400"}>
                              {field.value ? new Date(field.value).toLocaleDateString("it-IT") : "Seleziona data di nascita"}
                            </AppText>
                            <Calendar size={20} className="text-slate-400" />
                          </TouchableOpacity>

                          {showDatePicker && (
                            <DateTimePicker
                              value={field.value ? new Date(field.value) : new Date()}
                              mode="date"
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate && event.type !== "dismissed") {
                                  field.onChange(selectedDate.toISOString().split("T")[0]);
                                }
                              }}
                              maximumDate={new Date()}
                            />
                          )}
                        </>
                      )}
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field, fieldState }) => {
                    const styles = getDropdownStyles(fieldState);

                    return (
                      <View className="mb-4">
                        <AppText className="text-lg mb-2">Genere</AppText>
                        <Dropdown
                          style={styles.container}
                          placeholderStyle={styles.placeholder}
                          selectedTextStyle={styles.selectedText}
                          itemTextStyle={dropdownStyles.itemText}
                          itemContainerStyle={dropdownStyles.itemContainer}
                          containerStyle={dropdownStyles.modalContainer}
                          mode="modal"
                          data={GENDER_OPTIONS}
                          maxHeight={300}
                          labelField="label"
                          valueField="value"
                          placeholder="Seleziona genere"
                          value={field.value}
                          onChange={(item) => field.onChange(item.value)}
                        />
                        {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                      </View>
                    );
                  }}
                />

                <AppText className="text-lg mb-2">Indirizzo</AppText>

                <Controller
                  control={form.control}
                  name="address.street"
                  render={({ field, fieldState }) => (
                    <View className="mb-3">
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Via / indirizzo"
                        value={field.value || ""}
                        onChangeText={field.onChange}
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="address.city"
                  render={({ field, fieldState }) => (
                    <View className="mb-3">
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Città"
                        value={field.value || ""}
                        onChangeText={field.onChange}
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                <View className="flex-row gap-3">
                  <Controller
                    control={form.control}
                    name="address.cap"
                    render={({ field, fieldState }) => (
                      <View className="flex-1 mb-3">
                        <TextInput
                          className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                          placeholder="CAP"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          keyboardType="numeric"
                          style={{ fontFamily: "Kanit_200ExtraLight" }}
                        />
                        {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                      </View>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="address.province"
                    render={({ field, fieldState }) => (
                      <View className="flex-1 mb-3">
                        <TextInput
                          className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                          placeholder="Provincia"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          autoCapitalize="characters"
                          style={{ fontFamily: "Kanit_200ExtraLight" }}
                          maxLength={2}
                        />
                        {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                      </View>
                    )}
                  />
                </View>

                <Controller
                  control={form.control}
                  name="address.country"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <TextInput
                        className={`bg-slate-100 dark:bg-input dark:text-foreground  rounded-lg p-3 border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Paese"
                        value={field.value || ""}
                        onChangeText={field.onChange}
                        style={{ fontFamily: "Kanit_200ExtraLight" }}
                      />
                      {fieldState.error && <AppText className="text-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                <View className="flex-row-reverse justify-between mt-6">
                  <TouchableOpacity
                    className={`rounded-lg px-10 py-3 items-center ${isLoading ? "bg-gray-400" : "bg-primary"}`}
                    onPress={form.handleSubmit(onSubmit)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="white" />
                        <AppText w="semi" className="text-lg text-white ">
                          Salvando...
                        </AppText>
                      </View>
                    ) : (
                      <AppText w="semi" className="text-lg text-white ">
                        Salva
                      </AppText>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-destructive rounded-lg px-4 py-3 items-center" onPress={() => setIsEditing(false)}>
                    <AppText w="semi" className="text-white">
                      Annulla
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
const dropdownStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    height: 40
  },
  containerError: {
    borderColor: "#ef4444" // border-red-500
  },
  containerNormal: {
    borderColor: "#e2e8f0" // border-slate-200 (light mode)
  },
  containerNormalDark: {
    borderColor: "#374151" // border-gray-700 (dark mode)
  },
  placeholder: {
    fontSize: 14,
    color: "#94a3b8",
    fontFamily: "Kanit_200ExtraLight" // text-slate-400 (light mode)
  },
  placeholderDark: {
    fontSize: 14,
    color: "#9ca3af",
    fontFamily: "Kanit_200ExtraLight" // text-gray-400 (dark mode)
  },
  selectedText: {
    fontSize: 14,
    color: "#0f172a",
    fontFamily: "Kanit_200ExtraLight" // text-foreground (light mode)
  },
  selectedTextDark: {
    fontSize: 14,
    color: "#ffffff",
    fontFamily: "Kanit_200ExtraLight" // text-white (dark mode)
  },
  itemText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Kanit_200ExtraLight"
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
    marginVertical: 40,
    maxHeight: "70%",
    overflow: "hidden"
  }
});
