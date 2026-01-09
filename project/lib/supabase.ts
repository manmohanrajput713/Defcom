import './fetch-polyfill';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fallback configuration for development/testing
const DEFAULT_SUPABASE_URL = 'https://placeholder.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'placeholder-key';

// Get environment variables with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || supabaseUrl === DEFAULT_SUPABASE_URL) {
  console.warn('⚠️  EXPO_PUBLIC_SUPABASE_URL is not set. Using placeholder URL.');
}

if (!supabaseAnonKey || supabaseAnonKey === DEFAULT_SUPABASE_ANON_KEY) {
  console.warn('⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Using placeholder key.');
}

// Custom storage adapter for React Native using SecureStore
// This ensures auth sessions persist across app restarts
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[supabase] Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[supabase] Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[supabase] Storage removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: ExpoSecureStoreAdapter,
  },
  realtime: {
    // Default configuration (auto connected)
  },
  global: {
    // Use native fetch from React Native
    fetch: globalThis.fetch,
    // Headers constructor is not compatible with Record<string, string>, but standard fetch uses Headers object
    // @ts-ignore
    headers: globalThis.Headers,
  },
});
