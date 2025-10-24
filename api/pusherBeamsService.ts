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
  if (PusherBeamsModule) {
    console.log('✅ PusherBeams module già caricato');
    return PusherBeamsModule;
  }
  
  try {
    console.log('🔄 Caricamento modulo PusherBeams...');
    const module = await import('@jcaspar/expo-pusher-beams');
    PusherBeamsModule = module;
    console.log('✅ Modulo PusherBeams caricato con successo:', Object.keys(module));
    return PusherBeamsModule;
  } catch (error) {
    console.warn('⚠️ Pusher Beams native module non disponibile. Esegui "npx expo run:android" per buildare i moduli nativi.');
    console.warn('Error details:', error);
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
    console.log('🔄 Recupero token Beams per userId:', userId);
    
    const token = authToken || await AsyncStorage.getItem('auth_token');
    
    if (!token) {
      console.error('❌ Token auth non trovato');
      throw new Error('Token auth non trovato. Assicurati di essere loggato.');
    }
    
    console.log('🔄 Chiamata API per ottenere Beams token...');
    const response = await axios.get(`${API_URL}/pusher/beams-auth`, {
      params: { user_id: userId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const beamsToken = response.data.token || response.data;
    console.log('✅ Beams token ottenuto con successo');
    return beamsToken;
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
    console.log('🔄 Avvio Pusher Beams SDK...');
    
    if (isBeamsStarted) {
      console.log('✅ Beams già avviato, skip');
      return;
    }
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip avvio');
      return;
    }
    
    if (!BEAMS_INSTANCE_ID) {
      console.error('❌ BEAMS_INSTANCE_ID non configurato');
      throw new Error('BEAMS_INSTANCE_ID non configurato');
    }
    
    console.log('🔄 Impostazione Instance ID:', BEAMS_INSTANCE_ID);
    await beams.setInstanceId(BEAMS_INSTANCE_ID);
    isBeamsStarted = true;
    console.log('✅ Pusher Beams SDK avviato con successo');
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
    console.log('🔄 Inizializzazione Beams Mobile per userId:', userId);
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip inizializzazione');
      return;
    }
    
    if (!BEAMS_INSTANCE_ID) {
      console.error('❌ BEAMS_INSTANCE_ID non configurato');
      throw new Error('BEAMS_INSTANCE_ID non configurato');
    }
    
    if (!isBeamsStarted) {
      console.log('🔄 Beams non ancora avviato, avvio...');
      await startBeams();
    }
    
    console.log('🔄 Ottenimento token Beams...');
    const beamsToken = await getBeamsToken(userId, authToken);
    
    console.log('🔄 Impostazione userId e token...');
    await beams.setUserId(userId, beamsToken);
    
    // Sottoscrivi automaticamente all'interest pubblico
    try {
      console.log('🔄 Sottoscrizione a interest pubblico...');
      await beams.subscribe('stronguru-comunications');
      console.log('✅ Sottoscrizione a interest pubblico completata');
    } catch (subError) {
      console.error('❌ Errore sottoscrizione interest pubblico:', subError);
    }
    
    console.log('✅ Beams Mobile inizializzato con successo');
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
    console.log('🔄 Stop Beams Mobile...');
    
    if (!isBeamsStarted) {
      console.log('✅ Beams non avviato, skip stop');
      return;
    }
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip stop');
      return;
    }
    
    console.log('🔄 Pulizia stato Beams...');
    await beams.clearAllState();
    
    console.log('🔄 Stop Beams...');
    await beams.stop();
    
    isBeamsStarted = false;
    console.log('✅ Beams Mobile fermato con successo');
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
    console.log('🔄 Pulizia stato Beams...');
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip pulizia');
      return;
    }
    
    await beams.clearAllState();
    console.log('✅ Stato Beams pulito con successo');
  } catch (error) {
    console.error('❌ Errore clearing Beams state:', error);
  }
};

/**
 * Sottoscrive a un interest specifico
 */
export const subscribeToInterest = async (interest: string): Promise<void> => {
  try {
    console.log('🔄 Sottoscrizione a interest:', interest);
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip sottoscrizione');
      return;
    }
    
    await beams.subscribe(interest);
    console.log('✅ Sottoscrizione a interest completata:', interest);
  } catch (error) {
    console.error('❌ Errore sottoscrizione interest:', error);
  }
};

/**
 * Rimuove sottoscrizione da un interest
 */
export const unsubscribeFromInterest = async (interest: string): Promise<void> => {
  try {
    console.log('🔄 Rimozione sottoscrizione da interest:', interest);
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip rimozione sottoscrizione');
      return;
    }
    
    await beams.unsubscribe(interest);
    console.log('✅ Sottoscrizione rimossa da interest:', interest);
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
    console.log('🔄 Aggiunta notification listener...');
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Modulo Beams non disponibile, skip aggiunta listener');
      return null;
    }
    
    const listener = beams.addNotificationListener(callback);
    console.log('✅ Notification listener aggiunto con successo');
    return listener;
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
    console.log('🔄 Rimozione tutti i notification listeners...');
    
    const beams = await loadPusherBeams();
    if (!beams) {
      console.warn('⚠️ Pusher Beams non disponibile, skip rimozione listeners');
      return;
    }
    
    beams.clearNotificationListeners();
    console.log('✅ Tutti i notification listener rimossi con successo');
  } catch (error) {
    console.error('❌ Errore rimozione notification listeners:', error);
  }
};
