import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vendorsReducer from './slices/vendorsSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import analyticsReducer from './slices/analyticsSlice';
import payoutsReducer from './slices/payoutsSlice';
import couponsReducer from './slices/couponsSlice';
import categoriesReducer from './slices/categoriesSlice';
import slidersReducer from './slices/slidersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendors: vendorsReducer,
    products: productsReducer,
    orders: ordersReducer,
    analytics: analyticsReducer,
    payouts: payoutsReducer,
    coupons: couponsReducer,
    categories: categoriesReducer,
    sliders: slidersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
