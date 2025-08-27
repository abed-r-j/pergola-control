import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const initialState: WebSocketState = {
  isConnected: false,
  reconnectAttempts: 0,
  lastError: null,
  connectionStatus: 'disconnected',
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnectionStatus: (state: WebSocketState, action: PayloadAction<'disconnected' | 'connecting' | 'connected' | 'error'>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
    setConnected: (state: WebSocketState, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.connectionStatus = action.payload ? 'connected' : 'disconnected';
      if (action.payload) {
        state.reconnectAttempts = 0;
        state.lastError = null;
      }
    },
    incrementReconnectAttempts: (state: WebSocketState) => {
      state.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state: WebSocketState) => {
      state.reconnectAttempts = 0;
    },
    setError: (state: WebSocketState, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
      state.connectionStatus = 'error';
    },
    disconnect: (state: WebSocketState) => {
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
  },
});

export const {
  setConnectionStatus,
  setConnected,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  setError,
  disconnect,
} = websocketSlice.actions;

export default websocketSlice.reducer;
