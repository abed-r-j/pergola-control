import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, PergolaMode } from '../../types';
import { supabase } from '../../services/supabase';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          last_used_mode: 'auto',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return newProfile;
    }
    
    return profile;
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Wait longer for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to get the user profile with retries
      let profile = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!profile && attempts < maxAttempts) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid the error
        
        if (profileData) {
          profile = profileData;
          break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (profile) {
        return profile;
      } else {
        // Return basic user data - the profile exists, we just can't fetch it yet
        console.log('Profile exists but not fetchable yet, using basic user data');
        return {
          id: data.user.id,
          email: data.user.email || email,
          last_used_mode: 'auto' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    
    throw new Error('User creation failed');
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

export const updateLastUsedMode = createAsyncThunk(
  'auth/updateLastUsedMode',
  async (mode: PergolaMode, { getState }: { getState: () => any }) => {
    const state = getState() as any;
    const userId = state.auth.user?.id;
    
    if (!userId) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('users')
      .update({ last_used_mode: mode })
      .eq('id', userId);
    
    if (error) throw error;
    return mode;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state: AuthState) => {
      state.error = null;
    },
    setUser: (state: AuthState, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder: any) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state: AuthState, action: any) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state: AuthState, action: any) => {
        state.isLoading = false;
        state.error = action.error.message || 'Sign in failed';
      })
      // Sign Up
      .addCase(signUp.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state: AuthState, action: any) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state: AuthState, action: any) => {
        state.isLoading = false;
        state.error = action.error.message || 'Sign up failed';
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state: AuthState) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Update Last Used Mode
      .addCase(updateLastUsedMode.fulfilled, (state: AuthState, action: any) => {
        if (state.user) {
          state.user.last_used_mode = action.payload;
        }
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
