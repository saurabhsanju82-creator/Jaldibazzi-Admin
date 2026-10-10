import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheckCircle, FiClock, FiTruck, FiAlertCircle, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';

export default function OrderDetailModal({ order, onClose, onUpdateStatus }) {
  if (!order) return null;

  const statusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold font-mono text-slate-900">{order.id}</h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  statusColors[order.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()} &bull; Vendor: {order.vendorName}
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Status Override */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-slate-700">Override Platform Status:</span>
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Customer Information
              </div>
              <div className="font-semibold text-slate-900">{order.customerName}</div>
              <div className="flex items-center gap-2 text-slate-600">
                <FiMail className="text-slate-400" /> {order.customerEmail}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FiPhone className="text-slate-400" /> {order.customerPhone}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Delivery Address & Payment
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <FiMapPin className="text-slate-400 mt-0.5 shrink-0" />
                <span>{order.shippingAddress}</span>
              </div>
              <div className="text-slate-500 pt-1">
                Payment: <span className="font-medium text-slate-800">{order.paymentMethod}</span> (
                <span className="text-emerald-600 font-semibold">{order.paymentStatus}</span>)
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Purchased Items
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.size && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          Size: {item.size}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Qty: {item.quantity} &times; ₹{item.price}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-900">
                    ₹{item.quantity * item.price}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-900">Total Order Amount</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>
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
    </div>,
    document.body
  );
}
