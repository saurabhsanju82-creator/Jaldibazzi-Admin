import React, { useState, useEffect } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../services/axiosClient';
import { saveSettings } from '../../store/slices/settingsSlice';
import { updateUserData } from '../../store/slices/authSlice';
import { DATE_FORMATS, formatDate } from '../common/Pagination';
import SystemStatusSettings from './SystemStatusSettings';
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiLock,
  FiSliders,
  FiActivity
} from 'react-icons/fi';

const TABS = [
  { id: 'account', label: 'Account', icon: FiUser },
  { id: 'status', label: 'Live Status & Monitoring', icon: FiActivity },
];

const PAGE_SIZES = [5, 10, 20, 50, 100];

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition';
const disabledInputClass =
  'w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none';
const saveBtnClass =
  'w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 text-center';

function Notice({ msg }) {
  if (!msg) return null;
  return (
    <div
      className={`p-3 rounded-xl text-xs font-semibold ${
        msg.ok
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
      }`}
    >
      {msg.text}
    </div>
  );
}

function AccountTab() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { pageSize: storedPageSize, dateFormat: storedDateFormat } = useSelector((state) => state.settings);

  // Profile Name State
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setProfileMsg({ ok: false, text: 'Name cannot be empty' });
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await axiosClient.put('/auth/me', { name: name.trim() });
      const updatedUser = res.data?.data || { name: name.trim() };
      dispatch(updateUserData(updatedUser));
      setProfileMsg({ ok: true, text: 'Profile name updated successfully.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.message || err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // Preferences State (Pagination & Date Format)
  const [pageSize, setPageSize] = useState(storedPageSize || 10);
  const [dateFormat, setDateFormat] = useState(storedDateFormat || 'DD/MM/YYYY');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState(null);

  useEffect(() => {
    if (storedPageSize) setPageSize(storedPageSize);
  }, [storedPageSize]);

  useEffect(() => {
    if (storedDateFormat) setDateFormat(storedDateFormat);
  }, [storedDateFormat]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsMsg(null);
    const res = await dispatch(saveSettings({ pageSize: Number(pageSize), dateFormat }));
    if (saveSettings.fulfilled.match(res)) {
      setPrefsMsg({ ok: true, text: 'Preferences saved successfully.' });
    } else {
      setPrefsMsg({ ok: false, text: res.payload || 'Failed to save preferences' });
    }
    setSavingPrefs(false);
  };

  // Password State
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 6) {
      return setPassMsg({ ok: false, text: 'New password must be at least 6 characters' });
    }
    if (passForm.newPassword !== passForm.confirm) {
      return setPassMsg({ ok: false, text: 'Passwords do not match' });
    }
    setSavingPass(true);
    setPassMsg(null);
    try {
      await axiosClient.put('/auth/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassMsg({ ok: true, text: 'Password changed successfully.' });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPassMsg({ ok: false, text: err.response?.data?.message || err.message });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="w-full">
      {/* 3-Column Equal Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: Personal Information */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleUpdateProfile} className="flex flex-col h-full justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FiUser className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your account name and identity details.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Read-only
                  </span>
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className={disabledInputClass}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Email is locked to administrator credentials.
                </p>
              </div>

              <Notice msg={profileMsg} />
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button type="submit" disabled={savingProfile} className={saveBtnClass}>
                {savingProfile ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: System Preferences */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSavePreferences} className="flex flex-col h-full justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FiSliders className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">System Preferences</h3>
                  <p className="text-xs text-slate-500">Configure global table pagination and date representation.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Pagination (Rows per page)
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className={inputClass}
                >
                  {PAGE_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} records per page
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Applies across Users, Payments, and listings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Format Representation
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className={inputClass}
                >
                  {DATE_FORMATS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt} (e.g. {formatDate(new Date(), fmt)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono text-slate-600">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">
                  Live Preview
                </div>
                <div>Date: <span className="font-semibold text-slate-900">{formatDate(new Date(), dateFormat)}</span></div>
                <div>Page Size: <span className="font-semibold text-slate-900">{pageSize} records</span></div>
              </div>

              <Notice msg={prefsMsg} />
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button type="submit" disabled={savingPrefs} className={saveBtnClass}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 3: Change Password */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleUpdatePassword} className="flex flex-col h-full justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FiLock className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500">Update your security credentials to protect the portal.</p>
                </div>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                    className={`${inputClass} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                    title={showPassword.current ? 'Hide password' : 'Show password'}
                  >
                    {showPassword.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 chars)"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    className={`${inputClass} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                    title={showPassword.new ? 'Hide password' : 'Show password'}
                  >
                    {showPassword.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passForm.confirm}
                    onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                    className={`${inputClass} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                    title={showPassword.confirm ? 'Hide password' : 'Show password'}
                  >
                    {showPassword.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Notice msg={passMsg} />
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button type="submit" disabled={savingPass} className={saveBtnClass}>
                {savingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { tab } = useParams();

  if (!TABS.some((t) => t.id === tab)) return <Navigate to="/settings/account" replace />;

  return (
    <div className="space-y-6 w-full">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account credentials, preferences, and real-time service monitors.
        </p>
      </div>

      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <NavLink
            key={id}
            to={`/settings/${id}`}
            className={({ isActive }) =>
              `pb-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
                isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="text-sm" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {tab === 'account' && <AccountTab />}
      {tab === 'status' && <SystemStatusSettings />}
    </div>
  );
}
