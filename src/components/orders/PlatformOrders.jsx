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
import { FiSearch, FiShoppingBag, FiEye, FiCheckCircle, FiClock, FiTruck, FiXCircle } from 'react-icons/fi';

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

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          Total orders logged: <strong className="text-slate-900">{orders.length}</strong>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => dispatch(setStatusFilter(st))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        {/* Search */}
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
