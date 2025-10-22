import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { TypingIndicatorNative } from "./TypingIndicator.native";

import ChatMessageItemNative from "@/components/chat/ChatMessageItem.native";
import DateSeparator from "@/components/chat/DateSeparator.native";
import { useChatScrollNative } from "@/hooks/use-chat-scroll.native";
import useRealtimeChatNative from "@/hooks/use-realtime-chat.native";
import { useAuthStore } from "@/src/store/authStore";
import type { ChatMessage, MessageRow } from "@/src/types/chatTypes";
import { mapMessageRowToChatMessage } from "@/src/types/chatTypes";

type DateSeparatorType = { type: 'date-separator'; date: string; id: string };
type MessageOrSeparator = ChatMessage | DateSeparatorType;

interface Props {
  roomName?: string; // legacy
  roomId?: number | string | null; // prefer numeric id
  username?: string;
  initialMessages?: any[];
  onMessage?: (m: ChatMessage[]) => void;
  // Dati per l'header
  chatUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const RealtimeChatNative = ({ roomName, roomId: roomIdProp, username, initialMessages = [], onMessage, chatUser }: Props) => {
    // const inputRef = useRef<TextInput>(null); // Removed duplicate declaration

  const { listRef, scrollToBottom } = useChatScrollNative<MessageOrSeparator>();
  // prefer explicit roomId, else use roomName (now supports string IDs from MongoDB)
  const roomId = (roomIdProp || roomName || null) as string | number | null;

  const currentUserId = useAuthStore((s: any) => s.userId ?? s.user?._id ?? s.user?.id ?? s.authData?.user?.id ?? null);
  
  // Track se la schermata è in focus per marcare automaticamente i messaggi come letti
  const [isScreenFocused, setIsScreenFocused] = React.useState(true);

  const { messages: realtimeMessages, sendMessage, loading, typingUsers, sendTyping } = useRealtimeChatNative(
    roomId,
    currentUserId,
    isScreenFocused
  );
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  // normalize any incoming message shape to ChatMessage
  const normalize = useCallback(
    (m: any): ChatMessage => {
      if (!m) {
        return {
          id: -Math.floor(Math.random() * 1000000),
          createdAt: new Date().toISOString(),
          roomId: roomId ?? -1,
          senderId: "",
          content: ""
        };
      }
      // Already ChatMessage
      if (m.roomId !== undefined || m.senderId !== undefined || m.createdAt !== undefined) {
        return m as ChatMessage;
      }
      // Row shape from supabase: MessageRow
      if (m.created_at !== undefined || m.sender_id !== undefined) {
        return mapMessageRowToChatMessage(m as MessageRow);
      }
      // legacy UI shape (has user.name and text/content)
      return {
        id: Number(m.id ?? m._id ?? Math.random()),
        createdAt: String(m.createdAt ?? m.created_at ?? new Date().toISOString()),
        roomId: Number(m.roomId ?? roomId ?? -1),
        senderId: String(m.sender_id ?? m.senderId ?? m.user?.id ?? ""),
        content: String(m.content ?? m.text ?? "")
      };
    },
    [roomId]
  );

  const allMessages = useMemo(() => {
    const normInitial = (initialMessages || []).map(normalize);
    const normRealtime = (realtimeMessages || []).map(normalize);
    const merged = [...normInitial, ...normRealtime];
    const unique = merged.filter((m, i, arr) => i === arr.findIndex((x) => x.id === m.id));
    const sorted = unique.sort((a, b) => new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime());
    
    console.log("💬 [RealtimeChat] Total messages:", sorted.length, {
      initial: normInitial.length,
      realtime: normRealtime.length,
      merged: merged.length,
      unique: unique.length
    });
    
    return sorted;
  }, [initialMessages, realtimeMessages, normalize]);

  // Crea array di messaggi con separatori di data
  const messagesWithSeparators = useMemo(() => {
    const items: MessageOrSeparator[] = [];
    let lastDate: string | null = null;

    allMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt ?? "");
      const dateKey = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Se è un nuovo giorno, inserisci il separatore
      if (dateKey !== lastDate) {
        items.push({
          type: 'date-separator',
          date: message.createdAt ?? new Date().toISOString(),
          id: `separator-${dateKey}`
        });
        lastDate = dateKey;
      }

      items.push(message);
    });

