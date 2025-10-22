import * as PusherBeams from '@jcaspar/expo-pusher-beams';
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

/**
 * Ottiene il token Beams dal backend
 */
const getBeamsToken = async (userId: string): Promise<string> => {
  try {
    const authToken = await AsyncStorage.getItem('auth_token');
    
    if (!authToken) {
      console.warn('⚠️ Token auth non trovato in AsyncStorage');
    }
    
    const response = await axios.get(`${API_URL}/api/pusher/beams-auth`, {
      params: { user_id: userId },
      headers: {
        Authorization: `Bearer ${authToken || ''}`
      }
    });
    
    return response.data.token || response.data;
  } catch (error) {
    console.error('❌ Errore nel recupero del Beams token:', error);
    throw error;
  }
};

/**
 * Inizializza Pusher Beams per le notifiche push
 */
export const initializeBeamsMobile = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Inizializzazione Beams per userId:', userId);
    
    if (!BEAMS_INSTANCE_ID) {
      throw new Error('BEAMS_INSTANCE_ID non configurato');
    }
    
    // 1. Imposta l'instance ID
    await PusherBeams.setInstanceId(BEAMS_INSTANCE_ID);
    
    // 2. Ottieni il token dal backend
    const beamsToken = await getBeamsToken(userId);
    
    // 3. Associa userId al dispositivo con il token
    await PusherBeams.setUserId(userId, beamsToken);
    
    console.log('✅ Beams Mobile inizializzato con successo per user:', userId);
  } catch (error) {
    console.error('❌ Errore inizializzazione Beams Mobile:', error);
    throw error;
  }
};

/**
 * Ferma Pusher Beams e disassocia l'utente
 */
export const stopBeamsMobile = async (): Promise<void> => {
  try {
    await PusherBeams.stop();
    console.log('🛑 Beams Mobile fermato');
  } catch (error) {
    console.error('❌ Errore stop Beams Mobile:', error);
    throw error;
  }
};

/**
 * Pulisce tutti gli interest e lo stato di Beams
 */
export const clearBeamsState = async (): Promise<void> => {
  try {
    await PusherBeams.clearAllState();
    console.log('🗑️ Beams state cleared');
  } catch (error) {
    console.error('❌ Errore clearing Beams state:', error);
  }
};

/**
 * Sottoscrive a un interest specifico
 */
export const subscribeToInterest = async (interest: string): Promise<void> => {
  try {
    await PusherBeams.subscribe(interest);
    console.log('📢 Sottoscritto a interest:', interest);
  } catch (error) {
    console.error('❌ Errore sottoscrizione interest:', error);
  }
};

/**
 * Rimuove sottoscrizione da un interest
 */
export const unsubscribeFromInterest = async (interest: string): Promise<void> => {
  try {
    await PusherBeams.unsubscribe(interest);
    console.log('� Rimossa sottoscrizione da interest:', interest);
  } catch (error) {
    console.error('❌ Errore rimozione sottoscrizione interest:', error);
  }
};
