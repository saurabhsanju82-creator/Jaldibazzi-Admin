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

export default function Pagination({
  page = 1,
  totalPages = 1,
  setPage,
  total = 0,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  if (total === 0) return null;
  const safeTotal = Math.max(0, total);
  const safeTotalPages = Math.max(1, totalPages);
  const from = Math.min((page - 1) * pageSize + 1, safeTotal);
  const to = Math.min(page * pageSize, safeTotal);

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }
    if (page >= safeTotalPages - 3) {
      return [1, '...', safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }
    return [1, '...', page - 1, page, page + 1, '...', safeTotalPages];
  };

  const btn =
    'px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-slate-700">{from}</span>-
          <span className="font-semibold text-slate-700">{to}</span> of{' '}
          <span className="font-semibold text-slate-700">{safeTotal}</span>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-400">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className={btn}
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs font-medium rounded-lg transition cursor-pointer flex items-center justify-center ${
                  page === p
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          className={btn}
          disabled={page >= safeTotalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
