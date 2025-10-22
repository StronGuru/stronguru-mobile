import AppText from "@/components/ui/AppText";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { CheckIcon, ExternalLink, EyeIcon, EyeOffIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RegistrationSchema, RegistrationType } from "../../lib/zod/authSchemas";
import { useAuthStore } from "../../src/store/authStore";

const defaultValues: RegistrationType = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  acceptedTerms: false,
  acceptedPrivacy: false
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { registerUser } = useAuthStore();
  const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL as string;
  const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL as string;

  const form = useForm<RegistrationType>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues
  });

  const handleSubmit = async (values: RegistrationType) => {
    setError(null);
    setLoading(true);

    try {
      await registerUser(values);
      setSuccessState(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {successState ? (
            // Success State
            <View className="items-center max-w-80 px-4">
              <AppText className="text-2xl  text-center mb-4">Registrazione effettuata</AppText>
              <AppText className="text-md  text-center my-6">
                Attiva l&#39;account attraverso la mail che ti abbiamo appena inviato. Se non la trovi, controlla nello spam oppure attendi qualche minuto.
              </AppText>
              <View className="mt-6 items-center text-md">
                <AppText>
                  Account attivato?{" "}
                  <AppText w="semi" className="text-primary underline" onPress={() => router.replace("/(auth)/login")}>
                    Accedi
                  </AppText>
                </AppText>
              </View>
            </View>
          ) : loading ? (
            // Loading State
            <ActivityIndicator size="large" className="color-primary" />
          ) : error ? (
            // Error State
            <View className="items-center max-w-80 px-4">
              <AppText className="text-xl  text-center mb-4">{error}</AppText>
              <TouchableOpacity className="bg-primary rounded-lg p-3 items-center w-full" onPress={resetError}>
                <AppText className="color-white">Riprova</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            // Form State
            <>
              <View className="items-center mb-6 gap-4">
                <Image source={require("../../assets/images/logo.png")} className="w-80 h-10" resizeMode="contain" />
                <AppText w="semi" className="text-xl">
                  Crea il tuo account
                </AppText>
              </View>

              <View className="w-full max-w-80 px-4">
                {/* Nome */}
                <Controller
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText w="semi" className="text-md mb-2">
                        Nome
                      </AppText>
                      <TextInput
                        className={`bg-slate-100 rounded-lg p-3 textalign-center border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci il tuo nome"
                        value={field.value}
                        onChangeText={field.onChange}
                        editable={!loading}
                        autoCapitalize="words"
                        style={{ fontFamily: "Kanit_400Regular" }}
                      />
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Cognome */}
                <Controller
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText w="semi" className="text-md mb-2">
                        Cognome
                      </AppText>
                      <TextInput
                        className={`bg-slate-100 rounded-lg p-3 textalign-center border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci il tuo cognome"
                        value={field.value}
                        onChangeText={field.onChange}
                        editable={!loading}
                        autoCapitalize="words"
                        style={{ fontFamily: "Kanit_400Regular" }}
                      />
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Email */}
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText w="semi" className="text-md mb-2">
                        Email
                      </AppText>
                      <TextInput
                        className={`bg-slate-100 rounded-lg p-3 textalign-center border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Inserisci la tua email"
                        value={field.value}
                        onChangeText={field.onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                        style={{ fontFamily: "Kanit_400Regular" }}
                      />
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Password */}
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <AppText w="semi" className="text-md mb-2">
                        Password
                      </AppText>
                      <View className="relative">
                        <TextInput
                          className={`bg-slate-100 rounded-lg p-3 pr-10 textalign-center border ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                          placeholder="Inserisci la tua password"
                          value={field.value}
                          onChangeText={field.onChange}
                          secureTextEntry={!showPassword}
                          editable={!loading}
                          style={{ fontFamily: "Kanit_400Regular" }}
                        />
                        <TouchableOpacity className="absolute right-3 top-3" onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOffIcon size={20} color="#64748b" /> : <EyeIcon size={20} color="#64748b" />}
                        </TouchableOpacity>
                      </View>
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Termini e Condizioni */}
                <Controller
                  control={form.control}
                  name="acceptedTerms"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <TouchableOpacity className="flex-row items-center" onPress={() => field.onChange(!field.value)}>
                        <View
                          className={`w-5 h-5 rounded mr-2 border-2 items-center justify-center ${field.value ? "bg-primary border-primary" : "border-primary"}`}
                        >
                          {field.value && <CheckIcon size={16} color="#fff" />}
                        </View>
                        <AppText w="regular" className="text-md mr-1">
                          Accetto i{" "}
                          <AppText w="bold" className="text-primary underline" onPress={() => Linking.openURL(TERMS_URL)}>
                            Termini e Condizioni
                          </AppText>{" "}
                        </AppText>
                        <ExternalLink size={14} color="#64748b" />
                      </TouchableOpacity>
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Privacy Policy */}
                <Controller
                  control={form.control}
                  name="acceptedPrivacy"
                  render={({ field, fieldState }) => (
                    <View className="mb-4">
                      <TouchableOpacity className="flex-row items-center" onPress={() => field.onChange(!field.value)}>
                        <View
                          className={`w-5 h-5 rounded mr-2 border-2 items-center justify-center ${field.value ? "bg-primary border-primary" : "border-primary"}`}
                        >
                          {field.value && <CheckIcon size={17} color="white" />}
                        </View>
                        <AppText w="regular" className="text-md mr-1">
                          Accetto la{" "}
                          <AppText w="bold" className="text-primary underline" onPress={() => Linking.openURL(PRIVACY_URL)}>
                            Privacy Policy
                          </AppText>{" "}
                        </AppText>
                        <ExternalLink size={14} color="#64748b" />
                      </TouchableOpacity>
                      {fieldState.error && <AppText className="color-red-500 text-xs mt-1">{fieldState.error.message}</AppText>}
                    </View>
                  )}
                />

                {/* Submit Button */}
                <TouchableOpacity className="bg-primary rounded-lg p-3 items-center mt-4" onPress={form.handleSubmit(handleSubmit)} disabled={loading}>
                  <AppText w="bold" className="color-white text-lg ">
                    Registrati
                  </AppText>
                </TouchableOpacity>

                {/* Login Link */}
                <View className="mt-8 items-center">
                  <AppText w="semi" className="text-md">
                    Hai già un account?{" "}
                    <AppText w="bold" className="text-primary  underline" onPress={() => router.replace("/(auth)/login")}>
                      Accedi
                    </AppText>
                  </AppText>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
