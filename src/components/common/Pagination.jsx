import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (value, format = 'DD/MM/YYYY') => {
  const d = new Date(value);
  if (!value || isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return format
    .replace('DD', dd)
    .replace('MMM', MONTHS[d.getMonth()])
    .replace('MM', mm)
    .replace('YYYY', yyyy);
};

// Hook: paginates a list using the admin "page size" setting
export function usePagination(items, resetKey) {
  const { pageSize, dateFormat } = useSelector((state) => state.settings);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [resetKey, pageSize]);

  const current = Math.min(page, totalPages);
  const pageItems = items.slice((current - 1) * pageSize, current * pageSize);
  return { pageItems, page: current, totalPages, setPage, total: items.length, pageSize, dateFormat };
}

export default function Pagination({ page, totalPages, setPage, total, pageSize }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100';
  return (
    <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
      <span>
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button className={btn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
