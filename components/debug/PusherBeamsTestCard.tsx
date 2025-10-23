import { subscribeToInterest, unsubscribeFromInterest } from '@/api/pusherBeamsService';
import { useAuthStore } from '@/src/store/authStore';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

/**
 * Componente di test per le notifiche Pusher Beams
 * 
 * Questo componente permette di:
 * - Sottoscrivere all'interest "hello" come richiesto da Pusher per il setup iniziale
 * - Testare la ricezione di notifiche dalla dashboard Pusher
 * 
 * Uso: Aggiungi questo componente in una schermata di debug o settings
 * 
 * @example
 * ```tsx
 * // In app/(tabs)/home/settings.tsx o in una schermata di debug
 * import { PusherBeamsTestCard } from '@/components/debug/PusherBeamsTestCard';
 * 
 * export default function SettingsScreen() {
 *   return (
 *     <View>
 *       {__DEV__ && <PusherBeamsTestCard />}
 *     </View>
 *   );
 * }
 * ```
 */
export const PusherBeamsTestCard: React.FC = () => {
  const [isSubscribedToHello, setIsSubscribedToHello] = useState(false);
  const { userId, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Auto-sottoscrivi all'avvio se autenticato (opzionale)
    if (isAuthenticated && userId) {
      handleSubscribeToHello();
    }
  }, [isAuthenticated, userId]);

  const handleSubscribeToHello = async () => {
    try {
      await subscribeToInterest('hello');
      setIsSubscribedToHello(true);
      Alert.alert(
        '✅ Sottoscritto!',
        'Sei ora sottoscritto all\'interest "hello".\n\nInvia una notifica di test dalla dashboard Pusher per verificare che funzioni.'
      );
    } catch (error) {
      console.error('Errore sottoscrizione a hello:', error);
      Alert.alert('Errore', 'Impossibile sottoscriversi all\'interest "hello"');
    }
  };

  const handleUnsubscribeFromHello = async () => {
    try {
      await unsubscribeFromInterest('hello');
      setIsSubscribedToHello(false);
      Alert.alert('🔕 Disiscritto', 'Non riceverai più notifiche dall\'interest "hello"');
    } catch (error) {
      console.error('Errore disiscrizionbe da hello:', error);
      Alert.alert('Errore', 'Impossibile disiscriversi dall\'interest "hello"');
    }
  };

  const handleSubscribeToUserInterest = async () => {
    if (!userId) {
      Alert.alert('Errore', 'User ID non disponibile. Effettua il login.');
      return;
    }

    try {
      const userInterest = `user-${userId}`;
      await subscribeToInterest(userInterest);
      Alert.alert(
        '✅ Sottoscritto!',
        `Sei ora sottoscritto all'interest personale:\n"${userInterest}"\n\nIl backend può inviarti notifiche personali.`
      );
    } catch (error) {
      console.error('Errore sottoscrizione a user interest:', error);
      Alert.alert('Errore', 'Impossibile sottoscriversi all\'interest personale');
    }
  };

  if (!isAuthenticated) {
    return (
      <View className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg m-4">
        <Text className="text-red-800 dark:text-red-200 font-semibold">
          ⚠️ Push Notifications Test
        </Text>
        <Text className="text-red-700 dark:text-red-300 mt-2">
          Devi essere autenticato per testare le notifiche push.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-primary/10 p-4 rounded-lg m-4 border border-primary/20">
      <Text className="text-lg font-semibold text-primary mb-2">
        🔔 Pusher Beams Test
      </Text>
      
      <Text className="text-sm text-muted mb-4">
        User ID: {userId}
      </Text>

      <View className="space-y-2">
        {/* Test Interest "hello" */}
        <TouchableOpacity
          onPress={isSubscribedToHello ? handleUnsubscribeFromHello : handleSubscribeToHello}
          className={`p-3 rounded-lg ${
            isSubscribedToHello 
              ? 'bg-red-500 dark:bg-red-600' 
              : 'bg-primary dark:bg-primary'
          }`}
        >
          <Text className="text-white font-semibold text-center">
            {isSubscribedToHello ? '🔕 Disiscrivi da "hello"' : '📬 Sottoscrivi a "hello"'}
          </Text>
        </TouchableOpacity>

        {/* User-specific Interest */}
        <TouchableOpacity
          onPress={handleSubscribeToUserInterest}
          className="p-3 rounded-lg bg-secondary dark:bg-secondary"
        >
          <Text className="text-white font-semibold text-center">
            👤 Sottoscrivi a Interest Personale
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <Text className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
          📝 Istruzioni Test:
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400">
          1. Premi &quot;Sottoscrivi a hello&quot;{'\n'}
          2. Vai su dashboard.pusher.com{'\n'}
          3. Seleziona il tuo Beams Instance{'\n'}
          4. Invia una notifica di test all&apos;interest &quot;hello&quot;{'\n'}
          5. Dovresti ricevere la notifica su questo dispositivo
        </Text>
      </View>
    </View>
  );
};
