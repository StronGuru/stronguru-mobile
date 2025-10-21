import AppText from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import { SignInRequest } from "../../src/types/authTypes";

export default function LoginScreen() {
  const [loginInputValue, setLoginInputValue] = useState<SignInRequest>({});
  const { loginUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setError(null);
    if (!loginInputValue.email || !loginInputValue.password) {
      setError("Per favore, inserisci email e password");
      return;
    }
    setLoading(true);
    try {
      await loginUser(loginInputValue.email, loginInputValue.password);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = useAuthStore.getState().error || "Si è verificato un errore durante il login. Riprova più tardi.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center gap-5">
          {!loading ? (
            <>
              <View className="items-center gap-4">
                <Image source={require("../../assets/images/logo.png")} className="w-80 h-10" resizeMode="contain" />
                <AppText w="semi" className="text-lg ">
                  Accedi al tuo account
                </AppText>
              </View>

              <View className="w-full max-w-80 px-4">
                {/* Email Input */}
                <View className="mb-4">
                  <AppText w="semi" className="text-md mb-2">
                    Email
                  </AppText>
                  <TextInput
                    className="bg-slate-100 rounded-lg p-3 textalign-center border border-slate-200"
                    placeholder="Inserisci la tua email"
                    value={loginInputValue.email}
                    onChangeText={(text) => {
                      setLoginInputValue({ ...loginInputValue, email: text });
                      if (error) setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    style={{ fontFamily: "Kanit_400Regular" }}
                  />
                </View>

                {/* Password Input */}
                <View className="mb-4">
                  <AppText w="semi" className="text-md mb-2">
                    Password
                  </AppText>
                  <View className="relative">
                    <TextInput
                      className="bg-slate-100 rounded-lg p-3 textalign-center pr-10 text-base border border-slate-200"
                      placeholder="Inserisci la tua password"
                      value={loginInputValue.password}
                      onChangeText={(text) => {
                        setLoginInputValue({ ...loginInputValue, password: text });
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      style={{ fontFamily: "Kanit_400Regular" }}
                    />
                    <TouchableOpacity className="absolute right-3 top-3" onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOffIcon size={20} color="#64748b" /> : <EyeIcon size={20} color="#64748b" />}
                    </TouchableOpacity>
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} className="mt-4">
                    <AppText className="text-md underline tracking-wide">Password dimenticata?</AppText>
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error && (
                  <View className="mb-2">
                    <AppText className="text-center color-red-500 text-sm">{error}</AppText>
                  </View>
                )}

                {/* Login Button */}
                <TouchableOpacity className="bg-primary rounded-lg p-3 items-center mt-4" onPress={handleSubmit} disabled={loading}>
                  <AppText w="bold" className="text-white text-lg">
                    Accedi
                  </AppText>
                </TouchableOpacity>

                {/* Register Link */}
                <View className="mt-9 items-center">
                  <AppText w="semi" className="text-md">
                    Non hai un account?{" "}
                    <AppText w="bold" className="text-primary underline" onPress={() => router.push("/(auth)/signup")}>
                      Registrati
                    </AppText>
                  </AppText>
                </View>
              </View>
            </>
          ) : (
            <ActivityIndicator size="large" className="color-primary" />
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
