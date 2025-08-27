import { store } from '../store';
import { 
  setConnected, 
  setError as setWebSocketError,
  incrementReconnectAttempts,
  disconnect as disconnectWebSocket,
  setConnectionStatus as setWSConnectionStatus
} from '../store/slices/websocketSlice';
import { 
  updateState, 
  setNightMode, 
  setConnectionStatus, 
  setError as setPergolaError 
} from '../store/slices/pergolaSlice';
import { WebSocketMessage, WebSocketResponse, PergolaMode } from '../types';

// Replace this with your Raspberry Pi's actual IP address
// Find it using: hostname -I
const WEBSOCKET_URL = 'ws://192.168.1.100:8080'; // Replace with your actual Raspberry Pi IP
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private isManualDisconnect = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    store.dispatch(setWSConnectionStatus('connecting'));
    store.dispatch(setConnectionStatus('connecting'));
    
    try {
      this.ws = new WebSocket(WEBSOCKET_URL) as any;

      this.ws.onopen = () => {
        console.log('WebSocket connected to Raspberry Pi');
        store.dispatch(setConnected(true));
        store.dispatch(setWSConnectionStatus('connected'));
        store.dispatch(setConnectionStatus('connected'));
        store.dispatch(setWebSocketError(null));
        this.isManualDisconnect = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const response: WebSocketResponse = JSON.parse(event.data);
          this.handleMessage(response);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          store.dispatch(setPergolaError('Invalid message format from Pi'));
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        store.dispatch(setConnected(false));
        store.dispatch(setWSConnectionStatus('disconnected'));
        store.dispatch(setConnectionStatus('disconnected'));
        
        if (!this.isManualDisconnect) {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        store.dispatch(setWebSocketError('Connection error'));
        store.dispatch(setWSConnectionStatus('error'));
        store.dispatch(setConnectionStatus('disconnected'));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      store.dispatch(setWebSocketError('Failed to connect'));
      store.dispatch(setWSConnectionStatus('error'));
      store.dispatch(setConnectionStatus('disconnected'));
      this.handleReconnect();
    }
  }

  disconnect() {
    this.isManualDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    store.dispatch(disconnectWebSocket());
    store.dispatch(setConnectionStatus('disconnected'));
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('Sent message to Pi:', message);
      } catch (error) {
        console.error('Failed to send message:', error);
        store.dispatch(setPergolaError('Failed to send command'));
      }
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
      store.dispatch(setPergolaError('Not connected to Pi'));
    }
  }

  setMode(mode: PergolaMode) {
    this.sendMessage({ cmd: 'MODE', mode });
  }

  setAngles(horizontal: number, vertical: number) {
    // Clamp angles to valid range
    const horiz = Math.max(-40, Math.min(40, horizontal));
    const vert = Math.max(-40, Math.min(40, vertical));
    
    this.sendMessage({ 
      cmd: 'SET_ANGLES', 
      horiz, 
      vert 
    });
  }

  setOffState() {
    this.sendMessage({
      cmd: 'SET_STATE',
      horiz: 0,
      vert: 0
    });
  }

  private handleMessage(response: WebSocketResponse) {
    if (response.error) {
      store.dispatch(setPergolaError(response.error));
      return;
    }

    if (response.data) {
      store.dispatch(updateState(response.data));
    }

    if (response.night_mode) {
      store.dispatch(setNightMode(response.night_mode));
    }

    if (response.status === 'mode_changed') {
      store.dispatch(setPergolaError(null)); // Clear any previous errors
    }
  }

  private handleReconnect() {
    const state = store.getState() as any;
    const attempts = state.websocket.reconnectAttempts;

    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      store.dispatch(setWebSocketError('Connection failed after multiple attempts'));
      return;
    }

    store.dispatch(incrementReconnectAttempts());
    
    console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, RECONNECT_DELAY) as any;
  }
}

export const webSocketService = new WebSocketService();
