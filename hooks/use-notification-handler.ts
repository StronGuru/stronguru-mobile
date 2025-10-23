import { addNotificationListener, clearNotificationListeners } from '@/api/pusherBeamsService';
import { useEffect } from 'react';
import { Alert } from 'react-native';

/**
 * Hook per gestire le notifiche push in arrivo
 * Può essere usato in qualsiasi componente per reagire alle notifiche
 * 
 * @example
 * ```tsx
 * // Nel componente principale o in una schermata specifica
 * function HomeScreen() {
 *   useNotificationHandler();
 *   
 *   return <View>...</View>;
 * }
 * ```
 */
export const useNotificationHandler = () => {
  useEffect(() => {
    let subscription: any = null;

    const handleNotification = (notification: any) => {
      console.log('📬 Notifica ricevuta:', notification);
      
      // Esempio: mostra un alert quando arriva una notifica
      // In produzione, potresti mostrare un toast, aggiornare uno stato, navigare, etc.
      if (notification?.data) {
        const { title, body, data } = notification;
        
        Alert.alert(
          title || 'Nuova Notifica',
          body || 'Hai ricevuto una nuova notifica',
          [
            {
              text: 'OK',
              onPress: () => {
                // Gestisci il tap sulla notifica
                handleNotificationTap(data);
              }
            }
          ]
        );
      }
    };

    const handleNotificationTap = (data: any) => {
      console.log('👆 Notifica tappata con data:', data);
      
      // Esempio: naviga a una schermata specifica in base ai dati
      if (data?.type === 'chat_message') {
        // router.push(`/chat/${data.roomId}`);
      } else if (data?.type === 'event_reminder') {
        // router.push(`/events/${data.eventId}`);
      }
    };

    const setupListener = async () => {
      // Registra il listener (ora è async)
      subscription = await addNotificationListener(handleNotification);
    };

    setupListener();

    // Cleanup al unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
      clearNotificationListeners();
    };
  }, []);
};
