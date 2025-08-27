import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PergolaState, PergolaMode, NightModeStatus } from '../../types';

interface PergolaSliceState {
  currentMode: PergolaMode;
  state: PergolaState;
  nightMode: NightModeStatus;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  error: string | null;
  isLoading: boolean;
  angleHistory: Array<{
    timestamp: string;
    horizontal: number;
    vertical: number;
  }>;
  lastConnectedState: {
    mode: PergolaMode;
    state: PergolaState;
    nightMode: NightModeStatus;
    timestamp: string;
    userHasToggledMode: boolean; // Track if user has explicitly set a mode
  } | null;
  userHasToggledMode: boolean; // Track if user has explicitly set a mode in current session
}

const initialState: PergolaSliceState = {
  currentMode: 'auto', // Default mode but marked as not user-toggled
  state: {
    horizontalAngle: 0,
    verticalAngle: 0,
    lightSensorReading: 0,
    lastUpdated: new Date().toISOString(),
  },
  nightMode: {
    active: false,
  },
  connectionStatus: 'disconnected',
  error: null,
  isLoading: false,
  angleHistory: [],
  lastConnectedState: null,
  userHasToggledMode: false, // User hasn't explicitly chosen a mode yet
};

const pergolaSlice = createSlice({
  name: 'pergola',
  initialState,
  reducers: {
    setMode: (state: PergolaSliceState, action: PayloadAction<PergolaMode>) => {
      state.currentMode = action.payload;
      state.userHasToggledMode = true; // Mark that user has explicitly set a mode
      state.error = null;
    },
    setModeFromPi: (state: PergolaSliceState, action: PayloadAction<PergolaMode>) => {
      // Set mode without marking as user-toggled (Pi-initiated change)
      state.currentMode = action.payload;
      state.error = null;
    },
    updateState: (state: PergolaSliceState, action: PayloadAction<Partial<PergolaState>>) => {
      state.state = { ...state.state, ...action.payload };
      state.state.lastUpdated = new Date().toISOString();
      
      // Add to angle history for sparkline (keep last 60 entries)
      if (action.payload.horizontalAngle !== undefined || action.payload.verticalAngle !== undefined) {
        state.angleHistory.push({
          timestamp: state.state.lastUpdated,
          horizontal: state.state.horizontalAngle,
          vertical: state.state.verticalAngle,
        });
        
        // Keep only last 60 data points (1 minute at 1Hz)
        if (state.angleHistory.length > 60) {
          state.angleHistory = state.angleHistory.slice(-60);
        }
      }
    },
    setNightMode: (state: PergolaSliceState, action: PayloadAction<NightModeStatus>) => {
      state.nightMode = action.payload;
    },
    setConnectionStatus: (state: PergolaSliceState, action: PayloadAction<'connected' | 'connecting' | 'disconnected'>) => {
      state.connectionStatus = action.payload;
    },
    setError: (state: PergolaSliceState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state: PergolaSliceState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearAngleHistory: (state: PergolaSliceState) => {
      state.angleHistory = [];
    },
    setManualAngles: (state: PergolaSliceState, action: PayloadAction<{ horizontal: number; vertical: number }>) => {
      if (state.currentMode === 'manual') {
        state.state.horizontalAngle = Math.max(-40, Math.min(40, action.payload.horizontal));
        state.state.verticalAngle = Math.max(-40, Math.min(40, action.payload.vertical));
        state.state.lastUpdated = new Date().toISOString();
        
        // Add to history
        state.angleHistory.push({
          timestamp: state.state.lastUpdated,
          horizontal: state.state.horizontalAngle,
          vertical: state.state.verticalAngle,
        });
        
        if (state.angleHistory.length > 60) {
          state.angleHistory = state.angleHistory.slice(-60);
        }
      }
    },
    resetToDisconnectedState: (state: PergolaSliceState) => {
      // Save current state as last connected state before resetting
      if (state.connectionStatus === 'connected') {
        state.lastConnectedState = {
          mode: state.currentMode,
          state: { ...state.state },
          nightMode: { ...state.nightMode },
          timestamp: new Date().toISOString(),
          userHasToggledMode: state.userHasToggledMode,
        };
      }
      
      // If we have a last connected state, restore it instead of resetting to defaults
      if (state.lastConnectedState) {
        console.log('Restoring last connected state instead of resetting to defaults');
        state.currentMode = state.lastConnectedState.mode;
        state.state = { ...state.lastConnectedState.state };
        state.nightMode = { ...state.lastConnectedState.nightMode };
        state.userHasToggledMode = state.lastConnectedState.userHasToggledMode;
        // Update timestamp to current time
        state.state.lastUpdated = new Date().toISOString();
      } else {
        // No previous state, reset to defaults but don't mark as user-toggled
        console.log('No last connected state - keeping default mode but not marking as user-toggled');
        state.state.horizontalAngle = 0;
        state.state.verticalAngle = 0;
        state.state.lightSensorReading = 0;
        state.state.lastUpdated = new Date().toISOString();
        // Keep userHasToggledMode as false - no mode has been explicitly chosen by user
      }
      
      // Clear any errors
      state.error = null;
    },
    saveConnectedState: (state: PergolaSliceState) => {
      // Save current state when connected
      state.lastConnectedState = {
        mode: state.currentMode,
        state: { ...state.state },
        nightMode: { ...state.nightMode },
        timestamp: new Date().toISOString(),
        userHasToggledMode: state.userHasToggledMode,
      };
      console.log('Saved connected state:', state.lastConnectedState);
    },
    restoreLastConnectedState: (state: PergolaSliceState) => {
      // Restore last connected state without changing connection status
      if (state.lastConnectedState) {
        state.currentMode = state.lastConnectedState.mode;
        state.state = { ...state.lastConnectedState.state };
        state.nightMode = { ...state.lastConnectedState.nightMode };
        state.userHasToggledMode = state.lastConnectedState.userHasToggledMode;
        state.state.lastUpdated = new Date().toISOString();
        console.log('Restored last connected state');
      }
    },
  },
});

export const {
  setMode,
  setModeFromPi,
  updateState,
  setNightMode,
  setConnectionStatus,
  setError,
  setLoading,
  clearAngleHistory,
  setManualAngles,
  resetToDisconnectedState,
  saveConnectedState,
  restoreLastConnectedState,
} = pergolaSlice.actions;

export default pergolaSlice.reducer;
