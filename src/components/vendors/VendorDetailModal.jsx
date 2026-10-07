import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateVendorStatus, updateVendor } from '../../store/slices/vendorsSlice';
import { FiX, FiCheck, FiSlash, FiPackage, FiShoppingBag, FiMail, FiPhone, FiMapPin, FiExternalLink } from 'react-icons/fi';

export default function VendorDetailModal({ vendor, onClose }) {
  const dispatch = useDispatch();
  const { items: allProducts } = useSelector((state) => state.products);
  const { items: allOrders } = useSelector((state) => state.orders);

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders

  if (!vendor) return null;

  const vendorId = String(vendor.id || vendor._id || '');
  const vendorProducts = allProducts.filter((p) => {
    const pid = String(p.vendorId || (typeof p.vendor === 'object' ? p.vendor?._id : p.vendor) || '');
    return pid === vendorId;
  });
  const vendorOrders = allOrders.filter((o) => {
    const oid = String(o.vendorId || (typeof o.vendor === 'object' ? o.vendor?._id : o.vendor) || '');
    return oid === vendorId;
  });
  const calculatedRevenue = vendorOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);

  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null

  const handleToggleStatus = () => {
    const nextStatus = vendor.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    dispatch(updateVendorStatus({ id: vendor.id, status: nextStatus }));
  };

  const handleApprove = () => {
    setConfirmAction('approve');
  };

  const handleReject = () => {
    setConfirmAction('reject');
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'approve') {
      dispatch(updateVendorStatus({ id: vendor.id, status: 'ACTIVE' }));
    } else if (confirmAction === 'reject') {
      dispatch(updateVendorStatus({ id: vendor.id, status: 'REJECTED' }));
    }
    setConfirmAction(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img
              src={vendor.logo}
              alt={vendor.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{vendor.name}</h3>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    vendor.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : vendor.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {vendor.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {vendor.category} &bull; Member since {vendor.joinedDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vendor.status === 'PENDING' ? (
              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={handleApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <FiCheck /> Approve Vendor
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <FiSlash /> Reject
                </button>
              </div>
            ) : (
              <button
                onClick={handleToggleStatus}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                  vendor.status === 'ACTIVE'
                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {vendor.status === 'ACTIVE' ? 'Deactivate Vendor' : 'Reactivate Vendor'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 flex gap-6 text-xs font-medium text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Overview & Information
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Products Catalog <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-full font-mono">{vendorProducts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Vendor Orders <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-full font-mono">{vendorOrders.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial & Volume Metrics */}
              <div className="grid grid-cols-3 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Total Sales Generated</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    ₹{(vendor.totalSales || calculatedRevenue).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Total Orders</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {vendor.totalOrders || vendorOrders.length}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Catalog Size</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {vendorProducts.length} items
                  </div>
                </div>
              </div>

              {/* Vendor Bio & Description */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Brand Description</h4>
                <p className="text-slate-600 leading-relaxed">{vendor.description}</p>
              </div>

              {/* Suggested Custom Category */}
              {(vendor.suggestedCategory || vendor.otherCategory) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Suggested Custom Category
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {vendor.suggestedCategory || vendor.otherCategory}
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Vendor suggested this niche during registration. Review and create it under Category Management or assign the vendor to an existing category before approving.
                  </p>
                </div>
              )}

              {/* Contact Information Cards */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Primary Contact</div>
                  <div className="font-semibold text-slate-900">{vendor.ownerName}</div>
                  <div className="text-slate-500">{vendor.email}</div>
                  <div className="text-slate-500 font-mono">{vendor.phone}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Store Location</div>
                  <div className="text-slate-700">{vendor.address}</div>
                  <div className="text-slate-400 font-mono">Tax ID: {vendor.taxId}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              {vendorProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No products registered for this merchant.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 px-4">SKU</th>
                        <th className="py-2 px-4">Price</th>
                        <th className="py-2 px-4">Stock</th>
                        <th className="py-2 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 pr-4 flex items-center gap-2">
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                            <span className="font-medium text-slate-800">{p.name}</span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{p.sku}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">₹{p.price}</td>
                          <td className="py-2.5 px-4 font-mono">
                            <span className={p.stock <= p.lowStockThreshold ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-2.5 pl-4 text-right">
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {vendorOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No orders on record for this vendor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                        <th className="py-2 pr-4">Order ID</th>
                        <th className="py-2 px-4">Customer</th>
                        <th className="py-2 px-4">Date</th>
                        <th className="py-2 px-4">Total</th>
                        <th className="py-2 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="py-2.5 pr-4 font-mono font-semibold text-slate-900">{o.id}</td>
                          <td className="py-2.5 px-4 text-slate-700">{o.customerName}</td>
                          <td className="py-2.5 px-4 text-slate-500">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">₹{o.totalAmount}</td>
                          <td className="py-2.5 pl-4 text-right">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
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
                  <strong className="text-slate-900">{vendor.name || vendor.shopName}</strong>?
                  They will be authorized to access the vendor portal immediately.
                </>
              ) : (
                <>
                  Are you sure you want to reject the application for{' '}
                  <strong className="text-slate-900">{vendor.name || vendor.shopName}</strong>?
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
                onClick={handleConfirmAction}
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
    </div>,
    document.body
  );
}
