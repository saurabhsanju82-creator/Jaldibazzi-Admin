import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCoupons,
  createNewCoupon,
  updateExistingCoupon,
  toggleCouponActiveStatus,
  deleteExistingCoupon,
  setStatusFilter,
  setCouponSearch,
} from '../../store/slices/couponsSlice';
import CreateCouponModal from './CreateCouponModal';
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiClock,
  FiTrendingUp,
  FiPercent,
  FiUsers,
  FiAlertCircle,
  FiLayers,
} from 'react-icons/fi';

export default function CouponManagement() {
  const dispatch = useDispatch();
  const { items: coupons, loading, statusFilter, searchQuery } = useSelector(
    (state) => state.coupons || { items: [] }
  );
  const { items: vendors } = useSelector((state) => state.vendors || { items: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'percent', 'fixed'

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  // Handle copy code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  const handleSaveCoupon = (couponData) => {
    if (editingCoupon) {
      const id = editingCoupon.id || editingCoupon._id;
      dispatch(updateExistingCoupon({ id, couponData }));
    } else {
      dispatch(createNewCoupon(couponData));
    }
  };

  const handleToggleStatus = (coupon) => {
    const id = coupon.id || coupon._id;
    dispatch(toggleCouponActiveStatus({ id, isActive: !coupon.isActive }));
  };

  const handleDeleteCoupon = (coupon) => {
    if (window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      const id = coupon.id || coupon._id;
      dispatch(deleteExistingCoupon(id));
    }
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.code || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q);

    let matchesStatus = true;
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    if (statusFilter === 'ACTIVE') matchesStatus = c.isActive && !isExpired;
    else if (statusFilter === 'INACTIVE') matchesStatus = !c.isActive;
    else if (statusFilter === 'EXPIRED') matchesStatus = isExpired;

    let matchesType = true;
    if (typeFilter !== 'ALL') matchesType = c.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // KPI calculations
  const totalActive = coupons.filter(
    (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= new Date())
  ).length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const totalVendorsEnrolled = new Set(
    coupons.flatMap((c) => (Array.isArray(c.enrolledVendors) ? c.enrolledVendors.map((v) => (typeof v === 'object' ? v._id : v)) : []))
  ).size;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
            <FiTag className="text-xs" /> Marketplace Global Promotions
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Coupon &amp; Discount Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create global marketplace vouchers that vendors can opt-in to apply on their catalog products.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <FiPlus className="text-sm stroke-[3]" /> Create Global Coupon
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Global Coupons
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalActive}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <FiCheckCircle className="text-xs" /> Live for merchant selection
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <FiTag />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Redemptions
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalUsedCount}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5 flex items-center gap-1">
              <FiTrendingUp className="text-xs" /> Platform-wide usage
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FiPercent />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Participating Vendors
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalVendorsEnrolled || vendors.length}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
              <FiUsers className="text-xs" /> Enrolled merchant stores
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
            <FiUsers />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Created Vouchers
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{coupons.length}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <FiLayers className="text-xs" /> Active &amp; archived
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
            <FiLayers />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: 'ALL', label: 'All Coupons' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'INACTIVE', label: 'Disabled' },
              { id: 'EXPIRED', label: 'Expired' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => dispatch(setStatusFilter(tab.id))}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="percent">Percentage (%) Off</option>
            <option value="fixed">Flat Amount (₹) Off</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => dispatch(setCouponSearch(e.target.value))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>
      </div>

      {/* Coupons List / Cards */}
      {loading && coupons.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading marketplace coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            <FiTag />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Coupons Found</h3>
          <p className="text-xs text-slate-500 mb-5">
            {searchQuery
              ? `No coupons match "${searchQuery}".`
              : 'Create global discount coupons so vendors can offer promotional savings to customers.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FiPlus className="text-sm stroke-[3]" /> Create First Global Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const usagePercent =
              coupon.usageLimit && coupon.usageLimit > 0
                ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
                : null;

            return (
              <div
                key={coupon.id || coupon._id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                  !coupon.isActive || isExpired
                    ? 'border-slate-200/60 opacity-80'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Top Badge & Code */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Discount Pill Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-xs ${
                        coupon.type === 'percent'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <FiPercent className="text-xs" />
                      <span>
                        {coupon.type === 'percent'
                          ? `${coupon.value}% OFF`
                          : `₹${coupon.value} FLAT OFF`}
                      </span>
                    </div>

                    {/* Status Toggle Switch / Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isExpired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Promo Code Box */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-3">
                    <div className="flex items-center gap-2">
                      <FiTag className="text-slate-400 text-sm" />
                      <span className="font-mono font-bold text-sm tracking-wider text-slate-900">
                        {coupon.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-200/60 transition cursor-pointer flex items-center gap-1 font-medium"
                      title="Copy promo code"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <FiCheck className="text-emerald-600" />
                          <span className="text-[11px] text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{coupon.title || coupon.code}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {coupon.description || 'Global marketplace coupon voucher available for vendor selection.'}
                  </p>

                  {/* Rules Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/70 rounded-xl p-3 border border-slate-100 mb-4 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase">Min Order</span>
                      <span className="font-bold text-slate-900">
                        {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'No Min'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase">Max Cap</span>
                      <span className="font-bold text-slate-900">
                        {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'No Limit'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase">Redemptions</span>
                      <span className="font-bold text-slate-900">
                        {coupon.usedCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'used'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase">Valid Till</span>
                      <span className="font-bold text-slate-900">
                        {coupon.expiresAt ? coupon.expiresAt : 'Lifetime'}
                      </span>
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  {usagePercent !== null && (
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Campaign Budget</span>
                        <span>{usagePercent}% utilized</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Applicable categories tag if any */}
                  {Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {coupon.applicableCategories.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(coupon)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      coupon.isActive
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(coupon)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Edit Coupon"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Coupon"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      <CreateCouponModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        coupon={editingCoupon}
        onSave={handleSaveCoupon}
      />
    </div>
  );
}
