import React, { useState, useEffect } from 'react';
import { inquiriesApi } from '../../services/api';
import {
  FiSearch,
  FiRefreshCw,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiUser,
  FiPackage,
  FiTrash2,
  FiEye,
  FiX,
  FiAlertCircle,
  FiFilter
} from 'react-icons/fi';

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await inquiriesApi.getAll({
        search: search.trim(),
        status: statusFilter,
      });
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInquiries();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await inquiriesApi.updateStatus(id, newStatus);
      setInquiries((prev) =>
        prev.map((item) => (item._id === id || item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedInquiry && (selectedInquiry._id === id || selectedInquiry.id === id)) {
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact inquiry?')) return;
    try {
      await inquiriesApi.delete(id);
      setInquiries((prev) => prev.filter((item) => item._id !== id && item.id !== id));
      if (selectedInquiry && (selectedInquiry._id === id || selectedInquiry.id === id)) {
        setSelectedInquiry(null);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'NEW').length,
    inProgress: inquiries.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: inquiries.filter((i) => i.status === 'RESOLVED').length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiMessageSquare className="w-6 h-6 text-[#182452]" />
            <span>Contact Inquiries</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage customer support queries, ticket messages, order help requests, and feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInquiries}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Inquiries</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">New / Unread</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.new}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">In Progress</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.inProgress}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Resolved</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.resolved}</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Inquiries' },
              { id: 'NEW', label: 'New' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'RESOLVED', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#182452] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, order ID, message..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#182452]/20 focus:border-[#182452] transition"
            />
          </form>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date & Ticket</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Topic</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Message</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading contact inquiries...</span>
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FiMessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No contact inquiries found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Customer messages submitted through the storefront contact form will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => {
                  const id = inq._id || inq.id;
                  const dateStr = inq.createdAt
                    ? new Date(inq.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recently';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-[#182452]">
                          {inq.ticketId || `INQ-${id.slice(-6)}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{dateStr}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {inq.name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <a
                          href={`mailto:${inq.email}`}
                          className="hover:text-[#182452] hover:underline"
                        >
                          {inq.email}
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] whitespace-nowrap">
                          {inq.topic || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {inq.orderNumber || inq.orderId ? (
                          <span className="font-semibold text-indigo-700">
                            {inq.orderNumber || inq.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 text-[11px] leading-relaxed">
                          {inq.message}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={inq.status || 'NEW'}
                          onChange={(e) => handleStatusChange(id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${getStatusBadge(
                            inq.status
                          )}`}
                        >
                          <option value="NEW">New</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            title="View Full Message"
                            onClick={() => setSelectedInquiry(inq)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#182452] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Inquiry"
                            onClick={() => handleDelete(id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ticket Details
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedInquiry.ticketId || 'Inquiry Message'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                <span className="font-semibold text-slate-900">{selectedInquiry.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="font-semibold text-[#182452] hover:underline"
                >
                  {selectedInquiry.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Topic</span>
                <span className="font-semibold text-slate-800">{selectedInquiry.topic}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedInquiry.orderNumber || selectedInquiry.orderId || 'None'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">
                Message Body
              </span>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedInquiry.message}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedInquiry.status || 'NEW'}
                  onChange={(e) =>
                    handleStatusChange(selectedInquiry._id || selectedInquiry.id, e.target.value)
                  }
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${getStatusBadge(
                    selectedInquiry.status
                  )}`}
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: Support Ticket ${
                  selectedInquiry.ticketId || ''
                } - ${selectedInquiry.topic || ''}`}
                className="px-4 py-2 bg-[#182452] hover:bg-[#121c40] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <FiMail className="w-3.5 h-3.5" />
                <span>Reply by Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
