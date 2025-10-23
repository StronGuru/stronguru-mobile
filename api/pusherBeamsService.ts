import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const BEAMS_INSTANCE_ID = process.env.EXPO_PUBLIC_BEAMS_INSTANCE_ID ?? "";

if (!BEAMS_INSTANCE_ID) {
  console.warn("⚠️ EXPO_PUBLIC_BEAMS_INSTANCE_ID not configured");
}

if (!API_URL) {
  console.warn("⚠️ EXPO_PUBLIC_API_URL not configured");
}

let isBeamsStarted = false;
let PusherBeamsModule: any = null;

// Lazy load del modulo nativo (evita crash se non buildato)
const loadPusherBeams = async () => {
  if (PusherBeamsModule) return PusherBeamsModule;
  
  try {
    const module = await import('@jcaspar/expo-pusher-beams');
    PusherBeamsModule = module;
    return PusherBeamsModule;
  } catch {
    console.warn('⚠️ Pusher Beams native module non disponibile. Esegui "npx expo run:android" per buildare i moduli nativi.');
    return null;
  }
};

/**
 * Ottiene il token Beams dal backend
 * @param userId - ID dell'utente
 * @param authToken - Token di autenticazione (opzionale, altrimenti cerca in AsyncStorage)
 */
const getBeamsToken = async (userId: string, authToken?: string): Promise<string> => {
  try {
    const token = authToken || await AsyncStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token auth non trovato. Assicurati di essere loggato.');
    }
    
    const response = await axios.get(`${API_URL}/pusher/beams-auth`, {
      params: { user_id: userId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.token || response.data;
  } catch (error: any) {
    console.error('❌ Errore nel recupero del Beams token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

/**
 * Avvia Pusher Beams SDK e registra il dispositivo
 * Deve essere chiamato PRIMA di qualsiasi altra operazione Beams
 */
export const startBeams = async (): Promise<void> => {
  try {
    if (isBeamsStarted) return;
    
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    if (!BEAMS_INSTANCE_ID) {
      throw new Error('BEAMS_INSTANCE_ID non configurato');
    }
    
    await beams.setInstanceId(BEAMS_INSTANCE_ID);
    isBeamsStarted = true;
  } catch (error) {
    console.error('❌ Errore avvio Beams SDK:', error);
    // Non rilanciare l'errore per non bloccare l'app
  }
};

/**
 * Inizializza Pusher Beams per le notifiche push autenticate
 * Deve essere chiamato DOPO login con successo
 * @param userId - ID dell'utente
 * @param authToken - Token di autenticazione (opzionale, consigliato per evitare race conditions)
 */
export const initializeBeamsMobile = async (userId: string, authToken?: string): Promise<void> => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    if (!BEAMS_INSTANCE_ID) {
      throw new Error('BEAMS_INSTANCE_ID non configurato');
    }
    
    if (!isBeamsStarted) {
      await startBeams();
    }
    
    const beamsToken = await getBeamsToken(userId, authToken);
    await beams.setUserId(userId, beamsToken);
    
    // Sottoscrivi automaticamente all'interest pubblico
    try {
      await beams.subscribe('stronguru-comunications');
    } catch (subError) {
      console.error('❌ Errore sottoscrizione interest pubblico:', subError);
    }
  } catch (error: any) {
    console.error('❌ Errore inizializzazione Beams Mobile:', error);
    // Non rilanciare per non bloccare il login
  }
};

/**
 * Ferma Pusher Beams e disassocia l'utente
 * Da chiamare durante il logout
 */
export const stopBeamsMobile = async (): Promise<void> => {
  try {
    if (!isBeamsStarted) return;
    
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    await beams.clearAllState();
    await beams.stop();
    isBeamsStarted = false;
  } catch (error) {
    console.error('❌ Errore stop Beams Mobile:', error);
    // Non rilanciare per non bloccare il logout
  }
};

/**
 * Pulisce tutti gli interest e lo stato di Beams
 */
export const clearBeamsState = async (): Promise<void> => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    await beams.clearAllState();
  } catch (error) {
    console.error('❌ Errore clearing Beams state:', error);
  }
};

/**
 * Sottoscrive a un interest specifico
 */
export const subscribeToInterest = async (interest: string): Promise<void> => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    await beams.subscribe(interest);
  } catch (error) {
    console.error('❌ Errore sottoscrizione interest:', error);
  }
};

/**
 * Rimuove sottoscrizione da un interest
 */
export const unsubscribeFromInterest = async (interest: string): Promise<void> => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) return;
    
    await beams.unsubscribe(interest);
  } catch (error) {
    console.error('❌ Errore rimozione sottoscrizione interest:', error);
  }
};

/**
 * Aggiunge un listener per le notifiche in arrivo
 * Utile per gestire notifiche mentre l'app è in foreground
 */
export const addNotificationListener = async (
  callback: (notification: any) => void
) => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) return null;
    
    return beams.addNotificationListener(callback);
  } catch (error) {
    console.error('❌ Errore aggiunta notification listener:', error);
    return null;
  }
};

/**
 * Rimuove tutti i listener delle notifiche
 */
export const clearNotificationListeners = async (): Promise<void> => {
  try {
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Pusher Beams non disponibile');
      return;
    }
    
    beams.clearNotificationListeners();
    console.log('🔇 Tutti i notification listener rimossi');
  } catch (error) {
    console.error('❌ Errore rimozione notification listeners:', error);
  }
};
