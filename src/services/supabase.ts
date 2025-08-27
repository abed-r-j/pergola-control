import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase project credentials
const supabaseUrl = 'https://vtqtwjfcwqjjtvfucvfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cXR3amZjd3FqanR2ZnVjdmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjgxNjAsImV4cCI6MjA2NzkwNDE2MH0.SArMuZCuJLJN6t_6iIRFPWph4GlKAJfNcNo6sg0oHUE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          last_used_mode: 'auto' | 'manual' | 'off';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          last_used_mode?: 'auto' | 'manual' | 'off';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          last_used_mode?: 'auto' | 'manual' | 'off';
          created_at?: string;
        };
      };
    };
  };
}
