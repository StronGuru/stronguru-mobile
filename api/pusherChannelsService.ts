import { useAuthStore } from '@/src/store/authStore';
import Pusher from 'pusher-js';

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? "";
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? "eu";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Assicurati che l'API URL abbia uno slash finale
const API_BASE = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

if (!PUSHER_KEY) {
  console.warn("⚠️ EXPO_PUBLIC_PUSHER_KEY not configured");
}

// Abilita log di debug Pusher
Pusher.logToConsole = true;

const pusherClient = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER,
  forceTLS: true,
  authEndpoint: `${API_BASE}pusher/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${useAuthStore.getState().token}`
    }
  },
  // Funzione di autorizzazione personalizzata per aggiornare il token dinamicamente
  authorizer: (channel) => {
    return {
      authorize: (socketId, callback) => {
        const token = useAuthStore.getState().token;
        const authUrl = `${API_BASE}pusher/auth`;
        console.log('🔐 Pusher authorizer called for channel:', channel.name);
        console.log('🔑 Socket ID:', socketId);
        console.log('🔑 Token exists:', !!token);
        console.log('🎯 Auth endpoint:', authUrl);
        
        fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name
          })
        })
          .then(response => {
            console.log('✅ Auth response status:', response.status);
            if (!response.ok) {
              throw new Error(`Auth failed: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('✅ Auth successful for channel:', channel.name);
            callback(null, data);
          })
          .catch(error => {
            console.error('❌ Auth error for channel:', channel.name, error);
            callback(error, null);
          });
      }
    };
  }
});

console.log('🚀 Pusher client initialized with key:', PUSHER_KEY?.substring(0, 10) + '...');
console.log('🌐 Pusher cluster:', PUSHER_CLUSTER);
console.log('🔐 Auth endpoint:', `${API_BASE}pusher/auth`);

export default pusherClient;
