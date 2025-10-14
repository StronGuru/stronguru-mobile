# Stronguru Mobile - AI Coding Agent Instructions

## Platform & Architecture

**Tech Stack**: Expo 53 + React Native 0.79 + TypeScript + `expo-router` (file-based routing in `app/`)

**State Management**: Zustand with AsyncStorage persistence via `persist` middleware

- Auth: `auth-storage` key (token, deviceId, userId) - see `src/store/authStore.ts`
- User data: `user-data-storage` key - see `src/store/userDataStore.ts`
- Chat badges: `src/store/chatBadgeStore.ts` and `chatRoomsRefreshStore.ts`
- Onboarding: `src/store/onboardingStore.ts`

**Routing**: File-based routing with protected routes via `Stack.Protected` guard in `app/_layout.tsx`

- Auth flow: `(auth)/*` → `(onboarding)/*` → `(tabs)/*` based on `isAuthenticated` + `hasCompletedOnboarding`
- Root layout controls splash screen visibility until stores hydrate (`isHydrated` flags)

**Styling**: NativeWind 4 (Tailwind for RN) - use `className` prop, not inline styles

- Theme system in `tailwind.config.js` uses CSS vars (`var(--color-primary, #10b981)`)
- Custom colors: `primary`, `secondary`, `accent`, `muted`, `surface`, etc.
- Dark mode: `darkMode: "class"` configured, toggled via `ThemeProvider.tsx`

## Development Workflow

```bash
npm install              # Install dependencies
npx expo start           # Start dev server (or npm start/ios/android/web)
npm run lint             # Run ESLint
npm run reset-project    # Reset to blank app
```

**No tests configured** - add unit tests by mocking `apiClient` and `supabase` clients.

## Critical API & Auth Pattern

**API Client** (`api/apiClient.ts`):

- Axios instance with `baseURL: process.env.EXPO_PUBLIC_API_URL`
- **Request interceptor**: injects `Authorization: Bearer <token>`, `X-Device-Id`, `X-Device-Type: mobile` from `useAuthStore`
- **Response interceptor**: handles 401 with token refresh flow:
  1. Calls `POST ${API_URL}/auth/refresh-token` with `withCredentials: true` (HTTP-only cookies)
  2. Uses refresh lock (`isRefreshing`, `refreshSubscribers`) to queue concurrent 401s
  3. On success: updates `useAuthStore.setAuthData({ token: newToken })`, retries failed requests
  4. On failure: calls `useAuthStore.logoutUser()` + `useUserDataStore.clearUser()`

**Auth Store Critical Details** (`src/store/authStore.ts`):

- Persisted keys: `token`, `deviceId`, `userId`, `isAuthenticated`
- `logoutUser()` **explicitly removes** AsyncStorage keys `auth_token` and `device_id` (in addition to clearing store)
- Error handling: extensive status code mapping (400/401/422/429/500) with user-friendly Italian messages

**NEVER change** `withCredentials: true` on refresh calls without backend coordination.

## Supabase Realtime Chat Architecture

**Setup** (`lib/supabase/client.ts`):

```typescript
// REQUIRED polyfills for RN (import order matters)
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 10 } } });
```

**Chat Message Flow** (`hooks/use-realtime-chat.native.tsx`):

1. Fetch initial messages: `supabase.from("messages").select(...).eq("room_id", roomId)`
2. Subscribe to channel: `supabase.channel(\`room:${roomId}\`)`
3. Listen to **two event types**:
   - `broadcast` with `event: "message"` (custom client broadcasts)
   - `postgres_changes` with `event: "INSERT"` on `messages` table (DB-level inserts)
4. `sendMessage`: insert to DB + broadcast via `channel.send({ type: 'broadcast', event: 'message', payload })`
5. Typing indicators: broadcast `event: "typing"` with auto-clear after 5s timeout

**Room Management** (`src/services/chatService.native.ts`):

- `fetchRoomsForUser()`: batch fetches rooms, participants, messages; calculates unread counts
- `markMessagesAsRead()`: updates `read: true` for all non-sender messages in room
- Unread count: filters messages where `(read === null || read === false) && sender_id !== userId`

**Global Unread Badge** (`hooks/use-global-chat-realtime.ts`):

- Lives in root layout (`app/_layout.tsx`) to persist across navigation
- Subscribes to ALL rooms user participates in, counts total unread
- Uses `DeviceEventEmitter` for cross-component communication

## Platform-Specific Files (`.native.tsx/ts`)

14 `.native` files exist (chat components, services, hooks). These are **React Native-specific implementations**.

- Always prefer editing `.native` variants over generic files for RN behavior
- Examples: `use-realtime-chat.native.tsx`, `chatService.native.ts`, `ChatMessageItem.native.tsx`

## Path Alias & Import Conventions

**All imports use `@/` alias** (maps to repo root in `tsconfig.json`):

```typescript
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/src/store/authStore";
import apiClient from "@/api/apiClient";
```

## Debugging & Logging

**Extensive console logging** with emoji prefixes is the primary debug mechanism:

- `🔄` - process starting
- `✅` - success
- `❌` - error
- `📥/📤` - network calls
- `🔵/🔴` - state changes

Follow these patterns when adding logs. Search codebase for `console.log`/`console.error` to see existing patterns.

## Common Pitfalls

1. **AsyncStorage logout**: `logoutUser()` removes hardcoded keys `auth_token` and `device_id` - if you rename persist keys, update this logic
2. **Supabase polyfills**: MUST import `react-native-get-random-values` and `react-native-url-polyfill/auto` before creating client
3. **Realtime deduplication**: Both `broadcast` and `postgres_changes` fire for same message - check `prev.some(m => m.id === mapped.id)` before adding
4. **Splash screen**: Don't render UI until `authHydrated && onboardingHydrated && fontsLoaded` - keeps native splash visible during hydration
5. **Device headers**: Always include `X-Device-Id` and `X-Device-Type: mobile` in API calls (handled by apiClient interceptor)

## Key Files Reference

| File                                 | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `api/apiClient.ts`                   | Axios instance, auth interceptors, refresh flow |
| `src/store/authStore.ts`             | Auth state, login/logout, error mapping         |
| `src/store/userDataStore.ts`         | User profile data, CRUD operations              |
| `lib/supabase/client.ts`             | Supabase client with RN polyfills               |
| `hooks/use-realtime-chat.native.tsx` | Room-level realtime chat logic                  |
| `hooks/use-global-chat-realtime.ts`  | App-wide unread badge counter                   |
| `src/services/chatService.native.ts` | Room fetching, unread counting                  |
| `app/_layout.tsx`                    | Root router, protected routes, splash control   |
| `app/(tabs)/_layout.tsx`             | Bottom tab navigation, badge display            |
| `tailwind.config.js`                 | NativeWind theme config                         |

## Environment Variables

```bash
EXPO_PUBLIC_API_URL              # Backend API base URL
EXPO_PUBLIC_SUPABASE_URL         # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY    # Supabase anon/public key
```

## When Making Changes

**Auth/API changes**: Read `apiClient.ts` + `authStore.ts` together - they're tightly coupled via dynamic imports
**Chat changes**: Check BOTH `.native` file and corresponding service file (hook + service pattern)
**Store changes**: Update persist key names in BOTH `persist({ name: "..." })` AND any explicit AsyncStorage calls
**Routing changes**: Understand guard logic in `app/_layout.tsx` - uses `Stack.Protected` with zustand state guards
