import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../services/axiosClient';
import Pagination, { usePagination, formatDate } from '../common/Pagination';

const ROLES = ['ALL', 'customer', 'vendor', 'admin'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');

  useEffect(() => {
    axiosClient
      .get('/users')
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        (role === 'ALL' || u.role === role) &&
        (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );
  }, [users, search, role]);

  const { pageItems, dateFormat, ...pager } = usePagination(filtered, search + role);

  const toggleActive = async (u) => {
    try {
      const res = await axiosClient.patch(`/users/${u._id}/status`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: res.data.data.isActive } : x)));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Users</h2>
        <p className="text-sm text-slate-500 mt-0.5">All registered accounts on the platform ({users.length}).</p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                role === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'All Users' : r}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="w-full sm:w-64 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 pl-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading users...</td></tr>
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">No users found.</td></tr>
            ) : (
              pageItems.map((u) => (
                <tr key={u._id}>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">{u.phone || '-'}</td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4">{formatDate(u.createdAt, dateFormat)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggleActive(u)}
                        className="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
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
