/// <reference types="jest" />

import { configureStore } from '@reduxjs/toolkit';
import authSlice, { signIn, signOut } from '../store/slices/authSlice';
import pergolaSlice, { setMode, updateState } from '../store/slices/pergolaSlice';
import { mockWebSocketService } from '../services/mockWebSocket';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      pergola: pergolaSlice,
    },
  });
};

describe('Integration Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Authentication Flow', () => {
    it('should handle sign in flow', async () => {
      const initialState = store.getState();
      expect((initialState.auth as any).isAuthenticated).toBe(false);

      // Mock successful sign in
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        last_used_mode: 'auto' as const,
        created_at: new Date().toISOString(),
      };

      // Note: In real tests, you'd mock the Supabase client
      // For now, just test the reducer logic
      const action = signIn.fulfilled(mockUser, 'requestId', {
        email: 'test@example.com',
        password: 'password',
      });

      store.dispatch(action);

      const newState = store.getState();
      expect((newState.auth as any).isAuthenticated).toBe(true);
      expect((newState.auth as any).user.email).toBe('test@example.com');
    });

    it('should handle sign out flow', async () => {
      // First sign in
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        last_used_mode: 'auto' as const,
        created_at: new Date().toISOString(),
      };

      const signInAction = signIn.fulfilled(mockUser, 'requestId', {
        email: 'test@example.com',
        password: 'password',
      });
      store.dispatch(signInAction);

      // Then sign out
      const signOutAction = signOut.fulfilled(undefined, 'requestId', undefined);
      store.dispatch(signOutAction);

      const finalState = store.getState();
      expect((finalState.auth as any).isAuthenticated).toBe(false);
      expect((finalState.auth as any).user).toBe(null);
    });
  });

  describe('Pergola Control Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        last_used_mode: 'auto' as const,
        created_at: new Date().toISOString(),
      };

      const signInAction = signIn.fulfilled(mockUser, 'requestId', {
        email: 'test@example.com',
        password: 'password',
      });
      store.dispatch(signInAction);
    });

    it('should handle mode changes', () => {
      // Test auto mode
      store.dispatch(setMode('auto'));
      let state = store.getState();
      expect((state.pergola as any).currentMode).toBe('auto');

      // Test manual mode
      store.dispatch(setMode('manual'));
      state = store.getState();
      expect((state.pergola as any).currentMode).toBe('manual');

      // Test off mode
      store.dispatch(setMode('off'));
      state = store.getState();
      expect((state.pergola as any).currentMode).toBe('off');
    });

    it('should handle state updates', () => {
      const mockData = {
        horizontalAngle: 15.5,
        verticalAngle: -20.3,
        lightSensorReading: 2500,
      };

      store.dispatch(updateState(mockData));

      const state = store.getState();
      const pergolaState = (state.pergola as any).state;
      
      expect(pergolaState.horizontalAngle).toBe(15.5);
      expect(pergolaState.verticalAngle).toBe(-20.3);
      expect(pergolaState.lightSensorReading).toBe(2500);
      expect(pergolaState.lastUpdated).toBeDefined();
    });

    it('should maintain angle history', () => {
      const initialState = store.getState();
      expect((initialState.pergola as any).angleHistory).toHaveLength(0);

      // Add first data point
      store.dispatch(updateState({
        horizontalAngle: 10,
        verticalAngle: 5,
      }));

      let state = store.getState();
      expect((state.pergola as any).angleHistory).toHaveLength(1);

      // Add second data point
      store.dispatch(updateState({
        horizontalAngle: 15,
        verticalAngle: 10,
      }));

      state = store.getState();
      expect((state.pergola as any).angleHistory).toHaveLength(2);
      
      const history = (state.pergola as any).angleHistory;
      expect(history[0].horizontal).toBe(10);
      expect(history[0].vertical).toBe(5);
      expect(history[1].horizontal).toBe(15);
      expect(history[1].vertical).toBe(10);
    });
  });

  describe('WebSocket Integration', () => {
    beforeEach(() => {
      mockWebSocketService.connect();
    });

    afterEach(() => {
      mockWebSocketService.disconnect();
    });

    it('should handle connection and mode changes', (done) => {
      mockWebSocketService.onMessage((response) => {
        if (response.status === 'connected') {
          // Connection established, now test mode change
          mockWebSocketService.setMode('manual');
        } else if (response.status === 'mode_changed') {
          expect(response.data).toBeDefined();
          expect(response.data?.horizontalAngle).toBeDefined();
          expect(response.data?.verticalAngle).toBeDefined();
          done();
        }
      });
    });

    it('should handle angle setting in manual mode', (done) => {
      mockWebSocketService.onMessage((response) => {
        if (response.status === 'connected') {
          // Connection established, now test angle setting
          mockWebSocketService.setAngles(25, -15);
        } else if (response.status === 'angles_set') {
          expect(response.data?.horizontalAngle).toBe(25);
          expect(response.data?.verticalAngle).toBe(-15);
          done();
        }
      });
    });

    it('should handle night mode simulation', (done) => {
      mockWebSocketService.onMessage((response) => {
        if (response.status === 'connected') {
          // Connection established, simulate night mode
          mockWebSocketService.simulateNightMode(true);
        } else if (response.status === 'night_mode') {
          expect(response.night_mode?.active).toBe(true);
          expect(response.night_mode?.previousMode).toBe('auto');
          done();
        }
      });
    });
  });
});
