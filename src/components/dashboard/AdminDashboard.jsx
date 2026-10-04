import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminMetrics } from '../../store/slices/analyticsSlice';
import { fetchVendors } from '../../store/slices/vendorsSlice';
import { fetchAllOrders } from '../../store/slices/ordersSlice';
import { fetchAllProducts } from '../../store/slices/productsSlice';
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiBriefcase,
  FiBox,
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle,
  FiChevronRight
} from 'react-icons/fi';

export default function AdminDashboard({ onNavigateTab }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { summary, loading } = useSelector((state) => state.analytics);
  const { items: vendors } = useSelector((state) => state.vendors);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchAdminMetrics());
    dispatch(fetchVendors());
    dispatch(fetchAllOrders());
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const pendingVendors = vendors.filter((v) => v.status === 'PENDING');
  const lowStockItems = products.filter((p) => p.stock <= p.lowStockThreshold);

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading && !summary) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading platform telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Date Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time aggregate performance across all connected merchant storefronts.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Last updated: Just now
        </div>
      </div>

      {/* 3.1 KPI Metrics - Minimalist flat layout, no heavy cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 py-2 border-b border-slate-200/80">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-emerald-600 font-medium">
            <FiArrowUpRight className="mr-0.5" /> +14.2% vs last mo
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{orders.length}</div>
          <div className="mt-1 text-xs text-slate-400">All channels</div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Vendors</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {vendors.filter((v) => v.status === 'ACTIVE').length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {vendors.length}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {pendingVendors.length} pending review
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Products</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {products.filter((p) => p.status === 'ACTIVE').length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {lowStockItems.length} low stock alerts
          </div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customers</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {summary?.totalCustomers || 6}
          </div>
          <div className="mt-1 text-xs text-slate-400">Active accounts</div>
        </div>
      </div>

      {/* 3.1 Pending or Important Activities Banner */}
      {(pendingVendors.length > 0 || lowStockItems.length > 0) && (
        <div className="p-4 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
            <FiAlertCircle className="text-amber-600 text-sm" /> Action Required on Platform
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            {pendingVendors.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-1">
                <span>
                  <strong>{v.name}</strong> ({v.ownerName}) submitted a merchant registration request.
                </span>
                <button
                  onClick={() => onNavigateTab('vendors')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-xs transition"
                >
                  Review Application
                </button>
              </div>
            ))}

            {lowStockItems.length > 0 && (
              <div className="flex items-center justify-between py-1 text-slate-600">
                <span>
                  <strong>{lowStockItems.length} products</strong> are currently at or below minimum inventory threshold.
                </span>
                <button
                  onClick={() => onNavigateTab('products')}
                  className="text-amber-800 font-medium hover:underline"
                >
                  Inspect Inventory &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3.1 Sales Trends & Business Performance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Monthly Sales Volume Trend</h3>
          <span className="text-xs text-slate-500 font-mono">Platform Gross Volume (INR ₹)</span>
        </div>

        {/* Minimalist Bar Visualization */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-6 gap-4 items-end h-44 border-b border-slate-200">
            {(summary?.monthlySales || []).map((m) => {
              const max = 150000;
              const heightPercent = Math.round((m.sales / max) * 100);
              return (
                <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[11px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition mb-1.5">
                    ₹{(m.sales / 1000).toFixed(1)}k
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] bg-slate-900 rounded-t group-hover:bg-emerald-600 transition-all duration-200"
                  ></div>
                  <div className="text-xs font-medium text-slate-600 mt-2">{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3.1 Vendor Performance Summaries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Vendor Performance Snapshot</h3>
            <p className="text-xs text-slate-500">Overview of top contributing merchants on the platform.</p>
          </div>
          <button
            onClick={() => onNavigateTab('performance')}
            className="text-xs font-medium text-slate-900 hover:text-emerald-700 flex items-center gap-1"
          >
            Full Analytics <FiChevronRight />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 pr-4">Vendor & Brand</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Orders</th>
                <th className="py-2.5 px-4 text-right">Total Revenue</th>
                <th className="py-2.5 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vendors.slice(0, 4).map((v) => (
                <tr
                  key={v.id || v._id}
                  onClick={() => navigate(`/vendors/${v.id || v._id}`)}
                  className="hover:bg-slate-100/60 transition cursor-pointer"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.logo}
                        alt={v.name}
                        className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{v.name}</div>
                        <div className="text-[11px] text-slate-400">{v.ownerName} &bull; {v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{v.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : v.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{v.totalOrders}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    ₹{v.totalSales.toLocaleString()}
                  </td>
                  <td className="py-3 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/vendors/${v.id || v._id}`)}
                      className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                    >
                      View &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
