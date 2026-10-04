import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiTrendingUp, FiAward, FiDollarSign, FiShoppingBag, FiCalendar } from 'react-icons/fi';

export default function VendorPerformance() {
  const navigate = useNavigate();
  const { items: vendors } = useSelector((state) => state.vendors);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  const [timeRange, setTimeRange] = useState('30D');

  // Sorted by revenue
  const rankedVendors = [...vendors]
    .filter((v) => v.status === 'ACTIVE')
    .sort((a, b) => b.totalSales - a.totalSales);

  const totalPlatformSales = rankedVendors.reduce((acc, v) => acc + v.totalSales, 0);

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Performance Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Compare merchant revenue, order throughput, and catalog health.
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs">
          {['7D', '30D', '90D', 'YTD'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                timeRange === range
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '7D' ? 'Last 7 Days' : range === '30D' ? 'Last 30 Days' : range === '90D' ? 'Quarter' : 'Year-to-Date'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Performing Vendors Leaderboard Cards (only where essential) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rankedVendors.slice(0, 3).map((vendor, idx) => {
          const share = totalPlatformSales > 0 ? Math.round((vendor.totalSales / totalPlatformSales) * 100) : 0;
          return (
            <div
              key={vendor.id || vendor._id}
              onClick={() => navigate(`/vendors/${vendor.id || vendor._id}`)}
              className="p-5 bg-white border border-slate-200/90 rounded-xl relative overflow-hidden hover:shadow-md hover:border-slate-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Merchant</span>
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-600">{share}% Platform Share</div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={vendor.logo}
                  alt={vendor.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                  <div className="text-xs text-slate-400">{vendor.category}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Total Sales</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    ₹{vendor.totalSales.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Total Orders</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {vendor.totalOrders}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Vendor Sales & Orders Breakdown Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Merchant Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 pr-4">Rank</th>
                <th className="py-2.5 px-4">Vendor</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">Orders Fulfilled</th>
                <th className="py-2.5 px-4 text-center">Avg Order Value</th>
                <th className="py-2.5 px-4 text-right">Revenue Generated</th>
                <th className="py-2.5 pl-4 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankedVendors.map((vendor, index) => {
                const aov = vendor.totalOrders > 0 ? Math.round(vendor.totalSales / vendor.totalOrders) : 0;
                const share = totalPlatformSales > 0 ? ((vendor.totalSales / totalPlatformSales) * 100).toFixed(1) : '0';
                return (
                  <tr
                    key={vendor.id || vendor._id}
                    onClick={() => navigate(`/vendors/${vendor.id || vendor._id}`)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 pr-4 font-mono font-semibold text-slate-500">#{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{vendor.name}</div>
                      <div className="text-[11px] text-slate-400">{vendor.ownerName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{vendor.category}</td>
                    <td className="py-3 px-4 text-center font-mono">{vendor.totalOrders}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-800">₹{aov}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{vendor.totalSales.toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${share}%` }}
                            className="bg-slate-900 h-full rounded-full"
                          ></div>
                        </div>
                        <span className="font-mono text-slate-500 w-10 text-right">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