    return items;
  }, [allMessages]);

  useEffect(() => {
    onMessage?.(allMessages);
  }, [allMessages, onMessage]);

  // Scroll automatico quando cambiano i messaggi o quando si apre la chat
  useEffect(() => {
    if (!allMessages.length) return;
    
    // Scroll immediato
    scrollToBottom();
    
    // Scroll ritardati per assicurarsi che la FlatList sia renderizzata
    const timeouts = [
      setTimeout(scrollToBottom, 100),
      setTimeout(scrollToBottom, 300),
      setTimeout(scrollToBottom, 500)
    ];
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [allMessages, scrollToBottom]);

  // Scroll automatico quando si entra nella chat
  useFocusEffect(
    React.useCallback(() => {
      // Segna la schermata come in focus
      setIsScreenFocused(true);
      
      // Scroll immediato
      scrollToBottom();
      
      // Scroll ritardati per gestire il caricamento dei messaggi iniziali
      const timeouts = [
        setTimeout(scrollToBottom, 150),
        setTimeout(scrollToBottom, 400),
        setTimeout(scrollToBottom, 800)
      ];
      
      return () => {
        // Segna la schermata come non più in focus
        setIsScreenFocused(false);
        timeouts.forEach(clearTimeout);
      };
    }, [scrollToBottom])
  );

  const isConnected = !!roomId && !loading;

  // Handle typing events
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      
      if (!currentUserId) return;

      // If text exists and user wasn't typing before
      if (newText.length > 0) {
        if (!isTypingRef.current) {
          // Start typing
          isTypingRef.current = true;
          sendTyping(String(currentUserId), true);
          
          // Set up keep-alive interval to maintain typing status
          keepAliveIntervalRef.current = setInterval(() => {
            if (isTypingRef.current) {
              sendTyping(String(currentUserId), true);
            }
          }, 3000); // Send keep-alive every 3 seconds
        }
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing after inactivity
        typingTimeoutRef.current = setTimeout(() => {
          isTypingRef.current = false;
          sendTyping(String(currentUserId), false);
          
          // Clear keep-alive interval
          if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
          }
        }, 3000); // Stop after 3 seconds of inactivity
      } else {
        // Text is empty, stop typing immediately
        isTypingRef.current = false;
        sendTyping(String(currentUserId), false);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      }
    },
    [currentUserId, sendTyping]
  );  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 50);
    const t2 = setTimeout(scrollToBottom, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [allMessages, scrollToBottom]);

  useFocusEffect(
    React.useCallback(() => {
      scrollToBottom();
      const t = setTimeout(scrollToBottom, 80);
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, scrollToBottom])
  );

  const handleSend = useCallback(
    async () => {
      if (!text.trim() || !isConnected || isSending) return;
      if (!currentUserId) {
        console.error("Missing currentUserId");
        return;
      }

      // Salva il testo da inviare
      const messageToSend = text.trim();
      
      // PULISCI IMMEDIATAMENTE il campo input (prima dell'await)
      setText("");
      inputRef.current?.clear();
      
      // Blocca ulteriori invii
      setIsSending(true);

      // Stop typing indicator before sending
      isTypingRef.current = false;
      sendTyping(String(currentUserId), false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      try {
        if (typeof sendMessage === "function") {
          // Passa il recipientUserId se disponibile (l'altro utente nella chat)
          await sendMessage(messageToSend, String(currentUserId), chatUser?.id);
        } else {
          console.error("sendMessage not available from realtime hook");
        }
      } catch (err) {
        console.error("Error sending message", err);
      } finally {
        // Sblocca invii
        setIsSending(false);
        inputRef.current?.focus();
      }
      setTimeout(() => scrollToBottom(), 50);
    },
    [text, isConnected, isSending, currentUserId, sendMessage, sendTyping, scrollToBottom, chatUser?.id]
  );

  const handleGoBack = () => {
    // Naviga indietro usando router
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chat');
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <SafeAreaView className="flex-1 bg-primary" style={{ paddingTop: Platform.OS === 'ios' ? 0 : 26 }}>
        {/* Header Chat */}
        <View className="flex-row items-center px-4 py-4 bg-primary" style={{ paddingTop: Platform.OS === 'ios' ? 12 : 28 }}>
          <TouchableOpacity onPress={handleGoBack} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          
          <View className="flex-row items-center flex-1">
            {chatUser?.avatar ? (
              <Image 
                source={{ uri: chatUser.avatar }} 
                className="w-10 h-10 rounded-full mr-3"
                defaultSource={require('@/assets/images/icon.png')}
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-accent mr-3 items-center justify-center">
                <Text className="text-accent-foreground font-semibold">
                  {chatUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">
                {chatUser?.name || 'Utente'}
              </Text>
            </View>
          </View>
        </View>
        
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <FlatList
            ref={listRef}
            data={messagesWithSeparators}
            keyExtractor={(item) => {
              if ('type' in item && item.type === 'date-separator') {
                return item.id;
              }
              return String(item.id);
            }}
            renderItem={({ item }) => {
              // Se è un separatore di data
              if ('type' in item && item.type === 'date-separator') {
                return <DateSeparator date={item.date} />;
              }
              // Altrimenti è un messaggio normale (safe cast dopo il check sopra)
              return <ChatMessageItemNative message={item as ChatMessage} currentUserId={String(currentUserId ?? "")} />;
            }}
            className="flex-1 p-3 bg-background"
            showsVerticalScrollIndicator={false}
            onLayout={() => scrollToBottom()}
          />

          {/* Typing indicator */}
          <TypingIndicatorNative typingUsers={typingUsers} currentUserId={String(currentUserId ?? "")} />

          <View className="flex-row items-center px-4 py-3 bg-primary">
            <TextInput
              ref={inputRef}
              className="flex-1 bg-white text-foreground rounded-lg px-3 py-3 mr-3"
              value={text}
              onChangeText={handleTextChange}
              placeholder="Scrivi un messaggio..."
              placeholderTextColor="#999"
              editable={isConnected}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              style={{ maxHeight: 100 }}
            />
            
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={!isConnected || !text.trim() || isSending} 
              className="w-10 h-10 rounded-lg bg-white items-center justify-center"
              style={{ opacity: isConnected && text.trim() && !isSending ? 1 : 0.6 }}
            >
              <Send size={20} color={isConnected && text.trim() && !isSending ? "#10b981" : "#999"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
