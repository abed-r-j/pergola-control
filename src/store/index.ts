import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pergolaReducer from './slices/pergolaSlice';
import websocketReducer from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pergola: pergolaReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/setConnection'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
