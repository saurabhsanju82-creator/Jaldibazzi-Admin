import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllProducts,
  setVendorFilter,
  setStockFilter,
  setProductSearch,
  updateProductStatus,
  updateProductPricing
} from '../../store/slices/productsSlice';
import { fetchVendors } from '../../store/slices/vendorsSlice';
import { fetchCoupons } from '../../store/slices/couponsSlice';
import { FiSearch, FiAlertTriangle, FiCheckCircle, FiXCircle, FiFilter, FiExternalLink, FiPackage, FiDollarSign, FiClock, FiCheck, FiTag, FiPercent } from 'react-icons/fi';

export default function ProductMonitoring() {
  const dispatch = useDispatch();
  const { items: products, vendorFilter, stockFilter, searchQuery } = useSelector(
    (state) => state.products
  );
  const { items: vendors } = useSelector((state) => state.vendors);
  const { items: coupons = [] } = useSelector((state) => state.coupons || { items: [] });

  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [pricingModalProduct, setPricingModalProduct] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    originalPrice: '',
    discountedPrice: '',
    couponCodes: [],
  });
  const [approvalTab, setApprovalTab] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED'

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchVendors());
    dispatch(fetchCoupons());
  }, [dispatch]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const pVendorId = String(p.vendorId || (typeof p.vendor === 'object' ? p.vendor?._id : p.vendor) || '');
    const matchesVendor = vendorFilter === 'ALL' || pVendorId === String(vendorFilter);
    let matchesStock = true;
    if (stockFilter === 'LOW_STOCK') matchesStock = p.stock > 0 && p.stock <= p.lowStockThreshold;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock === 0;
    else if (stockFilter === 'IN_STOCK') matchesStock = p.stock > p.lowStockThreshold;

    let matchesApproval = true;
    if (approvalTab === 'PENDING') matchesApproval = !p.isApproved;
    else if (approvalTab === 'APPROVED') matchesApproval = Boolean(p.isApproved);

    const vName = p.vendorName || (typeof p.vendor === 'object' ? p.vendor?.shopName : '') || '';
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      vName.toLowerCase().includes(q);

    return matchesVendor && matchesStock && matchesApproval && matchesSearch;
  });

  const handleToggleProductStatus = (product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    dispatch(updateProductStatus({ id: product.id, status: nextStatus }));
  };

  const handleOpenPricingModal = (product) => {
    const sPrice = Number(product.sellerPrice || product.price || 0);
    const dPrice = Number(product.discountedPrice || product.price || sPrice);
    const oPrice = Number(product.originalPrice || product.compareAtPrice || Math.round(dPrice * 1.2));
    setPricingModalProduct(product);
    setPricingForm({
      originalPrice: oPrice || '',
      discountedPrice: dPrice || '',
      couponCodes: Array.isArray(product.couponCodes)
        ? [...product.couponCodes]
        : (Array.isArray(product.coupons) ? product.coupons.map((c) => (typeof c === 'object' ? c.code : c)).filter(Boolean) : []),
    });
  };

  const handleSavePricing = async (approveAndPublish = true) => {
    if (!pricingModalProduct) return;
    const orig = Number(pricingForm.originalPrice);
    const disc = Number(pricingForm.discountedPrice);
    if (!orig || !disc) return;

    await dispatch(
      updateProductPricing({
        id: pricingModalProduct.id || pricingModalProduct._id,
        originalPrice: orig,
        discountedPrice: disc,
        isApproved: approveAndPublish ? true : pricingModalProduct.isApproved,
        couponCodes: pricingForm.couponCodes || [],
      })
    );
    dispatch(fetchAllProducts());
    setPricingModalProduct(null);
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const pendingApprovalCount = products.filter((p) => !p.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product & Catalog Monitoring</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit inventory health, set retail pricing (Original MRP & Discounted Price), and approve vendor submissions.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3 text-xs">
          {pendingApprovalCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
              <FiClock className="text-amber-700" />
              <span>{pendingApprovalCount} Waiting Approval</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
            {products.filter((p) => p.isApproved).length} Approved
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            {products.length} Total
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Approval Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs">
            {[
              { id: 'ALL', label: 'All Catalog' },
              { id: 'PENDING', label: `Pending Approval (${pendingApprovalCount})` },
              { id: 'APPROVED', label: 'Approved & Live' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setApprovalTab(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  approvalTab === tab.id
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
            <span className="text-slate-500 font-medium">Stock:</span>
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
      <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-xl shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3 pl-4 pr-3">Product Details</th>
              <th className="py-3 px-3">Merchant</th>
              <th className="py-3 px-3 font-mono">Seller Price</th>
              <th className="py-3 px-3 font-mono">Original (MRP)</th>
              <th className="py-3 px-3 font-mono">Discounted (Store)</th>
              <th className="py-3 px-3 font-mono text-emerald-700">Margin</th>
              <th className="py-3 px-3">Approval</th>
              <th className="py-3 pr-4 text-right">Actions</th>
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
                const sPrice = Number(product.sellerPrice !== undefined ? product.sellerPrice : (product.price || 0));
                const oPrice = Number(product.originalPrice || product.compareAtPrice || 0);
                const dPrice = Number(product.discountedPrice || product.price || sPrice);
                const margin = Number(product.margin !== undefined ? product.margin : Math.max(0, dPrice - sPrice));

                return (
                  <tr key={product.id || product._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate max-w-xs">{product.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      <div>{product.vendorName}</div>
                      <div className="text-[10px] text-slate-400">{product.category}</div>
                    </td>

                    {/* 1. Seller Price (Vendor receives this) */}
                    <td className="py-3.5 px-3 font-mono">
                      <div className="font-bold text-slate-900">₹{sPrice.toLocaleString()}</div>
                      <div className="text-[10px] text-blue-600 font-sans font-medium">Vendor Payout</div>
                    </td>

                    {/* 2. Original Price (MRP) */}
                    <td className="py-3.5 px-3 font-mono">
                      {oPrice ? (
                        <>
                          <div className="font-semibold text-slate-600">₹{oPrice.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 font-sans">Retail MRP</div>
                        </>
                      ) : (
                        <span className="text-amber-600 font-sans text-[11px]">Not set</span>
                      )}
                    </td>

                    {/* 3. Discounted Price (Store Selling Price) */}
                    <td className="py-3.5 px-3 font-mono">
                      {product.isApproved && dPrice ? (
                        <>
                          <div className="font-bold text-slate-900">₹{dPrice.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-600 font-sans font-medium">Store Price</div>
                        </>
                      ) : (
                        <span className="text-amber-600 font-sans text-[11px]">Pending price</span>
                      )}
                    </td>

                    {/* 4. Margin (Profit) */}
                    <td className="py-3.5 px-3 font-mono">
                      {product.isApproved ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          +₹{margin.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">-</span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          product.isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        }`}
                      >
                        {product.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPricingModal(product)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                            !product.isApproved
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {!product.isApproved ? 'Set Price & Approve' : 'Edit Price'}
                        </button>
                        <button
                          onClick={() => setSelectedProductDetail(product)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 rounded text-xs cursor-pointer"
                        >
                          Inspect
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

      {/* Set Pricing & Approval Modal */}
      {pricingModalProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {pricingModalProduct.isApproved ? 'Update Product Pricing' : 'Set Pricing & Approve Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set the Original MRP & Discounted Store Price for customer storefront.
                </p>
              </div>
              <button
                onClick={() => setPricingModalProduct(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto">
              {/* Product Attribution Header */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <img
                  src={pricingModalProduct.image}
                  alt={pricingModalProduct.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 truncate">{pricingModalProduct.name}</h4>
                  <p className="text-slate-500 text-[11px]">Vendor: <strong>{pricingModalProduct.vendorName}</strong></p>
                  <p className="text-slate-400 text-[10px] font-mono">SKU: {pricingModalProduct.sku}</p>
                </div>
              </div>

              {/* Vendor Seller Price Readout */}
              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-900 block">Seller Price (Vendor Payout)</span>
                  <span className="text-[11px] text-blue-700">Vendor receives this fixed amount per sale</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-blue-950">
                    ₹{Number(pricingModalProduct.sellerPrice || pricingModalProduct.price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Price Inputs: Original Price (MRP) and Discounted Price (Store Price) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Original Price / MRP (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 3000"
                    value={pricingForm.originalPrice}
                    onChange={(e) => setPricingForm({ ...pricingForm, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Crossed-out retail MRP shown to users</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Discounted Price / Store Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2500"
                    value={pricingForm.discountedPrice}
                    onChange={(e) => setPricingForm({ ...pricingForm, discountedPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Actual price user pays everywhere on store</p>
                </div>
              </div>

              {/* Promotional Coupons Attachment (Admin only) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <FiTag className="text-blue-600" />
                      <span>Attach Promotional Coupons to this Product</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select store coupons valid for this product upon approval. Vendors cannot set coupons.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {pricingForm.couponCodes?.length || 0} attached
                  </span>
                </div>

                {coupons.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    No store coupons currently created in Coupons section.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                    {coupons.map((c) => {
                      const isSelected = (pricingForm.couponCodes || []).includes(c.code);
                      return (
                        <button
                          key={c.code || c.id || c._id}
                          type="button"
                          onClick={() => {
                            const current = pricingForm.couponCodes || [];
                            const next = isSelected
                              ? current.filter((code) => code !== c.code)
                              : [...current, c.code];
                            setPricingForm({ ...pricingForm, couponCodes: next });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono font-bold">{c.code}</span>
                          <span className="text-[10px] opacity-85 font-mono">
                            ({c.type === 'percent' ? `${c.value || c.discount}% OFF` : `₹${c.value || c.discount} OFF`})
                          </span>
                          {isSelected && <FiCheck className="text-xs stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Real-Time Price & Margin Breakdown Simulation */}
              {pricingForm.originalPrice && pricingForm.discountedPrice && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                    Live Pricing & Profit Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seller Price (Vendor gets):</span>
                    <span className="font-mono font-semibold">₹{Number(pricingModalProduct.sellerPrice || pricingModalProduct.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Price (Product MRP):</span>
                    <span className="font-mono font-semibold text-slate-300">₹{Number(pricingForm.originalPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discounted Price (User pays):</span>
                    <span className="font-mono font-bold text-white">₹{Number(pricingForm.discountedPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Customer Discount:</span>
                    <span className="font-mono font-semibold">
                      -₹{Math.max(0, Number(pricingForm.originalPrice) - Number(pricingForm.discountedPrice)).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-emerald-400">Platform Profit Margin:</span>
                    <span className="font-mono text-emerald-300 text-base">
                      ₹{(Number(pricingForm.discountedPrice) - Number(pricingModalProduct.sellerPrice || pricingModalProduct.price || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPricingModalProduct(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePricing(false)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Save Pricing
              </button>
              <button
                type="button"
                onClick={() => handleSavePricing(true)}
                disabled={!pricingForm.originalPrice || !pricingForm.discountedPrice}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <FiCheck className="text-sm stroke-[3]" />
                <span>Approve &amp; Publish to Store</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
