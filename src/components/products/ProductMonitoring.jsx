import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllProducts,
  setVendorFilter,
  setStockFilter,
  setProductSearch,
  updateProductStatus
} from '../../store/slices/productsSlice';
import { fetchVendors } from '../../store/slices/vendorsSlice';
import { FiSearch, FiAlertTriangle, FiCheckCircle, FiXCircle, FiFilter, FiExternalLink, FiPackage } from 'react-icons/fi';

export default function ProductMonitoring() {
  const dispatch = useDispatch();
  const { items: products, vendorFilter, stockFilter, searchQuery } = useSelector(
    (state) => state.products
  );
  const { items: vendors } = useSelector((state) => state.vendors);

  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchVendors());
  }, [dispatch]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const pVendorId = String(p.vendorId || (typeof p.vendor === 'object' ? p.vendor?._id : p.vendor) || '');
    const matchesVendor = vendorFilter === 'ALL' || pVendorId === String(vendorFilter);
    let matchesStock = true;
    if (stockFilter === 'LOW_STOCK') matchesStock = p.stock > 0 && p.stock <= p.lowStockThreshold;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock === 0;
    else if (stockFilter === 'IN_STOCK') matchesStock = p.stock > p.lowStockThreshold;

    const vName = p.vendorName || (typeof p.vendor === 'object' ? p.vendor?.shopName : '') || '';
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      vName.toLowerCase().includes(q);

    return matchesVendor && matchesStock && matchesSearch;
  });

  const handleToggleProductStatus = (product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    dispatch(updateProductStatus({ id: product.id, status: nextStatus }));
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product & Catalog Monitoring</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit inventory health, catalog additions, and pricing across all vendors.
          </p>
        </div>

        {/* Quick Stock Summary Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
            {products.filter((p) => p.stock > p.lowStockThreshold).length} In Stock
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
            {lowStockCount} Low Stock
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60 font-medium">
            {outOfStockCount} Out of Stock
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Vendor selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Vendor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => dispatch(setVendorFilter(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Vendors ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock availability selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Availability:</span>
            <select
              value={stockFilter}
              onChange={(e) => dispatch(setStockFilter(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">Adequate Stock</option>
              <option value="LOW_STOCK">Low Stock Alert ({lowStockCount})</option>
              <option value="OUT_OF_STOCK">Out of Stock ({outOfStockCount})</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search SKU, product title..."
            value={searchQuery}
            onChange={(e) => dispatch(setProductSearch(e.target.value))}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 pr-4">Product Details</th>
              <th className="py-3 px-4">Merchant</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Inventory Level</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                      <FiPackage className="text-3xl" />
                    </div>
                    <div className="text-sm font-semibold text-slate-500">No products found</div>
                    <div className="text-xs text-slate-400">No products match the active vendor or stock filters.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
                          <div className="text-[11px] text-slate-400">{product.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">{product.vendorName}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">{product.sku}</td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-slate-900">₹{product.price}</div>
                      {product.salePrice && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Sale: ₹{product.salePrice}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-sans">
                            Low
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-sans">
                            Out
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          product.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProductDetail(product)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleToggleProductStatus(product)}
                          className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 rounded"
                        >
                          {product.status === 'ACTIVE' ? 'Set Draft' : 'Publish'}
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

      {selectedProductDetail && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Product Inspection</h3>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex gap-4">
                <img
                  src={selectedProductDetail.image}
                  alt={selectedProductDetail.name}
                  className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{selectedProductDetail.name}</h4>
                  <div className="text-slate-500 mt-0.5">By {selectedProductDetail.vendorName}</div>
                  <div className="font-mono text-slate-400 mt-1">SKU: {selectedProductDetail.sku}</div>
                  <div className="mt-2 text-sm font-bold text-slate-900 font-mono">
                    ₹{selectedProductDetail.price}{' '}
                    {selectedProductDetail.salePrice && (
                      <span className="text-emerald-600 font-normal text-xs">
                        (Sale: ₹{selectedProductDetail.salePrice})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="font-semibold text-slate-700 mb-1">Catalog Description</div>
                <p className="text-slate-600 leading-relaxed">{selectedProductDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 font-mono">
                <div>
                  <span className="text-slate-400 font-sans">Current Stock:</span>{' '}
                  <strong className="text-slate-900">{selectedProductDetail.stock}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Threshold:</span>{' '}
                  <strong className="text-slate-900">{selectedProductDetail.lowStockThreshold}</strong>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
