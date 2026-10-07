import React, { useState, useEffect, useCallback } from 'react';
import {
  FiMail,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiActivity,
  FiCopy,
  FiCheck,
  FiArrowRight,
} from 'react-icons/fi';
import { emailsApi } from '../../services/api';
import Pagination from '../common/Pagination';

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchEmails = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await emailsApi.getEmails({
          page,
          limit: 15,
          search: search.trim() || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        setEmails(res.emails || []);
        if (res.stats) setStats(res.stats);
        if (res.pagination) setPagination(res.pagination);
      } catch (err) {
        console.error('Failed to fetch emails:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, typeFilter, startDate, endDate]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmails();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEmails]);


  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle className="text-emerald-500 text-xs" /> Delivered
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FiClock className="text-blue-500 text-xs" /> Sent
          </span>
        );
      case 'opened':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FiEye className="text-purple-500 text-xs" /> Opened
          </span>
        );
      case 'clicked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FiActivity className="text-indigo-500 text-xs" /> Clicked
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FiAlertCircle className="text-rose-500 text-xs" /> Bounced
          </span>
        );
      case 'complained':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FiAlertTriangle className="text-amber-500 text-xs" /> Spam Complaint
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FiAlertCircle className="text-slate-500 text-xs" /> {status || 'Unknown'}
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    const normalizedType = String(type || '').toLowerCase().trim();
    switch (normalizedType) {
      case 'user registered':
      case 'user_registered':
      case 'user_register':
      case 'user register':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            User Registered
          </span>
        );
      case 'user reset password':
      case 'user_reset_password':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            User Reset Password
          </span>
        );
      case 'user order successfully placed':
      case 'order_successful':
      case 'order successful':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            User Order Successfully Placed
          </span>
        );
      case 'user order delieverd':
      case 'user order delivered':
      case 'order_delivered':
      case 'order delivered':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
            User Order Delivered
          </span>
        );
      case 'vendor registered':
      case 'vendor_registered':
      case 'vendor_register':
      case 'vendor register':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Vendor Registered
          </span>
        );
      case 'vendor approved':
      case 'vendor_approved':
      case 'vendor_approval':
      case 'vendor approval':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Vendor Approved
          </span>
        );
      case 'vendor reset pswrd':
      case 'vendor reset password':
      case 'vendor_reset_pswrd':
      case 'vendor_reset_password':
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Vendor Reset Password
          </span>
        );
      default:
        return (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {type ? type.replace(/_/g, ' ') : 'General'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Email logs</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time delivery status, bounce tracking, and webhook telemetry from Resend.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchEmails(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer disabled:opacity-60"
          >
            <FiRefreshCw className={`text-xs ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Server Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search email, subject, Resend ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Filter Controls (Type & Date Range) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer transition"
            >
              <option value="all">All Types</option>
              <option value="user registered">User Registered</option>
              <option value="user reset password">User Reset Password</option>
              <option value="user order successfully placed">User Order Successfully Placed</option>
              <option value="user order delieverd">User Order Delivered</option>
              <option value="vendor registered">Vendor Registered</option>
              <option value="vendor approved">Vendor Approved</option>
              <option value="vendor reset pswrd">Vendor Reset Password</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          {/* Reset Filters Button */}
          {(search || typeFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Emails Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <FiRefreshCw className="animate-spin text-emerald-600 text-2xl mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading email logs from database...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FiMail className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No emails found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || typeFilter !== 'all' || startDate || endDate
                ? 'No email records match your filter criteria. Try resetting the filters.'
                : 'Emails sent via Resend for user/vendor registrations and orders will automatically appear here with live webhook delivery statuses.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Recipient</th>
                  <th className="py-3.5 px-4 font-semibold">Subject & Type</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Resend ID</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {emails.map((email) => (
                  <tr key={email._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{email.to}</div>
                      <div className="text-[11px] text-slate-400">From: {email.from || 'noreply@mail.jaldibaazi.in'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{email.subject}</div>
                      <div className="mt-1">{getTypeBadge(email.type)}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(email.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {email.resendId ? (
                        <span title={email.resendId}>{email.resendId.slice(0, 14)}...</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(email.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                      >
                        View <FiArrowRight className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {emails.length > 0 && (
          <div className="px-4 pb-4 border-t border-slate-200/80 bg-slate-50/30">
            <Pagination
              page={pagination.page || page}
              totalPages={pagination.pages || 1}
              setPage={setPage}
              total={pagination.total || emails.length}
              pageSize={pagination.limit || 15}
            />
          </div>
        )}
      </div>

      {/* Email Details Modal / Drawer */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button
              onClick={() => setSelectedEmail(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
            >
              <FiX />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <FiMail className="text-base" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Email Details & Timeline</h3>
                <p className="text-xs text-slate-500">Webhook event progression from Resend</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <div>{getStatusBadge(selectedEmail.status)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">To:</span>
                  <span className="font-semibold text-slate-800">{selectedEmail.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Type:</span>
                  <div>{getTypeBadge(selectedEmail.type)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-medium text-slate-800">{selectedEmail.subject}</span>
                </div>
                {selectedEmail.resendId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Resend ID:</span>
                    <button
                      onClick={() => handleCopyId(selectedEmail.resendId)}
                      className="font-mono text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedEmail.resendId}
                      {copiedId ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Body */}
              {selectedEmail.preview && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Message Preview
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 leading-relaxed text-xs">
                    {selectedEmail.preview}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                  Timeline ({selectedEmail.events?.length || 0})
                </h4>
                {selectedEmail.events && selectedEmail.events.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto pr-2 space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                    {selectedEmail.events.map((ev, index) => (
                      <div key={index} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {ev.type}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(ev.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No events logged yet.</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
