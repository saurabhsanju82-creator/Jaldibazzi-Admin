import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiMapPin,
  FiUploadCloud,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { pincodesApi } from '../../services/api';
import Pagination from '../common/Pagination';

export default function PincodeAvailability() {
  const [pincodes, setPincodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Single Add Form
  const [newName, setNewName] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // CSV Bulk Upload
  const fileInputRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewCount, setCsvPreviewCount] = useState(0);
  const [parsedPincodes, setParsedPincodes] = useState([]);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvMessage, setCsvMessage] = useState(null);

  const fetchPincodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pincodesApi.getPincodes({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
      });
      setPincodes(res.pincodes || []);
      setTotal(res.total || 0);
      setPages(res.pages || Math.ceil((res.total || 0) / pageSize) || 1);
    } catch (err) {
      console.error('Failed to fetch pincodes:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPincodes();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPincodes]);

  // Handle single pincode creation
  const handleAddSingle = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newName.trim() || !newPincode.trim()) {
      setFormError('Please enter both location name and pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      await pincodesApi.createPincode({
        name: newName.trim(),
        pincode: newPincode.trim(),
      });
      setFormSuccess(`Pincode ${newPincode.trim()} added successfully!`);
      setNewName('');
      setNewPincode('');
      setPage(1);
      fetchPincodes();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add pincode');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse CSV File
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setCsvMessage(null);
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // check if header line
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('pincode')) {
          continue;
        }

        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim().replace(/^["']|["']$/g, '');
          const pincode = parts[1].trim().replace(/^["']|["']$/g, '');
          if (name && pincode) {
            parsed.push({ name, pincode });
          }
        }
      }

      setParsedPincodes(parsed);
      setCsvPreviewCount(parsed.length);
    };
    reader.readAsText(file);
  };

  // Upload parsed CSV
  const handleUploadCsv = async () => {
    if (parsedPincodes.length === 0) {
      setCsvMessage({ type: 'error', text: 'No valid pincodes found in the selected CSV file' });
      return;
    }

    setIsUploadingCsv(true);
    setCsvMessage(null);
    try {
      const res = await pincodesApi.bulkUploadPincodes(parsedPincodes);
      setCsvMessage({
        type: 'success',
        text: res.message || `Uploaded ${parsedPincodes.length} pincodes successfully!`,
      });
      setCsvFile(null);
      setParsedPincodes([]);
      setCsvPreviewCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPage(1);
      fetchPincodes();
    } catch (err) {
      setCsvMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to upload CSV',
      });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    const sample = 'name,pincode\nConnaught Place,110001\nBandra West,400050\nKoramangala,560034\nSalt Lake,700064';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_pincodes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle active status
  const handleToggle = async (id) => {
    try {
      await pincodesApi.togglePincode(id);
      fetchPincodes();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete pincode
  const handleDelete = async (id, pin) => {
    if (!window.confirm(`Are you sure you want to remove pincode ${pin}?`)) return;
    try {
      await pincodesApi.deletePincode(id);
      fetchPincodes();
    } catch (err) {
      console.error('Failed to delete pincode:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Manage Pincode Availability</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {total} Serviceable Pincodes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Customers on the storefront can check delivery availability for their area before ordering. Add pincodes manually or upload in bulk via CSV.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer self-start md:self-auto"
        >
          <FiDownload className="text-xs" /> Sample CSV
        </button>
      </div>

      {/* Grid: Add Single Form & Bulk CSV Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Add Single Pincode */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FiPlus className="text-sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Add Individual Pincode</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter location area name and pincode to mark it serviceable immediately.
            </p>

            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                <FiAlertCircle className="shrink-0" /> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                <FiCheck className="shrink-0" /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddSingle} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Location / Area Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. South Delhi, Indiranagar, Bandra"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 110001"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value.replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newName.trim() || !newPincode.trim()}
                className="w-full mt-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FiRefreshCw className="animate-spin text-xs" /> Adding...
                  </>
                ) : (
                  <>
                    <FiPlus className="text-xs" /> Add Serviceable Pincode
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Bulk CSV Upload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FiUploadCloud className="text-sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Upload via CSV</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload hundreds of pincodes simultaneously. Format: <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">name, pincode</code>.
            </p>

            {csvMessage && (
              <div
                className={`mb-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  csvMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {csvMessage.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                {csvMessage.text}
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center bg-slate-50/60 transition">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="pincode-csv-input"
              />
              <label htmlFor="pincode-csv-input" className="cursor-pointer block">
                <FiUploadCloud className="text-3xl text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {csvFile ? csvFile.name : 'Choose CSV file to upload'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {csvPreviewCount > 0
                    ? `Ready to upload ${csvPreviewCount} pincodes`
                    : 'CSV with name & pincode columns'}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleUploadCsv}
              disabled={isUploadingCsv || parsedPincodes.length === 0}
              className="w-full mt-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs shadow-emerald-600/20"
            >
              {isUploadingCsv ? (
                <>
                  <FiRefreshCw className="animate-spin text-xs" /> Processing CSV...
                </>
              ) : (
                <>
                  <FiUploadCloud className="text-xs" /> Upload {csvPreviewCount > 0 ? `${csvPreviewCount} Pincodes` : 'CSV'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pincodes Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3.5 top-2.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search by pincode or area name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          <button
            onClick={fetchPincodes}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <FiRefreshCw className="text-xs" />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center">
            <FiRefreshCw className="animate-spin text-emerald-600 text-2xl mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading pincodes...</p>
          </div>
        ) : pincodes.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <FiMapPin className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No pincodes configured</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? 'No locations match your search query.'
                : 'Add serviceable pincodes using the forms above or import your CSV list.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Pincode</th>
                  <th className="py-3 px-4 font-semibold">Location / Area</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Added On</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pincodes.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.pincode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(item._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {item.isActive ? (
                          <>
                            <FiCheckCircle className="text-emerald-500 text-xs" /> Serviceable
                          </>
                        ) : (
                          <>
                            <FiXCircle className="text-slate-400 text-xs" /> Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id, item.pincode)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete pincode"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 pb-4 border-t border-slate-200/80 bg-slate-50/30">
            <Pagination
              page={page}
              totalPages={pages}
              setPage={setPage}
              total={total}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
