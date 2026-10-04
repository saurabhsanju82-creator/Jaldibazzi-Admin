import React, { useState, useEffect, useMemo } from 'react';
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
  FiChevronRight,
  FiBarChart2,
  FiTrendingUp
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function AdminDashboard({ onNavigateTab }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { summary, loading } = useSelector((state) => state.analytics);
  const { items: vendors } = useSelector((state) => state.vendors);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

  // Extract available years dynamically from real orders (fallback to current year)
  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear().toString()]);
    orders.forEach((o) => {
      if (o.createdAt) {
        const y = new Date(o.createdAt).getFullYear();
        if (!isNaN(y)) years.add(y.toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  const [selectedYear, setSelectedYear] = useState(
    availableYears[0] || new Date().getFullYear().toString()
  );

  // Compute real dynamic monthly sales and order count from loaded orders
  const currentYearData = useMemo(() => {
    // 12 months bucket: Jan to Dec
    const monthlyBuckets = MONTH_NAMES.map((name) => ({
      month: name,
      sales: 0,
      orders: 0,
    }));

    orders.forEach((o) => {
      if (o.status === 'CANCELLED') return;
      if (!o.createdAt) return;

      const date = new Date(o.createdAt);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear().toString();
      if (year === selectedYear) {
        const monthIndex = date.getMonth(); // 0 to 11
        const amount = Number(o.totalAmount || o.total || 0);
        if (monthlyBuckets[monthIndex]) {
          monthlyBuckets[monthIndex].sales += amount;
          monthlyBuckets[monthIndex].orders += 1;
        }
      }
    });

    return monthlyBuckets;
  }, [orders, selectedYear]);

  const totalYearSales = useMemo(() => {
    return currentYearData.reduce((sum, m) => sum + m.sales, 0);
  }, [currentYearData]);

  const totalYearOrders = useMemo(() => {
    return currentYearData.reduce((sum, m) => sum + m.orders, 0);
  }, [currentYearData]);

  const maxSales = useMemo(() => {
    const highest = Math.max(...currentYearData.map((d) => d.sales), 0);
    return highest > 0 ? highest : 10000;
  }, [currentYearData]);

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/system-status')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Services Monitor</span>
          </button>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Last updated: Just now
          </div>
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Monthly Sales Volume Trend</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Platform Gross Volume: {selectedYear} &bull; Jan to Dec ({chartType.toUpperCase()} Graph) &bull; Total: ₹{totalYearSales.toLocaleString()} ({totalYearOrders} orders)
            </p>
          </div>

          {/* Controls: Chart Type Toggle & Year Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Year Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Bar / Line Graph Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FiBarChart2 className="w-3.5 h-3.5" />
                <span>Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FiTrendingUp className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport powered by Recharts */}
        <div className="pt-4 pb-1 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <AreaChart
                data={currentYearData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ stroke: '#059669', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-800 text-xs space-y-0.5">
                          <p className="font-semibold text-slate-300">{label} {selectedYear}</p>
                          <p className="font-bold text-emerald-400 text-sm">
                            ₹{data.sales.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {data.orders} order{data.orders === 1 ? '' : 's'} recorded
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesAreaGradient)"
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={currentYearData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-800 text-xs space-y-0.5">
                          <p className="font-semibold text-slate-300">{label} {selectedYear}</p>
                          <p className="font-bold text-emerald-400 text-sm">
                            ₹{data.sales.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {data.orders} order{data.orders === 1 ? '' : 's'} recorded
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  className="hover:fill-emerald-600 transition-colors"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
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
