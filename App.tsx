import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { supabase } from './src/services/supabase';
import { setUser } from './src/store/slices/authSlice';

const App: React.FC = () => {
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session?.user) {
        // Get user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }: { data: any }) => {
            if (profile) {
              store.dispatch(setUser(profile));
            }
          });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          store.dispatch(setUser(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        store.dispatch(setUser(null));
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store} children={
        <NavigationContainer children={
          <>
            <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
            <AppNavigator />
          </>
        } />
      } />
    </SafeAreaProvider>
  );
};

export default App;
