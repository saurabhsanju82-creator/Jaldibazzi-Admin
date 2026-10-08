import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFilter,
  FiSearch,
  FiExternalLink,
  FiPlus,
  FiCheck,
  FiRotateCcw,
  FiCreditCard,
  FiTrendingUp,
  FiCalendar,
  FiDownloadCloud,
  FiInfo,
  FiUser,
  FiX,
  FiShield,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import {
  fetchPayouts,
  updatePayoutStatus,
  createPayout,
  setStatusTab,
  setVendorFilter,
  setSearchQuery,
  setSelectedPayout,
  clearSelectedPayout
} from '../../store/slices/payoutsSlice';

export default function VendorPayouts() {
  const dispatch = useDispatch();
  const { items: payouts = [], loading = false, statusTab = 'ALL', vendorFilter = 'ALL', searchQuery = '', selectedPayout = null } = useSelector(
    (state) => state.payouts || {}
  );
  const { items: vendors } = useSelector((state) => state.vendors || { items: [] });

  useEffect(() => {
    dispatch(fetchPayouts());
  }, [dispatch]);

  // Modal states
  const [settleModalPayout, setSettleModalPayout] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire (ACH)');
  const [settlementNote, setSettlementNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Payout Creation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPayoutForm, setNewPayoutForm] = useState({
    vendorId: vendors[0]?.id || vendors[0]?._id || '',
    period: 'Current Cycle (Sep 2026)',
    grossSales: 5000,
    commissionRate: 0,
    paymentMethod: 'Bank Wire (ACH)',
    notes: 'Manual settlement cycle initiated by Super Admin.'
  });

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Notification Banner
  const [notification, setNotification] = useState(null);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalSettledAmount = payouts
      .filter((p) => p.status === 'SETTLED')
      .reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);

    const pendingPayouts = payouts.filter((p) => p.status === 'PENDING');
    const totalPendingAmount = pendingPayouts.reduce(
      (acc, curr) => acc + (Number(curr.netAmount) || 0),
      0
    );

    const totalCommissionsEarned = payouts
      .filter((p) => p.status === 'SETTLED')
      .reduce((acc, curr) => acc + (Number(curr.commissionAmount) || 0), 0);

    return {
      totalSettledAmount,
      settledCount: payouts.filter((p) => p.status === 'SETTLED').length,
      totalPendingAmount,
      pendingCount: pendingPayouts.length,
      totalCommissionsEarned,
      totalPayoutsCount: payouts.length
    };
  }, [payouts]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: payouts.length,
      PENDING: payouts.filter((p) => p.status === 'PENDING').length,
      SETTLED: payouts.filter((p) => p.status === 'SETTLED').length
    };
  }, [payouts]);

  // Filtered payouts list
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      // Tab filter
      if (statusTab !== 'ALL' && p.status !== statusTab) {
        return false;
      }

      // Vendor filter
      if (vendorFilter !== 'ALL') {
        const matchesVendor =
          String(p.vendorId) === String(vendorFilter) ||
          String(p.vendorName).toLowerCase() === String(vendorFilter).toLowerCase();
        if (!matchesVendor) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const nameMatch = (p.vendorName || '').toLowerCase().includes(q);
        const refMatch = (p.referenceNumber || '').toLowerCase().includes(q);
        const ownerMatch = (p.vendorOwner || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !refMatch && !ownerMatch) return false;
      }

      return true;
    });
  }, [payouts, statusTab, vendorFilter, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, vendorFilter, searchQuery]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const pagedPayouts = filteredPayouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Open Settle Modal
  const handleOpenSettleModal = (payout) => {
    setSettleModalPayout(payout);
    setReferenceNumber(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setPaymentMethod(payout.paymentMethod || 'Bank Wire (ACH)');
    setSettlementNote(payout.notes || 'Disbursed via direct platform settlement.');
  };

  // Submit Manual Settle
  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!settleModalPayout) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        updatePayoutStatus({
          id: settleModalPayout.id,
          status: 'SETTLED',
          referenceNumber: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-8)}`,
          notes: settlementNote,
          settledAt: new Date().toISOString()
        })
      ).unwrap();

      showToast(
        'success',
        `Payout ${settleModalPayout.id} for "${settleModalPayout.vendorName}" has been marked as SETTLED!`
      );
      setSettleModalPayout(null);
    } catch (err) {
      showToast('error', `Failed to settle payout: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revert back to Pending
  const handleRevertToPending = async (payout) => {
    if (
      !window.confirm(
        `Are you sure you want to revert payout "${payout.id}" back to PENDING status?`
      )
    ) {
      return;
    }

    try {
      await dispatch(
        updatePayoutStatus({
          id: payout.id,
          status: 'PENDING',
          referenceNumber: '',
          notes: 'Status reverted to PENDING by administrator.',
          settledAt: null
        })
      ).unwrap();
      showToast('info', `Payout ${payout.id} was reverted back to PENDING.`);
    } catch (err) {
      showToast('error', `Error updating payout: ${err}`);
    }
  };

  // Handle Create Manual Payout
  const handleCreatePayoutSubmit = async (e) => {
    e.preventDefault();
    const vendorObj = vendors.find(
      (v) => String(v.id) === String(newPayoutForm.vendorId) || String(v._id) === String(newPayoutForm.vendorId)
    ) || vendors[0];

    const gross = Number(newPayoutForm.grossSales) || 0;
    const rate = Number(newPayoutForm.commissionRate) || 0;
    const comm = Math.round((gross * rate) / 100);
    const net = gross - comm;

    try {
      await dispatch(
        createPayout({
          vendorId: vendorObj?.id || vendorObj?._id || 'v-gen',
          vendorName: vendorObj?.name || vendorObj?.shopName || 'Custom Merchant',
          vendorOwner: vendorObj?.ownerName || 'Merchant Partner',
          vendorEmail: vendorObj?.email || 'vendor@example.com',
          vendorLogo:
            vendorObj?.logo ||
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80',
          period: newPayoutForm.period,
          grossSales: gross,
          commissionRate: rate,
          commissionAmount: comm,
          netAmount: net,
          ordersCount: Math.max(1, Math.floor(gross / 75)),
          paymentMethod: newPayoutForm.paymentMethod,
          bankDetails: {
            bankName: 'Merchant Registered Bank',
            accountHolder: vendorObj?.name || vendorObj?.shopName || 'Merchant Partner',
            accountNumber: '••••••••' + Math.floor(1000 + Math.random() * 9000),
            routingNumber: '021000021'
          },
          notes: newPayoutForm.notes
        })
      ).unwrap();

      showToast(
        'success',
        `New manual payout generated for "${vendorObj?.name || vendorObj?.shopName}".`
      );
      setIsCreateModalOpen(false);
    } catch (err) {
      showToast('error', `Failed to create payout: ${err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition shadow-md animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <FiCheckCircle className="text-emerald-600 text-base shrink-0" />
            ) : notification.type === 'error' ? (
              <FiAlertCircle className="text-rose-600 text-base shrink-0" />
            ) : (
              <FiInfo className="text-blue-600 text-base shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Payouts</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Manual Controlled Flow
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervise merchant account balances, verify settlement thresholds, and manually authorize or record payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <FiPlus className="text-sm stroke-[3]" /> Generate Manual Payout
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Settled
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{metrics.totalSettledAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <FiCheckCircle className="text-xs" /> {metrics.settledCount} disbursements cleared
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
            <FiCheck />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Authorization
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹{metrics.totalPendingAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <FiClock className="text-xs" /> {metrics.pendingCount} awaiting manual settlement
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl shrink-0">
            <FiClock />
          </div>
        </div>

        {/* Platform Commissions Retained */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Platform Fee Retained
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{metrics.totalCommissionsEarned.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
              <FiTrendingUp className="text-xs text-indigo-500" /> Platform revenue slice
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shrink-0">
            <FiDollarSign />
          </div>
        </div>

        {/* Total Payout Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded Payouts
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.totalPayoutsCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
              Across {vendors.length} registered vendors
            </div>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-xl shrink-0">
            <FiCreditCard />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs: ALL, PENDING, SETTLED */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 self-start">
            <button
              onClick={() => dispatch(setStatusTab('ALL'))}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                statusTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>All Payouts</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusTab === 'ALL' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tabCounts.ALL}
              </span>
            </button>

            <button
              onClick={() => dispatch(setStatusTab('PENDING'))}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                statusTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Pending</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusTab === 'PENDING' ? 'bg-amber-600/30 text-slate-950' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tabCounts.PENDING}
              </span>
            </button>

            <button
              onClick={() => dispatch(setStatusTab('SETTLED'))}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                statusTab === 'SETTLED'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FiCheck className="text-xs stroke-[3]" />
              <span>Settled</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusTab === 'SETTLED' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {tabCounts.SETTLED}
              </span>
            </button>
          </div>

          {/* Top Right Controls: Search + Vendor Filter Dropdown */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search payout ID, ref #..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => dispatch(setSearchQuery(''))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Vendor Filter Dropdown (Required at Top Right) */}
            <div className="relative flex items-center gap-1.5">
              <label htmlFor="vendor-filter" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Vendor:
              </label>
              <div className="relative">
                <select
                  id="vendor-filter"
                  value={vendorFilter}
                  onChange={(e) => dispatch(setVendorFilter(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition cursor-pointer min-w-[160px]"
                >
                  <option value="ALL">All Vendors ({vendors.length})</option>
                  {vendors.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>
                      {v.name || v.shopName}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Payout ID & Date</th>
                <th className="py-3.5 px-4">Vendor Details</th>
                <th className="py-3.5 px-4 text-right">Gross Sales</th>
                <th className="py-3.5 px-4 text-right">Commission</th>
                <th className="py-3.5 px-4 text-right">Net Payable</th>
                <th className="py-3.5 px-4">Payment & Bank</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Manual Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3 text-xl">
                      <FiDollarSign />
                    </div>
                    <div className="text-sm font-semibold text-slate-700">No payout records found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing the filter or adjusting your search query.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedPayouts.map((p) => {
                  const isSettled = p.status === 'SETTLED';
                  const isPending = p.status === 'PENDING';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Payout ID & Period */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{p.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="text-[10px]" />
                          <span>{p.period}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Req: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Vendor Details */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.vendorLogo ||
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={p.vendorName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight hover:text-indigo-600 transition">
                              {p.vendorName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <FiUser className="text-[10px] text-slate-400" />
                              <span>{p.vendorOwner}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{p.vendorEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Gross Sales */}
                      <td className="py-3.5 px-4 align-top text-right font-medium text-slate-700">
                        ₹{(p.grossSales || 0).toLocaleString()}
                        <div className="text-[10px] text-slate-400">
                          {p.ordersCount || 0} orders
                        </div>
                      </td>

                      {/* Platform Commission */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="text-slate-700 font-medium">
                          ₹{(p.commissionAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold bg-slate-100 inline-block px-1.5 py-0.2 rounded-md mt-0.5">
                          {p.commissionRate || 0}% cut
                        </div>
                      </td>

                      {/* Net Amount */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{(p.netAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Direct Net Payout
                        </div>
                      </td>

                      {/* Payment & Bank Details */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <FiCreditCard className="text-slate-400 text-xs" />
                          <span>{p.paymentMethod || 'Bank Wire'}</span>
                        </div>
                        {p.bankDetails ? (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-700">
                              {p.bankDetails.bankName}
                            </span>
                            <div className="font-mono text-[10px] text-slate-400">
                              Acc: {p.bankDetails.accountNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Bank details on file</span>
                        )}
                        {p.referenceNumber && (
                          <div className="mt-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block border border-emerald-200/60">
                            Ref: {p.referenceNumber}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSettled ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          ></span>
                          {p.status}
                        </span>
                        {isSettled && p.settledAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(p.settledAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Manual Action Button */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <button
                              onClick={() => handleOpenSettleModal(p)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                              title="Manually verify and mark this payout as settled"
                            >
                              <FiCheck className="text-xs stroke-[3]" /> Mark as Settled
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                <FiCheckCircle className="text-xs" /> Cleared
                              </span>
                              <button
                                onClick={() => handleRevertToPending(p)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition text-xs cursor-pointer"
                                title="Revert to Pending"
                              >
                                <FiRotateCcw />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => dispatch(setSelectedPayout(p))}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition text-xs cursor-pointer"
                            title="View Full Payout Audit Detail"
                          >
                            <FiInfo />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredPayouts.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayouts.length)} of {filteredPayouts.length} payouts
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <FiChevronLeft className="text-sm" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - currentPage) <= 1)
              .reduce((acc, pg, idx, arr) => {
                if (idx > 0 && pg - arr[idx - 1] > 1) acc.push('...');
                acc.push(pg);
                return acc;
              }, [])
              .map((pg, idx) =>
                pg === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pg}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Mark as Settled Confirmation Modal */}
      {settleModalPayout && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                  <FiCheck />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Authorize Payout Settlement
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Record ID: #{settleModalPayout.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSettleModalPayout(null)}
                className="text-slate-400 hover:text-slate-700 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleConfirmSettle} className="p-5 space-y-4 text-xs">
              {/* Vendor & Net Summary Banner */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {settleModalPayout.vendorName}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Period: {settleModalPayout.period}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {settleModalPayout.bankDetails?.bankName} &bull;{' '}
                    {settleModalPayout.bankDetails?.accountNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Amount Settled
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600">
                    ₹{settleModalPayout.netAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transaction / UTR Reference */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Reference Number / UTR ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR-98421098, ACH-2026-904"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter the transaction ID or bank wire sequence for accounting reconciliation.
                </p>
              </div>

              {/* Payment Channel */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Disbursement Channel / Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900"
                >
                  <option value="Bank Wire (ACH)">Bank Wire (ACH)</option>
                  <option value="Direct Deposit (NEFT/RTGS/IMPS)">Direct Deposit (NEFT/RTGS/IMPS)</option>
                  <option value="PayPal Merchant Transfer">PayPal Merchant Transfer</option>
                  <option value="Stripe Connect Custom">Stripe Connect Custom</option>
                  <option value="Cheque / Manual Voucher">Cheque / Manual Voucher</option>
                </select>
              </div>

              {/* Remarks / Settlement Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Internal Settlement Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  placeholder="Notes on authorization, batch number, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900"
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSettleModalPayout(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <FiCheck className="stroke-[3]" />
                  {isSubmitting ? 'Updating Status...' : 'Confirm & Mark as Settled'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Create Manual Payout Modal */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm">
                  <FiPlus />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Generate Manual Vendor Payout
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Initiate a direct balance disbursement record
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePayoutSubmit} className="p-5 space-y-4 text-xs">
              {/* Select Vendor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newPayoutForm.vendorId}
                  onChange={(e) => {
                    const vid = e.target.value;
                    const foundVendor = vendors.find(
                      (v) => String(v.id) === String(vid) || String(v._id) === String(vid)
                    );
                    setNewPayoutForm((prev) => ({
                      ...prev,
                      vendorId: vid,
                      commissionRate: foundVendor?.commissionRate ?? 0
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-900"
                >
                  {vendors.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>
                      {v.name || v.shopName} ({v.ownerName || 'Merchant'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Settlement Cycle Period */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Settlement Billing Period
                </label>
                <input
                  type="text"
                  required
                  value={newPayoutForm.period}
                  onChange={(e) =>
                    setNewPayoutForm((prev) => ({ ...prev, period: e.target.value }))
                  }
                  placeholder="e.g. Sep 01 - Sep 15, 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-900"
                />
              </div>

              {/* Gross Sales & Commission */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gross Sales (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPayoutForm.grossSales}
                    onChange={(e) =>
                      setNewPayoutForm((prev) => ({ ...prev, grossSales: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newPayoutForm.commissionRate}
                    onChange={(e) =>
                      setNewPayoutForm((prev) => ({ ...prev, commissionRate: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Computed Net Breakdown Preview */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    Net Payout Payable
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Gross (₹{Number(newPayoutForm.grossSales) || 0}) - Platform Fee (₹
                    {Math.round(
                      ((Number(newPayoutForm.grossSales) || 0) *
                        (Number(newPayoutForm.commissionRate) || 0)) /
                        100
                    )}
                    )
                  </div>
                </div>
                <div className="text-base font-extrabold text-emerald-700 font-mono">
                  ₹
                  {(
                    (Number(newPayoutForm.grossSales) || 0) -
                    Math.round(
                      ((Number(newPayoutForm.grossSales) || 0) *
                        (Number(newPayoutForm.commissionRate) || 0)) /
                        100
                    )
                  ).toLocaleString()}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={newPayoutForm.paymentMethod}
                  onChange={(e) =>
                    setNewPayoutForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-900"
                >
                  <option value="Bank Wire (ACH)">Bank Wire (ACH)</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                  <option value="PayPal Merchant">PayPal Merchant</option>
                  <option value="Stripe Transfer">Stripe Transfer</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FiPlus className="stroke-[3]" /> Create Payout Record
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Payout Details & Audit Trail Drawer/Modal */}
      {selectedPayout && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <FiInfo />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payout Audit & Ledger Record
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedPayout.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(clearSelectedPayout())}
                className="text-slate-400 hover:text-slate-700 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={
                    selectedPayout.vendorLogo ||
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={selectedPayout.vendorName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900">{selectedPayout.vendorName}</div>
                  <div className="text-[11px] text-slate-500">{selectedPayout.vendorEmail}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Gross Order Value
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    ₹{(selectedPayout.grossSales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedPayout.ordersCount} total orders</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] uppercase font-semibold text-emerald-600">
                    Net Disbursement
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    ₹{(selectedPayout.netAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Commission: ₹{(selectedPayout.commissionAmount || 0).toLocaleString()} (
                    {selectedPayout.commissionRate || 0}%)
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Cycle:</span>
                  <span className="font-medium text-slate-700">{selectedPayout.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-slate-900">{selectedPayout.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference / UTR ID:</span>
                  <span className="font-mono text-slate-800">
                    {selectedPayout.referenceNumber || 'Awaiting Settlement'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settled Timestamp:</span>
                  <span className="text-slate-800">
                    {selectedPayout.settledAt
                      ? new Date(selectedPayout.settledAt).toLocaleString()
                      : 'Not Settled Yet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="text-slate-800">{selectedPayout.paymentMethod}</span>
                </div>
                {selectedPayout.notes && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-700">Remarks:</span> {selectedPayout.notes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => dispatch(clearSelectedPayout())}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
                {selectedPayout.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedPayout;
                      dispatch(clearSelectedPayout());
                      handleOpenSettleModal(p);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <FiCheck className="stroke-[3]" /> Mark as Settled
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
