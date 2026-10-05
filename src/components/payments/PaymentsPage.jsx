import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../services/axiosClient';
import Pagination, { usePagination, formatDate } from '../common/Pagination';

const STATUSES = ['ALL', 'pending', 'paid', 'failed', 'refunded'];
const METHODS = ['ALL', 'cod', 'online'];
const BADGE = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-slate-100 text-slate-600',
};

export default function PaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosClient
      .get('/orders')
      .then((res) => setOrders(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(
      (o) =>
        (status === 'ALL' || o.paymentStatus === status) &&
        (method === 'ALL' || o.paymentMethod === method) &&
        (!q ||
          o.orderNumber?.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.razorpayPaymentId?.toLowerCase().includes(q))
    );
  }, [orders, status, method, search]);

  const totals = useMemo(() => {
    const sum = (s) => orders.filter((o) => o.paymentStatus === s).reduce((a, o) => a + (o.total || 0), 0);
    return { paid: sum('paid'), pending: sum('pending'), failed: sum('failed'), refunded: sum('refunded') };
  }, [orders]);

  const { pageItems, dateFormat, ...pager } = usePagination(filtered, status + method + search);

  const changeStatus = async (o, paymentStatus) => {
    try {
      const res = await axiosClient.patch(`/orders/${o._id}/payment`, { paymentStatus });
      setOrders((prev) =>
        prev.map((x) => (x._id === o._id ? { ...x, paymentStatus: res.data.data.paymentStatus } : x))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const pill = (list, value, set) =>
    list.map((s) => (
      <button
        key={s}
        onClick={() => set(s)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
          value === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {s === 'ALL' ? 'All' : s}
      </button>
    ));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h2>
        <p className="text-sm text-slate-500 mt-0.5">Payment status of every order on the platform.</p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-200/80 pb-5">
        {Object.entries(totals).map(([k, v]) => (
          <div key={k}>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{k}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">₹{v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-1">{pill(STATUSES, status, setStatus)}</div>
          <div className="flex gap-1">{pill(METHODS, method, setMethod)}</div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order no, customer, payment id..."
          className="w-full lg:w-64 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 pr-4">Order</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">Payment ID</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 pl-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading payments...</td></tr>
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">No payments found.</td></tr>
            ) : (
              pageItems.map((o) => (
                <tr key={o._id}>
                  <td className="py-3 pr-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{o.user?.name || 'Customer'}</div>
                    <div className="text-[11px] text-slate-400">{o.user?.email}</div>
                  </td>
                  <td className="py-3 px-4">{formatDate(o.createdAt, dateFormat)}</td>
                  <td className="py-3 px-4 uppercase">{o.paymentMethod}</td>
                  <td className="py-3 px-4 font-mono">{o.razorpayPaymentId || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">₹{(o.total || 0).toLocaleString()}</td>
                  <td className="py-3 pl-4">
                    <select
                      value={o.paymentStatus}
                      onChange={(e) => changeStatus(o, e.target.value)}
                      className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border-0 cursor-pointer ${BADGE[o.paymentStatus]}`}
                    >
                      {STATUSES.slice(1).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...pager} />
    </div>
  );
}
