import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

/**
 * Configurazione per mostrare le notifiche anche quando l'app è in foreground
 */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

/**
 * Gestisce il click su una notifica e naviga alla chat
 */
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  try {
    const data = response.notification.request.content.data;
    
    console.log('🔔 Notifica cliccata:', data);
    
    // Se è un messaggio chat, naviga alla conversazione
    if (data.type === 'chat_message' && data.conversationId) {
      console.log('💬 Navigazione a chat:', data.conversationId);
      
      // Naviga alla chat specifica
      router.push(`/(tabs)/chat/${data.conversationId}` as any);
    }
  } catch (error) {
    console.error('❌ Errore handling notifica:', error);
  }
};

/**
 * Setup dei listener per le notifiche
 */
export const setupNotificationListeners = () => {
  // Listener per quando l'utente clicca sulla notifica
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  // Listener per notifiche ricevute mentre app è aperta
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notifica ricevuta (app aperta):', notification);
    
    const data = notification.request.content.data;
    console.log('📦 Dati notifica:', {
      type: data.type,
      conversationId: data.conversationId,
      senderName: data.senderName,
      senderId: data.senderId
    });
  });

  // Cleanup function
  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
};

/**
 * Mostra una notifica locale (per testing o notifiche custom)
 */
export const showLocalNotification = async (title: string, body: string, data?: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Mostra immediatamente
  });
};
