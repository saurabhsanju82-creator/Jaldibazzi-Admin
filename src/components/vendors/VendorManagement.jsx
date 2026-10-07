import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchVendors,
  createVendor,
  updateVendorStatus,
  setStatusFilter,
  setSearchQuery,
} from '../../store/slices/vendorsSlice';
import CreateVendorModal from './CreateVendorModal';
import {
  FiSearch,
  FiPlus,
  FiCheck,
  FiSlash,
  FiEye,
  FiPower,
  FiMail,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiBriefcase,
} from 'react-icons/fi';

export default function VendorManagement() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: vendors, statusFilter, searchQuery, loading } = useSelector(
    (state) => state.vendors
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [confirmActivate, setConfirmActivate] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const counts = {
    ALL: vendors.length,
    ACTIVE: vendors.filter((v) => v.status === 'ACTIVE').length,
    PENDING: vendors.filter((v) => v.status === 'PENDING').length,
    DEACTIVATED: vendors.filter((v) => v.status === 'DEACTIVATED' || v.status === 'REJECTED').length,
  };

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = v.status === 'ACTIVE';
    } else if (statusFilter === 'PENDING') {
      matchesStatus = v.status === 'PENDING';
    } else if (statusFilter === 'DEACTIVATED') {
      matchesStatus = v.status === 'DEACTIVATED' || v.status === 'REJECTED';
    }

    const brandName = (v.name || v.shopName || '').toLowerCase();
    const ownerName = (v.ownerName || '').toLowerCase();
    const email = (v.email || '').toLowerCase();
    const catStr = Array.isArray(v.categories)
      ? v.categories.join(' ').toLowerCase()
      : (v.category || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      brandName.includes(q) || ownerName.includes(q) || email.includes(q) || catStr.includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleCreateVendor = (values) => {
    dispatch(createVendor(values));
  };

  const handleQuickApprove = (e, vendor) => {
    e.stopPropagation();
    setConfirmApprove(vendor);
  };

  const handleQuickReject = (e, vendor) => {
    e.stopPropagation();
    setConfirmReject(vendor);
  };

  const handleConfirmApprove = async () => {
    if (!confirmApprove) return;
    const vendor = confirmApprove;
    setConfirmApprove(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'ACTIVE' }));
    dispatch(fetchVendors());
    setActionAlert({
      type: 'success',
      message: `Merchant application for "${vendor.name || vendor.shopName}" has been APPROVED. The vendor can now log in.`,
    });
    setTimeout(() => setActionAlert(null), 5000);
  };

  const handleConfirmReject = async () => {
    if (!confirmReject) return;
    const vendor = confirmReject;
    setConfirmReject(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'REJECTED' }));
    dispatch(fetchVendors());
    setActionAlert({
      type: 'reject',
      message: `Merchant application for "${vendor.name || vendor.shopName}" has been REJECTED.`,
    });
    setTimeout(() => setActionAlert(null), 5000);
  };

  const handleToggleActivate = async (e, vendor) => {
    e.stopPropagation();
    if (vendor.status === 'ACTIVE') {
      setConfirmDeactivate(vendor);
    } else {
      setConfirmActivate(vendor);
    }
  };

  const handleConfirmActivate = async () => {
    if (!confirmActivate) return;
    const vendor = confirmActivate;
    setConfirmActivate(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'ACTIVE' }));
    dispatch(fetchVendors());
    setActionAlert({
      type: 'success',
      message: `"${vendor.name || vendor.shopName}" has been ACTIVATED. The vendor can now log in to the vendor portal.`,
    });
    setTimeout(() => setActionAlert(null), 5000);
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDeactivate) return;
    const vendor = confirmDeactivate;
    setConfirmDeactivate(null);
    const vendorId = vendor.id || vendor._id;
    await dispatch(updateVendorStatus({ id: vendorId, status: 'DEACTIVATED' }));
    dispatch(fetchVendors());
    setActionAlert({
      type: 'reject',
      message: `"${vendor.name || vendor.shopName}" has been DEACTIVATED. The vendor will no longer be able to log in to the vendor portal.`,
    });
    setTimeout(() => setActionAlert(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Review merchant applications, approve sellers, and inspect platform operations.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
        >
          <FiPlus className="text-sm" /> Add Vendor Account
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <FiCheckCircle className="text-emerald-600 text-base shrink-0" />
            ) : (
              <FiAlertTriangle className="text-rose-600 text-base shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Vendors', icon: FiBriefcase, count: counts.ALL },
          { id: 'ACTIVE', label: 'Active Vendors', icon: FiCheckCircle, count: counts.ACTIVE },
          { id: 'PENDING', label: 'Pending Requests', icon: FiClock, count: counts.PENDING, highlight: counts.PENDING > 0 },
          { id: 'DEACTIVATED', label: 'Deactivated', icon: FiSlash, count: counts.DEACTIVATED },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch(setStatusFilter(tab.id))}
              className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="text-sm" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  tab.highlight
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search vendors, categories..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Pending Requests Banner */}
      {statusFilter === 'PENDING' && counts.PENDING > 0 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
          <FiClock className="text-amber-600 shrink-0 text-base" />
          <span>
            <strong>{counts.PENDING} pending request(s)</strong> awaiting review. Review the merchant categories and click <strong>Approve</strong> to authorize them to start selling.
          </span>
        </div>
      )}

      {/* Vendors Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Brand / Store</th>
              <th className="py-3 px-4">Representative / Contact</th>
              <th className="py-3 px-4">Categories</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Date Requested</th>
              <th className="py-3 pl-4 pr-6 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No vendors found in this view.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => {
                const isPending = vendor.status === 'PENDING';
                const categoriesList = Array.isArray(vendor.categories) && vendor.categories.length > 0
                  ? vendor.categories
                  : vendor.category
                  ? [vendor.category]
                  : ['General'];

                return (
                  <tr
                    key={vendor.id || vendor._id}
                    onClick={() => navigate(`/vendors/${vendor.id || vendor._id}`)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition ${
                      isPending ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Brand / Company */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={vendor.logo}
                          alt={vendor.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {vendor.name || vendor.shopName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {String(vendor.id || vendor._id).slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{vendor.ownerName}</div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <FiMail className="text-[10px]" /> {vendor.email || 'No email'}
                      </div>
                    </td>

                    {/* Categories Multi-badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {categoriesList.map((cat, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-700"
                          >
                            {typeof cat === 'object' ? cat.name : cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          vendor.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-300 font-bold'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isPending ? 'Pending Request' : vendor.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                      {vendor.joinedDate || 'Recent'}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={(e) => handleQuickApprove(e, vendor)}
                              title="Approve Merchant Application"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            >
                              <FiCheck className="text-sm stroke-[3]" /> Approve
                            </button>
                            <button
                              onClick={(e) => handleQuickReject(e, vendor)}
                              title="Reject Application"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                            >
                              <FiSlash className="text-xs" /> Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/vendors/${vendor.id || vendor._id}`)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={(e) => handleToggleActivate(e, vendor)}
                              title={vendor.status === 'ACTIVE' ? 'Deactivate Merchant' : 'Activate Merchant'}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                vendor.status === 'ACTIVE'
                                   ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <FiPower className="text-sm" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateVendorModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateVendor}
      />

      {/* Activate Confirmation Modal */}
      {confirmActivate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <FiPower className="text-emerald-600 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Activate Vendor?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will restore vendor portal access</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to activate{' '}
              <strong className="text-slate-900">{confirmActivate.name || confirmActivate.shopName}</strong>?
              They will be able to <strong>log in and operate</strong> on the vendor portal immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmActivate(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmActivate}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FiPower className="text-sm" /> Yes, Activate
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deactivate Confirmation Modal */}
      {confirmDeactivate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <FiPower className="text-rose-600 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deactivate Vendor?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action will block vendor portal access</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-900">{confirmDeactivate.name || confirmDeactivate.shopName}</strong>?
              Their account will be suspended and they will <strong>not be able to log in</strong> to the vendor portal until reactivated.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FiPower className="text-sm" /> Yes, Deactivate
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Approve Confirmation Modal */}
      {confirmApprove && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <FiCheck className="text-emerald-600 text-lg stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Approve Merchant?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Authorize vendor to start selling</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to approve the application for{' '}
              <strong className="text-slate-900">{confirmApprove.name || confirmApprove.shopName}</strong>?
              They will be able to log in to the vendor portal and start listing products immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmApprove(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FiCheck className="text-sm stroke-[3]" /> Yes, Approve
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reject Confirmation Modal */}
      {confirmReject && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <FiSlash className="text-rose-600 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reject Application?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Decline merchant registration</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to reject the application for{' '}
              <strong className="text-slate-900">{confirmReject.name || confirmReject.shopName}</strong>?
              Their status will be marked as rejected.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmReject(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FiSlash className="text-sm" /> Yes, Reject
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
