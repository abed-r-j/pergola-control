/**
 * Mock WebSocket service for testing
 */

import { WebSocketMessage, WebSocketResponse, PergolaMode } from '../types';

export class MockWebSocketService {
  private isConnected = false;
  private listeners: Array<(data: WebSocketResponse) => void> = [];
  
  connect() {
    setTimeout(() => {
      this.isConnected = true;
      this.notifyListeners({
        status: 'connected',
        data: {
          horizontalAngle: 0,
          verticalAngle: 0,
          lightSensorReading: 1000,
          lastUpdated: new Date().toISOString(),
        },
      });
    }, 100);
  }

  disconnect() {
    this.isConnected = false;
  }

  sendMessage(message: WebSocketMessage) {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    // Simulate Pi response
    setTimeout(() => {
      let response: WebSocketResponse;

      switch (message.cmd) {
        case 'MODE':
          response = {
            status: 'mode_changed',
            data: this.generateMockData(),
          };
          break;
        
        case 'SET_ANGLES':
          response = {
            status: 'angles_set',
            data: {
              ...this.generateMockData(),
              horizontalAngle: message.horiz || 0,
              verticalAngle: message.vert || 0,
            },
          };
          break;
        
        case 'SET_STATE':
          response = {
            status: 'state_set',
            data: {
              ...this.generateMockData(),
              horizontalAngle: message.horiz || 0,
              verticalAngle: message.vert || 0,
            },
          };
          break;
        
        default:
          response = { error: 'Unknown command' };
      }

      this.notifyListeners(response);
    }, 50);
  }

  setMode(mode: PergolaMode) {
    this.sendMessage({ cmd: 'MODE', mode });
  }

  setAngles(horizontal: number, vertical: number) {
    this.sendMessage({ cmd: 'SET_ANGLES', horiz: horizontal, vert: vertical });
  }

  setOffState() {
    this.sendMessage({ cmd: 'SET_STATE', horiz: 0, vert: 0 });
  }

  onMessage(callback: (data: WebSocketResponse) => void) {
    this.listeners.push(callback);
  }

  // Simulate night mode activation
  simulateNightMode(active: boolean) {
    setTimeout(() => {
      this.notifyListeners({
        status: 'night_mode',
        night_mode: {
          active,
          previousMode: active ? 'auto' : undefined,
        },
        data: this.generateMockData(),
      });
    }, 100);
  }

  // Simulate sensor data updates
  simulateDataUpdate() {
    if (this.isConnected) {
      this.notifyListeners({
        status: 'data_update',
        data: this.generateMockData(),
      });
    }
  }

  private generateMockData() {
    return {
      horizontalAngle: (Math.random() - 0.5) * 80, // -40 to +40
      verticalAngle: (Math.random() - 0.5) * 80,
      lightSensorReading: Math.random() * 10000,
      lastUpdated: new Date().toISOString(),
    };
  }

  private notifyListeners(data: WebSocketResponse) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const mockWebSocketService = new MockWebSocketService();
