import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AdminLogin from './components/auth/AdminLogin';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './components/dashboard/AdminDashboard';
import VendorManagement from './components/vendors/VendorManagement';
import VendorDetail from './components/vendors/VendorDetail';
import VendorPerformance from './components/performance/VendorPerformance';
import ProductMonitoring from './components/products/ProductMonitoring';
import PlatformOrders from './components/orders/PlatformOrders';
import PlatformReports from './components/reports/PlatformReports';
import VendorPayouts from './components/payouts/VendorPayouts';
import CouponManagement from './components/coupons/CouponManagement';
import CategoryManagement from './components/categories/CategoryManagement';
import SliderManagement from './components/sliders/SliderManagement';
import HomeShowcaseSettings from './components/settings/HomeShowcaseSettings';
import ScrollToTop from './components/common/ScrollToTop';

import { checkAdminAuth, setUnauthenticated } from './store/slices/authSlice';
import { fetchVendors } from './store/slices/vendorsSlice';
import { fetchAllOrders } from './store/slices/ordersSlice';
import { fetchAllProducts } from './store/slices/productsSlice';
import { fetchAdminMetrics } from './store/slices/analyticsSlice';
import { fetchPayouts } from './store/slices/payoutsSlice';
import { fetchCoupons } from './store/slices/couponsSlice';
import { fetchCategories } from './store/slices/categoriesSlice';
import { fetchSliders } from './store/slices/slidersSlice';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check admin session validation on initial load
  useEffect(() => {
    dispatch(checkAdminAuth());

    // Listen for unauthorized session expiration events
    const handleUnauthorized = () => {
      dispatch(setUnauthenticated());
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch]);

  // Fetch telemetry and platform records when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchVendors());
      dispatch(fetchAllOrders());
      dispatch(fetchAllProducts());
      dispatch(fetchAdminMetrics());
      dispatch(fetchPayouts());
      dispatch(fetchCoupons());
      dispatch(fetchCategories());
      dispatch(fetchSliders());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected Super Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <VendorManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <VendorDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sliders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SliderManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/home-showcase"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <HomeShowcaseSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CategoryManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coupons"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CouponManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payouts"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <VendorPayouts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <VendorPerformance />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductMonitoring />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PlatformOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PlatformReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
