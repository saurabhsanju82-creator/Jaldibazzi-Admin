import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loginAdmin, clearAuthError } from '../../store/slices/authSlice';
import {
  FiLock,
  FiMail,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from 'react-icons/fi';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Admin email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const { isAuthenticated, user, loading, error } = useSelector((state) => state.auth);

  // Determine where to redirect after successful login
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // If already authenticated as admin, redirect to destination
    if (isAuthenticated && user?.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const resultAction = await dispatch(loginAdmin(values));
      if (loginAdmin.fulfilled.match(resultAction)) {
        navigate(from, { replace: true });
      }
    },
  });

  const handleFillTestCredentials = () => {
    dispatch(clearAuthError());
    formik.setValues({
      email: 'admin@jaldibaazi.com',
      password: 'admin123',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6">
      {/* Platform Branding */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 mb-4 tracking-wider uppercase">
          <FiShield className="text-emerald-400" /> Platform Control Center
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Super Admin Portal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to manage merchants, orders, and platform operations.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 rounded-2xl border border-slate-800 p-8 shadow-2xl backdrop-blur-sm">
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="text-rose-400 shrink-0 mt-0.5 text-sm" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearAuthError())}
              className="text-rose-400 hover:text-rose-200 ml-1 font-bold text-base leading-none"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider"
            >
              Admin Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@jaldibaazi.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                  formik.touched.email && formik.errors.email
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-slate-600 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-rose-400 text-xs mt-1.5">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                  formik.touched.password && formik.errors.password
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-slate-600 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition"
              >
                {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-rose-400 text-xs mt-1.5">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></span>
            ) : (
              <>
                Sign In to Platform <FiArrowRight className="text-base" />
              </>
            )}
          </button>
        </form>

        {/* Test Credentials Box */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Default Super Admin
            </span>
            <button
              type="button"
              onClick={handleFillTestCredentials}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              <FiCheckCircle className="text-xs" /> Auto-fill
            </button>
          </div>
          <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
            <div>
              <span className="text-slate-500">Email:</span> admin@jaldibaazi.com
            </div>
            <div>
              <span className="text-slate-500">Password:</span> admin123
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Enterprise E-Commerce Engine &copy; 2026 &bull; Super Administrator Mode
      </div>
    </div>
  );
}
