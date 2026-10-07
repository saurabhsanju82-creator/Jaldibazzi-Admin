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
import CouponManagement from './components/coupons/CouponManagement';
import CategoryManagement from './components/categories/CategoryManagement';
import StoreSettings from './components/settings/StoreSettings';
import SettingsPage from './components/settings/SettingsPage';
import UsersPage from './components/users/UsersPage';
import PaymentsPage from './components/payments/PaymentsPage';
import EmailsPage from './components/emails/EmailsPage';
import ContactInquiries from './components/inquiries/ContactInquiries';
import VendorPayouts from './components/payouts/VendorPayouts';
import ScrollToTop from './components/common/ScrollToTop';

import { checkAdminAuth, setUnauthenticated } from './store/slices/authSlice';
import { fetchVendors } from './store/slices/vendorsSlice';
import { fetchAllOrders } from './store/slices/ordersSlice';
import { fetchAllProducts } from './store/slices/productsSlice';
import { fetchAdminMetrics } from './store/slices/analyticsSlice';
import { fetchCoupons } from './store/slices/couponsSlice';
import { fetchCategories } from './store/slices/categoriesSlice';
import { fetchSliders } from './store/slices/slidersSlice';
import { fetchSettings } from './store/slices/settingsSlice';
import { fetchPayouts } from './store/slices/payoutsSlice';

import GlobalApiLoader from './components/common/GlobalApiLoader';
import { startLoading, stopLoading } from './store/slices/loadingSlice';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check admin session validation & global API loader listeners on initial load
  useEffect(() => {
    dispatch(checkAdminAuth());

    // Global API loader event listeners
    const handleLoadingStart = () => dispatch(startLoading());
    const handleLoadingStop = () => dispatch(stopLoading());

    window.addEventListener('api:loading:start', handleLoadingStart);
    window.addEventListener('api:loading:stop', handleLoadingStop);

    // Listen for unauthorized session expiration events
    const handleUnauthorized = () => {
      dispatch(setUnauthenticated());
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('api:loading:start', handleLoadingStart);
      window.removeEventListener('api:loading:stop', handleLoadingStop);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [dispatch]);

  // Fetch telemetry and platform records when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchVendors());
      dispatch(fetchAllOrders());
      dispatch(fetchAllProducts());
      dispatch(fetchAdminMetrics());
      dispatch(fetchCoupons());
      dispatch(fetchCategories());
      dispatch(fetchSliders());
      dispatch(fetchSettings());
      dispatch(fetchPayouts());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <BrowserRouter>
      <GlobalApiLoader />
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
        <Route path="/sliders" element={<Navigate to="/store-settings/sliders" replace />} />
        <Route path="/home-showcase" element={<Navigate to="/store-settings/featured" replace />} />
        <Route path="/store-settings" element={<Navigate to="/store-settings/sliders" replace />} />
        <Route
          path="/store-settings/:tab"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <StoreSettings />
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
        <Route path="/vendors/payouts" element={<Navigate to="/payouts" replace />} />
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
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PaymentsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <EmailsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inquiries"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ContactInquiries />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/contact-inquiries" element={<Navigate to="/inquiries" replace />} />
        <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
        <Route
          path="/settings/:tab"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SettingsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/system-status" element={<Navigate to="/settings/status" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
