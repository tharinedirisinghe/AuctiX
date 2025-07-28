import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import deliveryReducer from './slices/deliverySlice';
import notificationReducer from './slices/notificationSlice';
import pendingActionReducer from './slices/requiredActionsSlice';
import adminToolsReducer from './slices/adminToolsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    wallet: walletReducer,
    delivery: deliveryReducer,
    notifications: notificationReducer,
    pendingActions: pendingActionReducer,
    adminTools: adminToolsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
