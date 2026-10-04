import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiDownload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { reportsApi } from '../../services/api';

const CUSTOMERS_DATA = [
  { name: 'Claire Redfield', email: 'claire.r@example.com', orders: 4, spent: 620 },
  { name: 'Jonathan Hayes', email: 'j.hayes@cloudcorp.com', orders: 7, spent: 1140 },
  { name: 'Miriam Becker', email: 'm.becker@studio.de', orders: 3, spent: 480 },
  { name: 'Alexander Wright', email: 'a.wright@techlab.org', orders: 9, spent: 2890 },
  { name: 'Sophie Moreau', email: 'sophie.m@atelier.fr', orders: 5, spent: 790 },
  { name: 'Lucas Morales', email: 'lucas.m@designhive.io', orders: 2, spent: 245 },
];

export default function PlatformReports() {
  const { items: vendors } = useSelector((state) => state.vendors);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  const [reportType, setReportType] = useState('overall'); // overall, vendor, orders, products, customers
  const [dateFilter, setDateFilter] = useState('30D');
  const [exportingFormat, setExportingFormat] = useState(null); // 'csv' | 'pdf' | null
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', message }

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Client-side fallback CSV generator if server is temporarily unreachable
  const generateClientCsv = () => {
    let headers = [];
    let rows = [];

    if (reportType === 'overall') {
      headers = ['Merchant', 'Category', 'Orders', 'Gross Sales', 'Payout (90%)', 'Platform Fee (10%)'];
      rows = vendors.map((v) => [
        v.name,
        v.category,
        v.totalOrders,
        v.totalSales,
        Math.round(v.totalSales * 0.9),
        Math.round(v.totalSales * 0.1),
      ]);
    } else if (reportType === 'vendor') {
      headers = ['Vendor', 'Contact', 'Orders', 'Gross Sales', 'Vendor Payout', 'Platform Fee'];
      rows = vendors.map((v) => [
        v.name,
        v.email,
        v.totalOrders,
        v.totalSales,
        Math.round(v.totalSales * 0.9),
        Math.round(v.totalSales * 0.1),
      ]);
    } else if (reportType === 'orders') {
      headers = ['Order ID', 'Date', 'Customer', 'Vendor', 'Total', 'Status'];
      rows = orders.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleDateString(),
        o.customerName,
        o.vendorName,
        o.totalAmount,
        o.status,
      ]);
    } else if (reportType === 'products') {
      headers = ['Product', 'Vendor', 'Category', 'Stock', 'Price'];
      rows = products.map((p) => [p.name, p.vendorName, p.category, p.stock, p.price]);
    } else {
      headers = ['Customer', 'Email', 'Orders', 'Total Spend'];
      rows = CUSTOMERS_DATA.map((c) => [c.name, c.email, c.orders, c.spent]);
    }

    const escapeCell = (c) => `"${String(c !== null && c !== undefined ? c : '').replace(/"/g, '""')}"`;
    const lines = [
      `"JaldiBazi Platform Report - ${reportType.toUpperCase()}"`,
      `"Period","${dateFilter}"`,
      '',
      headers.map(escapeCell).join(','),
      ...rows.map((r) => r.map(escapeCell).join(',')),
    ];
    return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  };

  const handleExport = async (format) => {
    setExportingFormat(format);
    const filename = `report_${reportType}_${dateFilter}_${new Date().toISOString().slice(0, 10)}.${format}`;

    try {
      const payloadData = {
        vendors,
        orders,
        products,
        customers: CUSTOMERS_DATA,
      };

      const responseBlob = await reportsApi.exportReport({
        type: reportType,
        format,
        range: dateFilter,
        data: payloadData,
      });

      const blob = new Blob([responseBlob], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setNotice({
        type: 'success',
        message: `Server-generated ${format.toUpperCase()} report downloaded: ${filename}`,
      });
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      console.warn('Server export failed, attempting client fallback for CSV:', err.message);
      if (format === 'csv') {
        const clientBlob = generateClientCsv();
        const url = window.URL.createObjectURL(clientBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setNotice({
          type: 'success',
          message: `CSV report generated and downloaded: ${filename}`,
        });
      } else {
        setNotice({
          type: 'error',
          message: `Could not connect to backend server for PDF generation. Ensure backend is running at ${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}.`,
        });
      }
      setTimeout(() => setNotice(null), 6000);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit consolidated gross sales, merchant breakdowns, and export accounting statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs">
            {['7D', '30D', '90D', 'YTD'].map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  dateFilter === d
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={exportingFormat !== null}
              onClick={() => handleExport('csv')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-2xs hover:border-slate-300 disabled:opacity-50 cursor-pointer"
              title="Export report as CSV file"
            >
              <FiDownload className={exportingFormat === 'csv' ? 'animate-bounce text-slate-900' : ''} />
              <span>{exportingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}</span>
            </button>

            <button
              disabled={exportingFormat !== null}
              onClick={() => handleExport('pdf')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
              title="Export report as styled PDF document"
            >
              <FiFileText className={exportingFormat === 'pdf' ? 'animate-pulse text-sky-400' : ''} />
              <span>{exportingFormat === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 shadow-2xs border transition ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <FiCheckCircle className="text-emerald-600 text-base shrink-0" />
            ) : (
              <FiAlertCircle className="text-rose-600 text-base shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="hover:opacity-75 font-semibold text-sm px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Report Category Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overall', label: 'Overall Sales Report' },
          { id: 'vendor', label: 'Vendor-Wise Sales' },
          { id: 'orders', label: 'Order Fulfillment Matrix' },
          { id: 'products', label: 'Product Velocity' },
          { id: 'customers', label: 'Customer Activity' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              reportType === tab.id
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on Report Type */}
      <div className="space-y-6">
        {reportType === 'overall' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-200/80">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Merchandising Value</div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  ₹{totalRevenue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform Net Commission (10%)</div>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">
                  ₹{Math.round(totalRevenue * 0.1).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Settled Orders</div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  {orders.filter((o) => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Cart Size</div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  ₹{orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0}
                </div>
              </div>
            </div>

            {/* Platform Health Metrics */}
            <div className="text-xs text-slate-600 space-y-2">
              <p>Reporting Period: <strong>{dateFilter}</strong> &bull; Currency: <strong>INR (₹)</strong> &bull; Settlement Frequency: <strong>Weekly</strong></p>
              <p className="text-slate-400">All financial data matches current synchronized ledger state.</p>
            </div>
          </div>
        )}

        {reportType === 'vendor' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 pr-4">Vendor</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Gross Sales (₹)</th>
                  <th className="py-3 px-4 text-right">Vendor Payout (90%) (₹)</th>
                  <th className="py-3 pl-4 text-right">Platform Fee (10%) (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{v.name}</td>
                    <td className="py-3 px-4 text-slate-500">{v.email}</td>
                    <td className="py-3 px-4 text-center font-mono">{v.totalOrders}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{v.totalSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      ₹{Math.round(v.totalSales * 0.9).toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-right font-mono font-semibold text-emerald-700">
                      ₹{Math.round(v.totalSales * 0.1).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 pr-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">{o.id}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{o.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{o.vendorName}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{o.totalAmount}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span className="font-semibold text-[10px] uppercase">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 pr-4">Product Title</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 font-mono text-center">Stock Available</th>
                  <th className="py-3 pl-4 text-right font-mono">Retail Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.vendorName}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 text-center font-mono">{p.stock}</td>
                    <td className="py-3 pl-4 text-right font-mono font-semibold text-slate-900">
                      ₹{p.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 pr-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Orders Placed</th>
                  <th className="py-3 pl-4 text-right">Total Lifetime Spend (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {CUSTOMERS_DATA.map((c, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-500">{c.email}</td>
                    <td className="py-3 px-4 text-center font-mono">{c.orders}</td>
                    <td className="py-3 pl-4 text-right font-mono font-semibold text-slate-900">
                      ₹{c.spent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
