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
  setError as setPergolaError,
  setMode,
  setModeFromPi,
  setManualAngles,
  resetToDisconnectedState,
  saveConnectedState,
  restoreLastConnectedState
} from '../store/slices/pergolaSlice';
import { WebSocketMessage, WebSocketResponse, PergolaMode } from '../types';

// Replace this with your Raspberry Pi's actual IP address
// Find it using: hostname -I
const WEBSOCKET_URL = 'ws://192.168.1.16:8080'; // Your Raspberry Pi IP address
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
const DATA_FETCH_TIMEOUT = 5000; // 5 seconds timeout for fetching data

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private dashboardUpdateInterval: number | null = null;
  private isManualDisconnect = false;
  private connectionAttemptCount = 0;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionAttemptCount++;
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
        this.connectionAttemptCount = 0;
        
        // Fetch all app data from Raspberry Pi on successful connection
        this.fetchAllAppData();
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
        
        // Save current state before disconnecting (if we were connected)
        const state = store.getState() as any;
        if (state.pergola.connectionStatus === 'connected') {
          store.dispatch(saveConnectedState());
        }
        
        store.dispatch(setConnected(false));
        store.dispatch(setWSConnectionStatus('disconnected'));
        store.dispatch(setConnectionStatus('disconnected'));
        
        // Restore last connected state instead of resetting to defaults
        store.dispatch(resetToDisconnectedState());
        
        // Auto-reconnect on disconnection (requirement 1)
        if (!this.isManualDisconnect) {
          console.log('Auto-reconnecting after disconnection...');
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Save current state before error (if we were connected)
        const state = store.getState() as any;
        if (state.pergola.connectionStatus === 'connected') {
          store.dispatch(saveConnectedState());
        }
        
        store.dispatch(setWebSocketError('Connection error'));
        store.dispatch(setWSConnectionStatus('error'));
        store.dispatch(setConnectionStatus('disconnected'));
        
        // Restore last connected state
        store.dispatch(resetToDisconnectedState());
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      store.dispatch(setWebSocketError('Failed to connect'));
      store.dispatch(setWSConnectionStatus('error'));
      store.dispatch(setConnectionStatus('disconnected'));
      
      // Reset to disconnected state
      store.dispatch(resetToDisconnectedState());
      this.handleReconnect();
    }
  }

  disconnect() {
    this.isManualDisconnect = true;
    
    // Stop real-time dashboard updates
    this.stopRealTimeDashboardUpdates();
    
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
    store.dispatch(resetToDisconnectedState());
  }

  // Manual refresh method for connection status button
  manualRefresh() {
    console.log('Manual refresh triggered');
    
    // Reset reconnection attempts for manual refresh
    this.connectionAttemptCount = 0;
    
    // Disconnect if currently connected or connecting
    if (this.ws) {
      this.isManualDisconnect = true;
      this.ws.close();
      this.ws = null;
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Reset manual disconnect flag and attempt connection
    this.isManualDisconnect = false;
    this.connect();
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

  // Fetch all app data when connecting/reconnecting (requirement 2)
  private fetchAllAppData() {
    console.log('Fetching all app data from Raspberry Pi on connection/reconnection...');
    
    // Request current state data (Manual Control data)
    this.sendMessage({ cmd: 'GET_STATE' });
    
    // Request current mode (Control Mode data) 
    this.sendMessage({ cmd: 'GET_MODE' });
    
    // Request dashboard data (Live Dashboard data)
    this.sendMessage({ cmd: 'GET_DASHBOARD_DATA' });
    
    // Start real-time dashboard data fetching when connected
    this.startRealTimeDashboardUpdates();
    
    // Set a timeout to handle missing data
    setTimeout(() => {
      const state = store.getState() as any;
      if (state.pergola.connectionStatus === 'connected') {
        console.log('Data fetch completed or timed out');
        this.handleMissingData();
      }
    }, DATA_FETCH_TIMEOUT);
  }

  // Start real-time dashboard updates (requirement: real-time when connected)
  private startRealTimeDashboardUpdates() {
    // Clear any existing interval
    if (this.dashboardUpdateInterval) {
      clearInterval(this.dashboardUpdateInterval);
    }
    
    // Fetch dashboard data every 2 seconds when connected
    this.dashboardUpdateInterval = setInterval(() => {
      const state = store.getState() as any;
      if (state.pergola.connectionStatus === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ cmd: 'GET_DASHBOARD_DATA' });
      } else {
        // Stop updates if disconnected
        this.stopRealTimeDashboardUpdates();
      }
    }, 2000) as any;
  }

  private stopRealTimeDashboardUpdates() {
    if (this.dashboardUpdateInterval) {
      clearInterval(this.dashboardUpdateInterval);
      this.dashboardUpdateInterval = null;
    }
  }

  private handleMissingData() {
    const state = store.getState() as any;
    const pergolaState = state.pergola.state;
    
    // If no manual control data or angles are 0, default joystick to center (requirement)
    if (pergolaState.horizontalAngle === 0 && pergolaState.verticalAngle === 0) {
      console.log('No manual control data fetched - defaulting joystick to center (0,0)');
      store.dispatch(setManualAngles({ horizontal: 0, vertical: 0 }));
    }
    
    // Save the current connected state after data fetching
    store.dispatch(saveConnectedState());
  }

  private handleMessage(response: WebSocketResponse) {
    if (response.error) {
      store.dispatch(setPergolaError(response.error));
      return;
    }

    // Handle different types of data responses
    if (response.data) {
      // Validate and handle each piece of data individually
      const validatedData: any = {};
      
      if (typeof response.data.horizontalAngle === 'number') {
        validatedData.horizontalAngle = response.data.horizontalAngle;
      }
      
      if (typeof response.data.verticalAngle === 'number') {
        validatedData.verticalAngle = response.data.verticalAngle;
      }
      
      // Handle Light Sensor data with special error handling (requirement: mark as N/A if fails)
      if (typeof response.data.lightSensorReading === 'number') {
        validatedData.lightSensorReading = response.data.lightSensorReading;
      } else if (response.data.lightSensorReading === undefined || response.data.lightSensorReading === null) {
        // Light sensor failed to fetch - will be shown as N/A in Dashboard due to connection logic
        console.log('Light sensor data failed to fetch - will show as N/A');
        validatedData.lightSensorReading = 0; // Dashboard shows N/A based on connection status
      }
      
      // Only update with valid data
      if (Object.keys(validatedData).length > 0) {
        store.dispatch(updateState(validatedData));
        
        // Save state when receiving data while connected
        const state = store.getState() as any;
        if (state.pergola.connectionStatus === 'connected') {
          store.dispatch(saveConnectedState());
        }
      }
    }

    // Handle mode data (always sync with Pi's current mode on connection/reconnection)
    if (response.mode) {
      const state = store.getState() as any;
      // Only update mode if we're connected
      if (state.pergola.connectionStatus === 'connected') {
        // Always update mode from Pi to ensure UI is in sync
        console.log('Received mode update from Pi:', response.mode);
        store.dispatch(setModeFromPi(response.mode));
      }
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
