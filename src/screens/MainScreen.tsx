import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { signOut } from '../store/slices/authSlice';
import { setMode } from '../store/slices/pergolaSlice';
import { webSocketService } from '../services/websocket';
import ModeSelector from '../components/ModeSelector';
import Dashboard from '../components/Dashboard';
import ManualControl from '../components/ManualControl';
import NightModeIndicator from '../components/NightModeIndicator';
import ConnectionStatus from '../components/ConnectionStatus';
import { PergolaMode } from '../types';

const MainScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const signOutDialogShowing = useRef(false);
  const { user } = useAppSelector((state) => state.auth);
  const { currentMode, nightMode, connectionStatus, userHasToggledMode } = useAppSelector(
    (state) => state.pergola
  );

  useEffect(() => {
    // Connect to WebSocket when component mounts (user login/app entry)
    console.log('MainScreen mounted - attempting to connect to Raspberry Pi');
    webSocketService.connect();

    return () => {
      // Disconnect when component unmounts
      webSocketService.disconnect();
    };
  }, []);

  const handleModeChange = (mode: PergolaMode) => {
    dispatch(setMode(mode));
    webSocketService.setMode(mode);
  };

  const handleSignOut = async () => {
    // Prevent multiple sign out dialogs from showing
    if (signOutDialogShowing.current) {
      return;
    }

    signOutDialogShowing.current = true;
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            signOutDialogShowing.current = false;
          }
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              webSocketService.disconnect();
              await (dispatch as any)(signOut());
            } finally {
              signOutDialogShowing.current = false;
            }
          },
        },
      ],
      {
        onDismiss: () => {
          signOutDialogShowing.current = false;
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarArea, { height: insets.top }]} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Pergola Control</Text>
          <Text style={styles.subtitle}>Welcome, {user?.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <ConnectionStatus status={connectionStatus} />
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {nightMode.active && <NightModeIndicator />}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.dashboardSection, 
          (connectionStatus === 'connecting' || connectionStatus === 'disconnected') && styles.washedOut
        ]}>
          <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
          
          <Dashboard />

          <View style={styles.manualControlContainer}>
            {currentMode === 'manual' && <ManualControl />}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  manualControlContainer: {
    // Consistent spacing and layout for manual control area
    // This ensures stable layout regardless of whether ManualControl is shown
  },
  dashboardSection: {
    // Container for all dashboard elements from Control Mode downward
  },
  washedOut: {
    opacity: 0.6,
  },
  statusBarArea: {
    backgroundColor: '#2196F3', // Same blue as header to make status bar visible
  },
});

export default MainScreen;
