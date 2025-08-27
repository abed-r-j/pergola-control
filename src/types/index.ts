export interface PergolaState {
  horizontalAngle: number; // degrees -40 to +40
  verticalAngle: number; // degrees -40 to +40
  lightSensorReading: number; // lux
  lastUpdated: string; // ISO timestamp
}

export interface NightModeStatus {
  active: boolean;
  previousMode?: PergolaMode;
}

export type PergolaMode = 'auto' | 'manual' | 'off';

export interface WebSocketMessage {
  cmd: 'MODE' | 'SET_ANGLES' | 'SET_STATE' | 'GET_STATE' | 'GET_MODE' | 'GET_DASHBOARD_DATA';
  mode?: PergolaMode;
  horiz?: number;
  vert?: number;
}

export interface WebSocketResponse {
  status?: string;
  data?: PergolaState;
  mode?: PergolaMode;
  night_mode?: NightModeStatus;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  last_used_mode: PergolaMode;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  pergola: {
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
  };
  websocket: {
    isConnected: boolean;
    reconnectAttempts: number;
    lastError: string | null;
  };
}

export interface JoystickPosition {
  x: number; // -1 to 1
  y: number; // -1 to 1
  horizontal: number; // -40 to 40 degrees
  vertical: number; // -40 to 40 degrees
}

export interface SparklineDataPoint {
  timestamp: number;
  value: number;
}
