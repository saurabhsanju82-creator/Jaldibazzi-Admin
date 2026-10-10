import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginAdmin, clearAuthError } from '../../store/slices/authSlice';
import {
  FiLock,
  FiMail,
  FiArrowRight,
  FiShield,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from 'react-icons/fi';
import loginBgImage from '../../assets/login.jpeg';
import logoImg from '../../assets/logo.png';

const loginSchema = z.object({
  email: z.string().min(1, 'Admin email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    const resultAction = await dispatch(loginAdmin(values));
    if (loginAdmin.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat text-slate-800 flex flex-col justify-center items-center px-4 sm:px-6 py-12 antialiased overflow-hidden select-none"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-none"></div>

      {/* Platform Branding */}
      <div className="relative z-10 w-full max-w-md mb-6 flex flex-col items-center justify-center">
        <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-white/50 flex items-center justify-center">
          <img src={logoImg} alt="JaldiBaazi" className="h-9 w-auto object-contain" />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xl shadow-slate-950/30">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start justify-between gap-2 animate-fadeIn shadow-xs">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="text-rose-500 shrink-0 mt-0.5 text-sm" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearAuthError())}
              className="text-rose-500 hover:text-rose-700 ml-1 font-bold text-base leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                  errors.password
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition cursor-pointer"
              >
                {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                Sign In <FiArrowRight className="text-base" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-white/80 font-medium drop-shadow-sm">
        JaldiBaazi &copy; 2026 &bull; Super Administrator Mode
      </div>
    </div>
  );
}
