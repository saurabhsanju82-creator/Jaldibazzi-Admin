import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setStatusFilter,
  setOrderSearch,
  setSelectedOrder,
  clearSelectedOrder,
  updateOrderStatus
} from '../../store/slices/ordersSlice';
import OrderDetailModal from './OrderDetailModal';
import { FiSearch, FiShoppingBag, FiEye, FiCheckCircle, FiClock, FiTruck, FiXCircle, FiRefreshCw, FiDownload } from 'react-icons/fi';

export default function PlatformOrders() {
  const dispatch = useDispatch();
  const { items: orders, statusFilter, searchQuery, selectedOrder } = useSelector(
    (state) => state.orders
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (id, newStatus) => {
    dispatch(updateOrderStatus({ id, status: newStatus }));
  };

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) return;

    const headers = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Merchant / Vendor',
      'Items Count',
      'Items Details',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Created Date'
    ];

    const escapeCell = (val) => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`;

    const rows = orders.map((o) => {
      const vendorNames = o.vendorName
        ? o.vendorName
        : Array.isArray(o.vendorOrders) && o.vendorOrders.length > 0
        ? o.vendorOrders
            .map((vo) => vo.vendor?.shopName || vo.vendor?.name || vo.vendorName || '')
            .filter(Boolean)
            .join('; ')
        : 'N/A';

      const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
      const itemsDetail = Array.isArray(o.items)
        ? o.items
            .map((it) => `${it.name || 'Item'}${it.size ? ` (Size: ${it.size})` : ''} x${it.quantity || 1}`)
            .join('; ')
        : '';
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';

      return [
        o.id || o._id || '',
        o.orderNumber || o.id || '',
        o.customerName || o.user?.name || 'Customer',
        o.customerEmail || o.user?.email || '',
        vendorNames || 'N/A',
        itemsCount,
        itemsDetail,
        o.totalAmount || o.total || 0,
        o.paymentMethod || 'N/A',
        o.paymentStatus || 'N/A',
        o.status || 'PENDING',
        dateStr
      ];
    });

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `platform_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusBadges = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Orders & Sales</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor real-time fulfillment pipelines, customer orders, and dispatch stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-500">
            Total orders: <strong className="text-slate-900">{orders.length}</strong>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
          >
            <FiDownload className="text-sm" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Orders', icon: FiShoppingBag },
          { id: 'PENDING', label: 'Pending', icon: FiClock },
          { id: 'PROCESSING', label: 'Processing', icon: FiRefreshCw },
          { id: 'SHIPPED', label: 'Shipped', icon: FiTruck },
          { id: 'DELIVERED', label: 'Delivered', icon: FiCheckCircle },
          { id: 'CANCELLED', label: 'Cancelled', icon: FiXCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => dispatch(setStatusFilter(id))}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              statusFilter === id
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="text-sm" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search Order ID, Customer..."
            value={searchQuery}
            onChange={(e) => dispatch(setOrderSearch(e.target.value))}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 pr-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Merchant</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => dispatch(setSelectedOrder(order))}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">{order.id}</td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{order.customerName}</div>
                    <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800">{order.vendorName}</td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{order.totalAmount}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        statusBadges[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="py-3.5 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => dispatch(setSelectedOrder(order))}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded hover:bg-slate-100 transition"
                    >
                      Details &rarr;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => dispatch(clearSelectedOrder())}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
