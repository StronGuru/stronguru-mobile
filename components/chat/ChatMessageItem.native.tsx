import { useUserDataStore } from "@/src/store/userDataStore";
import type { ChatMessage } from "@/src/types/chatTypes";
import { ExternalLink } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Alert, AppState, Linking, Text, TouchableOpacity, View } from "react-native";

type Props = {
  message: ChatMessage;
  currentUserId?: string;
  showHeader?: boolean;
};

export default function ChatMessageItemNative({ message, currentUserId, showHeader }: Props) {
  const isOwn = currentUserId ? String(message.senderId) === String(currentUserId) : false;
  const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const isInvitationMessage = message.content.includes("📨 *Richiesta di collegamento*");
  const urlMatch = message.content.match(/(https?:\/\/[^\s]+)/);
  const invitationUrl = urlMatch ? urlMatch[0] : null;
  const { user, fetchUserData } = useUserDataStore();
  const hasOpenedInvitation = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Se l'app torna attiva E abbiamo aperto un invito → refetch
      if (nextAppState === "active" && hasOpenedInvitation.current) {
        console.log("🔄 App tornata in foreground dopo invito, refetch user data...");
        fetchUserData(user?._id || "");
        hasOpenedInvitation.current = false; // Reset flag
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?._id, fetchUserData]);

  const handleOpenLink = async () => {
    if (!invitationUrl) return;

    try {
      const canOpen = await Linking.canOpenURL(invitationUrl);
      if (canOpen) {
        hasOpenedInvitation.current = true;
        await Linking.openURL(invitationUrl);
      } else {
        Alert.alert("Errore", "Impossibile aprire il link");
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Errore", "Si è verificato un errore nell'apertura del link");
    }
  };

  // Rendering per messaggi di invito
  if (isInvitationMessage && invitationUrl) {
    const messageText = message.content.split("\n\n")[1]?.replace("Accetta invito" + invitationUrl, "") || "";

    return (
      <View className={`flex mb-4 ${isOwn ? "items-end" : "items-start"}`}>
        <View className="max-w-[80%]">
          {/* {showHeader && <Text className="text-xs text-muted-foreground mb-1 px-3">{message.user?.name || String(message.senderId)}</Text>} */}

          {/* Card speciale per invito */}
          <View className="p-4 rounded-lg bg-muted border border-border">
            <View className="mb-3">
              <Text className="font-semibold text-md text-primary mb-1">📨 Richiesta di collegamento</Text>
              <Text className="text-sm text-muted-foreground mt-1">{messageText}</Text>
            </View>

            {/* Pulsante per aprire il link */}
            <TouchableOpacity onPress={handleOpenLink} className="bg-primary py-3 px-4 rounded-lg active:opacity-80 flex-row justify-center items-center gap-2">
              <ExternalLink size={16} />
              <Text className="text-primary-foreground text-center font-semibold">Accetta invito</Text>
            </TouchableOpacity>

            <Text className="text-xs text-muted-foreground text-center mt-3">{time}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={`${isOwn ? "items-end" : "items-start"} my-2`}>
      {showHeader && !isOwn ? <Text className="text-xs text-muted-foreground mb-1">{String(message.senderId ?? "")}</Text> : null}

      <View className={`${isOwn ? "bg-primary" : "bg-surface"} px-3 py-2 rounded-2xl max-w-[80%]`}>
        <Text className={`${isOwn ? "text-primary-foreground" : "text-foreground"} leading-relaxed`}>{message.content}</Text>

        <View className="flex-row justify-end items-center mt-1">
          {time ? <Text className={`text-[11px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{time}</Text> : null}
        </View>
      </View>
    </View>
  );
}
