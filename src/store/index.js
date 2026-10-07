import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vendorsReducer from './slices/vendorsSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import analyticsReducer from './slices/analyticsSlice';
import couponsReducer from './slices/couponsSlice';
import categoriesReducer from './slices/categoriesSlice';
import slidersReducer from './slices/slidersSlice';
import loadingReducer from './slices/loadingSlice';
import settingsReducer from './slices/settingsSlice';
import payoutsReducer from './slices/payoutsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendors: vendorsReducer,
    products: productsReducer,
    orders: ordersReducer,
    analytics: analyticsReducer,
    coupons: couponsReducer,
    categories: categoriesReducer,
    sliders: slidersReducer,
    loading: loadingReducer,
    settings: settingsReducer,
    payouts: payoutsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
