import React, { useState, useEffect, useCallback } from 'react';
import {
  FiMail,
  FiSend,
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
  FiShield,
} from 'react-icons/fi';
import { emailsApi } from '../../services/api';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState(null);
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
          status: statusFilter !== 'all' ? statusFilter : undefined,
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
    [page, search, statusFilter]
  );

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Handle test email dispatch
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) return;

    setTestLoading(true);
    setTestMessage(null);

    try {
      await emailsApi.sendTestEmail(testEmailAddress);
      setTestMessage({
        type: 'success',
        text: `Test email sent to ${testEmailAddress}! Resend webhook will update its status shortly.`,
      });
      setTestEmailAddress('');
      setTimeout(() => {
        fetchEmails(true);
      }, 1200);
    } catch (err) {
      setTestMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to dispatch test email',
      });
    } finally {
      setTestLoading(false);
    }
  };

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

  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Email Logs & Webhooks</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Resend Active
            </span>
          </div>
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

          <button
            onClick={() => {
              setIsTestModalOpen(true);
              setTestMessage(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs shadow-emerald-600/20 cursor-pointer"
          >
            <FiSend className="text-xs" /> Send Test Email
          </button>
        </div>
      </div>

      {/* Webhook Endpoint Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 mt-0.5">
            <FiShield className="text-lg" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Live Resend Webhook Listener
            </div>
            <div className="text-sm font-mono text-emerald-300 font-medium mt-0.5">
              POST /api/webhooks/resend
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Listens for <span className="text-slate-300">email.delivered</span>, <span className="text-slate-300">email.bounced</span>, <span className="text-slate-300">email.complained</span>, and updates status automatically.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Listening for webhook events
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emails */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Total Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FiMail className="text-sm" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-500">All registered system emails</div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium uppercase tracking-wider">
            <span>Delivered</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FiCheckCircle className="text-sm" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{stats.delivered}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            {deliveryRate}% verified delivery rate
          </div>
        </div>

        {/* Opened / Clicked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 text-xs font-medium uppercase tracking-wider">
            <span>Opened / Clicked</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FiEye className="text-sm" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats.opened + stats.clicked}
          </div>
          <div className="mt-1 text-xs text-purple-600 font-medium">
            {stats.opened} opened, {stats.clicked} clicked
          </div>
        </div>

        {/* Bounces & Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium uppercase tracking-wider">
            <span>Bounces & Spam</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <FiAlertCircle className="text-sm" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats.bounced + stats.complained}
          </div>
          <div className="mt-1 text-xs text-rose-600 font-medium">
            {stats.bounced} bounced, {stats.complained} complaints
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by recipient email or subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'sent', label: 'Sent' },
            { id: 'opened', label: 'Opened' },
            { id: 'bounced', label: 'Bounced' },
            { id: 'complained', label: 'Spam' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Emails sent via Resend for vendor registrations, notifications, and test emails will automatically appear here with live webhook delivery statuses.'}
            </p>
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer"
            >
              <FiSend className="text-xs" /> Dispatch a test email now
            </button>
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
                      <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {email.type?.replace('_', ' ')}
                      </span>
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
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.pages}</span> ({pagination.total} records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
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

              {/* Webhook Events Timeline */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                  Webhook Events Timeline ({selectedEmail.events?.length || 0})
                </h4>
                {selectedEmail.events && selectedEmail.events.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
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
                  <div className="text-slate-400 italic">No webhook events logged yet.</div>
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

      {/* Test Email Dispatch Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setIsTestModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
            >
              <FiX />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <FiSend className="text-base" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Send Test Email</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sends an email via your configured Resend credentials to test email delivery and live webhook receipt.
            </p>

            {testMessage && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  testMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testMessage.text}
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testLoading || !testEmailAddress}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {testLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin text-xs" /> Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="text-xs" /> Dispatch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
