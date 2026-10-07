import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchVendors,
  fetchVendorById,
  updateVendorStatus,
  updateVendor,
} from '../../store/slices/vendorsSlice';
import { fetchAllProducts } from '../../store/slices/productsSlice';
import { fetchAllOrders } from '../../store/slices/ordersSlice';
import {
  FiArrowLeft,
  FiCheck,
  FiSlash,
  FiPower,
  FiMail,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiPercent,
  FiCalendar,
  FiExternalLink,
  FiEdit3,
  FiSave,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiTag,
  FiUser,
  FiShield,
  FiTrendingUp,
  FiStar,
} from 'react-icons/fi';

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: vendors, loading: vendorsLoading, selectedVendor } = useSelector((state) => state.vendors);
  const { items: allProducts } = useSelector((state) => state.products || { items: [] });
  const { items: allOrders } = useSelector((state) => state.orders || { items: [] });

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, financials
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null

  // Commission editing state
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [adminNote, setAdminNote] = useState('');

  // Find vendor: prefer selectedVendor (freshly fetched by ID), fallback to list
  const vendor = (selectedVendor && (String(selectedVendor.id) === String(id) || String(selectedVendor._id) === String(id)))
    ? selectedVendor
    : vendors.find(
        (v) => String(v.id) === String(id) || String(v._id) === String(id) || v.slug === id
      );

  // Always fetch vendor by ID and fresh products on mount
  useEffect(() => {
    dispatch(fetchVendorById(id));
    dispatch(fetchAllProducts());
    dispatch(fetchAllOrders());
  }, [dispatch, id]);

  useEffect(() => {
    if (vendors.length === 0) {
      dispatch(fetchVendors());
    }
  }, [dispatch, vendors.length]);

  useEffect(() => {
    if (vendor) {
      setCommissionRate(vendor.commissionRate ?? 10);
      setAdminNote(vendor.reviewNote || '');
    }
  }, [vendor]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleApprove = () => {
    setConfirmAction('approve');
  };

  const handleReject = () => {
    setConfirmAction('reject');
  };

  const handleConfirmApprove = async () => {
    setConfirmAction(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'ACTIVE' }));
    dispatch(fetchVendorById(vendorId));
    showNotification('success', `Merchant "${vendor.name || vendor.shopName}" has been successfully approved!`);
  };

  const handleConfirmReject = async () => {
    setConfirmAction(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'REJECTED' }));
    dispatch(fetchVendorById(vendorId));
    showNotification('error', `Merchant "${vendor.name || vendor.shopName}" application was marked as rejected.`);
  };

  const handleToggleStatus = async () => {
    const vendorId = vendor.id || vendor._id;
    const nextStatus = vendor.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    await dispatch(updateVendorStatus({ id: vendorId, status: nextStatus }));
    dispatch(fetchVendorById(vendorId));
    showNotification(
      nextStatus === 'ACTIVE' ? 'success' : 'info',
      `Merchant status changed to ${nextStatus}.`
    );
  };

  const handleSaveCommissionAndNote = async () => {
    const vendorId = vendor.id || vendor._id;
    await dispatch(
      updateVendor({
        id: vendorId,
        data: {
          commissionRate: Number(commissionRate),
          reviewNote: adminNote,
        },
      })
    );
    dispatch(fetchVendorById(vendorId));
    setIsEditingCommission(false);
    showNotification('success', 'Commission settings and remarks updated successfully.');
  };

  if (vendorsLoading && !vendor) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 text-2xl">
          <FiAlertCircle />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Vendor Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">
          The requested vendor account could not be found or may have been removed.
        </p>
        <button
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
        >
          <FiArrowLeft className="text-sm" /> Return to Vendor Management
        </button>
      </div>
    );
  }

  const vendorId = vendor.id || vendor._id;
  const isPending = vendor.status === 'PENDING';
  const isActive = vendor.status === 'ACTIVE';

  // Products associated with this vendor — matches both mock (vendorId string) and backend (vendor._id object) structures
  const vendorProducts = allProducts.filter((p) => {
    const pid = p.vendorId || (typeof p.vendor === 'object' ? p.vendor?._id : p.vendor);
    return String(pid) === String(vendorId);
  });

  // Orders associated with this vendor — matches both mock (vendorId) and backend (vendorOrders[].vendor) structures
  const vendorOrders = allOrders.filter((o) => {
    // Backend structure: vendorOrders array with vendor references
    if (Array.isArray(o.vendorOrders) && o.vendorOrders.length > 0) {
      return o.vendorOrders.some(
        (vo) => String(vo.vendor?._id || vo.vendor) === String(vendorId)
      );
    }
    // Mock / legacy structure: flat vendorId field or items[].vendorId
    return (
      String(o.vendorId) === String(vendorId) ||
      (Array.isArray(o.items) && o.items.some((item) => String(item.vendorId || item.vendor) === String(vendorId)))
    );
  });

  const completedOrders = vendorOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
  const pendingOrders = vendorOrders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING');

  const calculatedRevenue = vendorOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const totalSales = vendor.totalSales || calculatedRevenue;
  const currentCommission = vendor.commissionRate ?? 10;
  const platformEarnings = (totalSales * currentCommission) / 100;
  const merchantPayout = totalSales - platformEarnings;

  const categoriesList =
    Array.isArray(vendor.categories) && vendor.categories.length > 0
      ? vendor.categories
      : vendor.category
      ? [vendor.category]
      : ['General Store'];

  // Filtered products
  const filteredProducts = vendorProducts.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  // Filtered orders
  const filteredOrders = vendorOrders.filter((o) => {
    const q = orderSearch.toLowerCase();
    return (
      String(o.id || o._id || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/vendors"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs transition hover:border-slate-300"
          >
            <FiArrowLeft className="text-sm" /> Back to Vendors
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {vendor.name || vendor.shopName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Merchant Profile & Operations Audit</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Vendor Record: <span className="text-slate-700 font-medium">#{String(vendorId).slice(-8)}</span>
        </div>
      </div>

      {/* Action Notification Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <FiCheckCircle className="text-emerald-600 text-base shrink-0" />
            ) : (
              <FiAlertCircle className="text-rose-600 text-base shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Vendor Header Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Banner strip */}
        <div
          className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 relative px-6 lg:px-8 flex items-end bg-cover bg-center"
          style={vendor.banner ? { backgroundImage: `url(${vendor.banner})` } : {}}
        >
          {vendor.banner && <div className="absolute inset-0 bg-slate-950/40" />}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border flex items-center gap-1.5 backdrop-blur-md shadow-xs ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : isPending
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 animate-pulse'
                  : 'bg-rose-500/20 text-rose-200 border-rose-400/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-400' : isPending ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              ></span>
              {isPending ? 'Pending Approval' : vendor.status}
            </span>
          </div>
        </div>

        {/* Header Content Details */}
        <div className="relative z-10 px-6 lg:px-8 pb-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
            {/* Logo & Main Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="relative z-20 shrink-0">
                <img
                  src={
                    vendor.logo ||
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={vendor.name || vendor.shopName}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0 ring-1 ring-slate-900/5"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {vendor.name || vendor.shopName}
                  </h1>
                  {vendor.slug && (
                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      /{vendor.slug}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiUser className="text-slate-400" /> {vendor.ownerName || 'Merchant Partner'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-slate-400" /> Joined {vendor.joinedDate || 'Recently'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiTag className="text-slate-400" /> {categoriesList[0] || 'Merchant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {isPending ? (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <FiCheck className="text-sm stroke-[3]" /> Approve Merchant
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <FiSlash className="text-sm" /> Reject Application
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleToggleStatus}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition cursor-pointer shadow-xs ${
                      isActive
                        ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <FiPower className="text-sm" />
                    {isActive ? 'Deactivate Merchant' : 'Reactivate Merchant'}
                  </button>
                </>
              )}

              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-200"
              >
                <span>Vendor Portal</span>
                <FiExternalLink className="text-xs text-slate-500" />
              </a>
            </div>
          </div>
        </div>

        {/* Metric Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/70">
          <div className="p-4 lg:px-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiDollarSign className="text-slate-500" /> Total Revenue
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ₹{totalSales.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Merchant Payout: ₹{merchantPayout.toLocaleString()}
            </div>
          </div>

          <div className="p-4 lg:px-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPercent className="text-slate-500" /> Commission Rate
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {currentCommission}%
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
              Platform Est: ₹{platformEarnings.toLocaleString()}
            </div>
          </div>

          <div className="p-4 lg:px-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiShoppingBag className="text-slate-500" /> Total Orders
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {vendor.totalOrders || vendorOrders.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {completedOrders.length} fulfilled &bull; {pendingOrders.length} pending
            </div>
          </div>

          <div className="p-4 lg:px-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPackage className="text-slate-500" /> Product Catalog
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {vendorProducts.length} items
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Live in store catalog
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        {[
          { id: 'overview', label: 'Overview & Profile', icon: FiUser },
          { id: 'products', label: 'Products Catalog', icon: FiPackage, badge: vendorProducts.length },
          { id: 'orders', label: 'Orders & Sales', icon: FiShoppingBag, badge: vendorOrders.length },
          { id: 'financials', label: 'Financials & Commission', icon: FiDollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                isActiveTab
                  ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Icon className="text-sm" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActiveTab ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {/* 1. OVERVIEW & PROFILE TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Brand Info & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* About the Store */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Brand Story & Store Description
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {vendor.description ||
                  'No description provided by the merchant yet. Merchants can update their brand profile and store story directly through the vendor workspace.'}
              </p>

              {/* Categories */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Merchant Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                    >
                      <FiTag className="text-[11px] text-slate-400" />
                      {typeof cat === 'object' ? cat.name : cat}
                    </span>
                  ))}
                </div>

                {(vendor.suggestedCategory || vendor.otherCategory) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Custom Category Suggestion
                    </span>
                    <span className="font-semibold text-slate-900 text-sm block">
                      {vendor.suggestedCategory || vendor.otherCategory}
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Vendor submitted this custom niche during onboarding. You can create it in Category Management or map to an existing category.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Merchant Representative Contact */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Primary Merchant Representative
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Contact Person</div>
                  <div className="font-semibold text-slate-900">{vendor.ownerName || 'Merchant Administrator'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Email</div>
                  <a
                    href={`mailto:${vendor.email}`}
                    className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 truncate"
                  >
                    <FiMail className="shrink-0" /> {vendor.email || 'No email provided'}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Phone Contact</div>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="font-medium text-slate-800 hover:text-slate-900 flex items-center gap-1"
                  >
                    <FiPhone className="shrink-0 text-slate-400" /> {vendor.phone || 'N/A'}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Security</div>
                  <div className="font-medium text-slate-700 flex items-center gap-1">
                    <FiShield className="text-emerald-500" /> Super Admin Verified
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Business details & Compliance */}
          <div className="space-y-6">
            {/* Business Address & Legal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Business Details & Address
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Registered Address</div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <FiMapPin className="text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {typeof vendor.address === 'object' && vendor.address
                        ? `${vendor.address.street || ''}, ${vendor.address.city || ''} ${
                            vendor.address.state || ''
                          } - ${vendor.address.pincode || ''}, ${vendor.address.country || 'India'}`
                        : vendor.address || 'Registered warehouse address not specified'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tax / GSTIN Number</div>
                  <div className="font-mono font-medium text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 inline-block">
                    {vendor.taxId || 'GSTIN-PENDING-VERIFY'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Commission Agreement</div>
                  <div className="text-slate-800 font-semibold text-sm">
                    {currentCommission}% Platform Fee
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Platform automatically deduces {currentCommission}% commission from all orders fulfilled.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Trail / Review Note */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Admin Review Notes
              </h3>
              {vendor.reviewNote ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                  "{vendor.reviewNote}"
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  No internal admin remarks recorded for this merchant. You can add notes under the Financials & Commission tab.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS CATALOG TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vendor Product Catalog</h3>
              <p className="text-xs text-slate-500">
                Products created and managed by {vendor.name || vendor.shopName}.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search products by SKU, name..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {productSearch ? 'No products match your search.' : 'No products listed by this vendor yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);
                    const isOutOfStock = p.stock === 0;

                    return (
                      <tr key={p.id || p._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{p.name}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.sku || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {typeof p.category === 'object' ? p.category?.name : p.category || 'General'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          ₹{Number(p.price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock} units {isLowStock && '(Low)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              p.status === 'ACTIVE' || p.status === 'active' || p.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {p.status || (p.isActive ? 'ACTIVE' : 'DRAFT')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS & SALES TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vendor Orders & Sales History</h3>
              <p className="text-xs text-slate-500">
                Customer purchases fulfilled by this merchant.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search orders by ID, customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 font-mono">Gross Total</th>
                  <th className="py-3 px-4 font-mono">Platform Fee</th>
                  <th className="py-3 px-4 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {orderSearch ? 'No orders match your search criteria.' : 'No customer orders recorded for this merchant.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const fee = ((Number(o.totalAmount) || 0) * currentCommission) / 100;
                    return (
                      <tr key={o.id || o._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{String(o.id || o._id).slice(-8)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{o.customerName || 'Customer'}</div>
                          <div className="text-[11px] text-slate-400">{o.customerEmail || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {Array.isArray(o.items) ? `${o.items.length} items` : '1 package'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ₹{Number(o.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 font-medium">
                          ₹{fee.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              o.status === 'DELIVERED' || o.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : o.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {o.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FINANCIALS & COMMISSION TAB */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Commission Config & Financial breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform Commission & Terms</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the platform commission percentage charged on sales from this merchant.
                  </p>
                </div>

                {!isEditingCommission ? (
                  <button
                    onClick={() => setIsEditingCommission(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FiEdit3 /> Edit Settings
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCommissionAndNote}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <FiSave /> Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingCommission(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Commission input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Commission Rate (%)
                  </label>
                  {isEditingCommission ? (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">%</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold font-mono text-slate-900 flex items-center gap-1">
                      {currentCommission}%
                      <span className="text-xs font-normal text-slate-400 ml-2">Standard Platform Cut</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Applicable to all future orders placed under this store.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Payout Frequency
                  </label>
                  <div className="text-sm font-medium text-slate-900 py-2">
                    Bi-weekly Automated Settlement (1st & 15th)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Net payouts transfer directly to the merchant bank account.
                  </p>
                </div>
              </div>

              {/* Internal Admin Note */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Super Admin Notes / Agreement Details
                </label>
                {isEditingCommission ? (
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter compliance remarks, customized commission agreement details, or review notes..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                ) : (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {adminNote || 'No special administrative notes added for this merchant.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Revenue & Financial Statement Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Financial Settlement Summary
                </div>
                <FiTrendingUp className="text-emerald-400 text-lg" />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gross Sales Volume:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{totalSales.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Platform Commission ({currentCommission}%):</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +₹{platformEarnings.toLocaleString()}
                  </span>
                </div>

                <div className="h-px bg-slate-800 my-2"></div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Net Merchant Payout:</span>
                  <span className="font-mono font-bold text-white text-base">
                    ₹{merchantPayout.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300">
                <strong className="text-white">Next Settlement:</strong> Scheduled automatically via Platform Treasury.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction === 'approve'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {confirmAction === 'approve' ? (
                  <FiCheck className="text-lg stroke-[3]" />
                ) : (
                  <FiSlash className="text-lg" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {confirmAction === 'approve' ? 'Approve Merchant?' : 'Reject Application?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {confirmAction === 'approve'
                    ? 'Authorize vendor to start selling'
                    : 'Decline merchant registration'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {confirmAction === 'approve' ? (
                <>
                  Are you sure you want to approve{' '}
                  <strong className="text-slate-900">{vendor?.name || vendor?.shopName}</strong>?
                  The vendor will be authorized to access the vendor portal and list products immediately.
                </>
              ) : (
                <>
                  Are you sure you want to reject the application for{' '}
                  <strong className="text-slate-900">{vendor?.name || vendor?.shopName}</strong>?
                </>
              )}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction === 'approve' ? handleConfirmApprove : handleConfirmReject}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                  confirmAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {confirmAction === 'approve' ? (
                  <>
                    <FiCheck className="stroke-[3]" /> Yes, Approve
                  </>
                ) : (
                  <>
                    <FiSlash /> Yes, Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
