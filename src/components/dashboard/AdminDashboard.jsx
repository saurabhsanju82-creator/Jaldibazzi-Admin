import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminMetrics } from '../../store/slices/analyticsSlice';
import { formatDate } from '../common/Pagination';
import {
  FiClock,
  FiChevronRight,
  FiBarChart2,
  FiTrendingUp,
  FiCreditCard,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiPackage,
  FiGrid
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

const PAYMENT_BADGES = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  failed: 'bg-rose-50 text-rose-700 border-rose-200/60',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
};

function Skeleton({ className = 'h-8 w-28' }) {
  return <div className={`bg-slate-200 animate-pulse rounded-md ${className}`} />;
}

export default function AdminDashboard({ onNavigateTab }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { summary, loading } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);
  const { dateFormat } = useSelector((state) => state.settings || { dateFormat: 'DD/MM/YYYY' });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine morning, afternoon or evening
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear().toString(), ...Object.keys(summary?.monthlySales || {})]);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [summary]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const currentYearData = useMemo(
    () => summary?.monthlySales?.[selectedYear] || MONTH_NAMES.map((month) => ({ month, sales: 0, orders: 0 })),
    [summary, selectedYear]
  );

  const totalYearSales = useMemo(() => {
    return currentYearData.reduce((sum, m) => sum + m.sales, 0);
  }, [currentYearData]);

  const totalYearOrders = useMemo(() => {
    return currentYearData.reduce((sum, m) => sum + m.orders, 0);
  }, [currentYearData]);

  useEffect(() => {
    dispatch(fetchAdminMetrics());
  }, [dispatch]);

  // Loading flag for skeletons
  const isLoading = loading || !summary;

  const recentPayments = summary?.recentPayments || [];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Greeting Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Dark blur gradient ambient glows */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-16 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {greeting}, {user?.name || 'Administrator'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time aggregate performance across all connected merchant storefronts.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2.5 px-3.5 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-xs font-mono text-slate-200 shrink-0 self-start sm:self-auto shadow-sm">
          <FiClock className="text-indigo-400 text-sm" />
          <span>
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{' '}
            • {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="space-y-6">
        {/* ROW 1: Total Sales | Total Orders | Total Payments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FiDollarSign className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-36" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  ₹{(summary?.totalSales || 0).toLocaleString()}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-400">
                Gross platform merchandising value
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiShoppingBag className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totalOrders || 0}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-400">
                All fulfillment pipelines
              </div>
            </div>
          </div>

          {/* Card 3: Total Payments and Amount */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Payments</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <FiCreditCard className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {summary?.totalPaymentsCount ?? summary?.totalOrders ?? 0} Transactions
                  </div>
                  <div className="mt-1 text-xs font-semibold text-teal-600">
                    ₹{(summary?.totalPaymentsAmount || 0).toLocaleString()} collected
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Total vendor and active vendor | Total customers | Total products | Total categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Vendor and Active Vendor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vendors Overview</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FiUsers className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-4 w-44" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {summary?.totalVendors || 0} Total Vendors
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-600">
                    {summary?.activeVendors || 0} active merchants on platform
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Total Customers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customers</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <FiUsers className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totalCustomers || 0}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-400">
                Active customer accounts
              </div>
            </div>
          </div>

          {/* Card 3: Total Products */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiPackage className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totalProducts || 0}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-400">
                {summary?.activeProducts || 0} active in catalog
              </div>
            </div>
          </div>

          {/* Card 4: Total Categories */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Categories</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <FiGrid className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totalCategories || 0}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-400">
                Catalog category groupings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Total Sales Chart */}
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

      {/* 4. Recent Payments Table (Recent 5 only with Skeletons) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Payments</h3>
            <p className="text-xs text-slate-500">Latest 5 payment transactions across the marketplace.</p>
          </div>
          <button
            onClick={() => navigate('/payments')}
            className="text-xs font-semibold text-slate-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Payments</span>
            <FiChevronRight />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 pr-4">Order ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Payment ID</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36 mt-1" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    </td>
                  </tr>
                ))
              ) : recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No recent payments recorded.
                  </td>
                </tr>
              ) : (
                recentPayments.slice(0, 5).map((p) => (
                  <tr
                    key={p.id || p.orderNumber}
                    onClick={() => navigate('/payments')}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">
                      {p.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.customerName}</div>
                      <div className="text-[11px] text-slate-400">{p.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(p.date, dateFormat)}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.paymentId || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                          PAYMENT_BADGES[p.paymentStatus?.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
