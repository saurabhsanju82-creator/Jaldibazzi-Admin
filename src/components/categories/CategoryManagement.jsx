import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createNewCategory,
  updateExistingCategory,
  deleteExistingCategory,
} from '../../store/slices/categoriesSlice';
import CategoryModal from './CategoryModal';
import {
  FiFolder,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiBox,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';

export default function CategoryManagement() {
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector((state) => state.categories || { items: [] });
  const { items: allProducts } = useSelector((state) => state.products || { items: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSaveCategory = async (data) => {
    if (editingCategory) {
      const id = editingCategory.id || editingCategory._id;
      await dispatch(updateExistingCategory({ id, categoryData: data }));
    } else {
      await dispatch(createNewCategory(data));
    }
    dispatch(fetchCategories());
  };

  const handleToggleStatus = async (cat) => {
    const id = cat.id || cat._id;
    await dispatch(updateExistingCategory({ id, categoryData: { isActive: !cat.isActive } }));
    dispatch(fetchCategories());
  };

  const handleDeleteCategory = async (cat) => {
    const pCount = cat.productCount || (cat.products ? cat.products.length : 0);
    const confirmMsg =
      pCount > 0
        ? `Are you sure you want to delete "${cat.name}"? It currently contains ${pCount} product(s).`
        : `Are you sure you want to delete "${cat.name}"?`;

    if (window.confirm(confirmMsg)) {
      const id = cat.id || cat._id;
      await dispatch(deleteExistingCategory(id));
      dispatch(fetchCategories());
    }
  };

  const toggleExpand = (catId) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Helper to get products for a category (from category object or from allProducts state)
  const getCategoryProducts = (cat) => {
    if (Array.isArray(cat.products) && cat.products.length > 0) {
      return cat.products;
    }
    const catId = String(cat.id || cat._id);
    const catSlug = (cat.slug || '').toLowerCase();
    const catName = (cat.name || '').toLowerCase();

    return (allProducts || []).filter((p) => {
      const pCat = p.category;
      if (typeof pCat === 'object' && pCat !== null) {
        return (
          String(pCat._id || pCat.id) === catId ||
          (pCat.slug && pCat.slug.toLowerCase() === catSlug) ||
          (pCat.name && pCat.name.toLowerCase() === catName)
        );
      }
      const pCatStr = String(pCat || '').toLowerCase();
      const pSlugStr = String(p.categorySlug || '').toLowerCase();
      return pCatStr === catId || pCatStr === catSlug || pCatStr === catName || pSlugStr === catSlug;
    });
  };

  // Filtered categories
  const filteredCategories = (categories || []).filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.slug && cat.slug.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && cat.isActive) ||
      (statusFilter === 'INACTIVE' && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const totalLinkedProducts = categories.reduce(
    (sum, c) => sum + (c.productCount || (c.products ? c.products.length : 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiFolder className="text-emerald-600" />
            <span>Category Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, manage catalog taxonomy, and monitor all products listed under each category
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 shrink-0"
        >
          <FiPlus className="text-sm" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Categories</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCategories}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FiFolder className="text-lg" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active On Storefront</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCategories}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <FiCheckCircle className="text-lg" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Listed Products</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalLinkedProducts}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <FiBox className="text-lg" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Status:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md transition ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {loading && categories.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <FiLayers className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FiFolder className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No category matches "${searchQuery}". Try adjusting your search query.`
                : 'Get started by creating your first catalog category.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const catId = cat.id || cat._id;
            const isExpanded = expandedCategoryIds.has(catId);
            const productsUnderCat = getCategoryProducts(cat);

            return (
              <div
                key={catId}
                className="bg-white border border-slate-200/80 rounded-xl shadow-sm hover:border-slate-300 transition overflow-hidden"
              >
                {/* Category Main Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail Image */}
                    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <FiFolder className="text-slate-400 text-2xl" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{cat.name}</h3>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          /{cat.slug}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {cat.description || 'No description provided'}
                      </p>
                      {Array.isArray(cat.sizes) && cat.sizes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sizes:</span>
                          {cat.sizes.map((sz) => (
                            <span key={sz} className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Product Accordion Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Products Toggle Pill */}
                    <button
                      onClick={() => toggleExpand(catId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        isExpanded
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                      title="View products under this category"
                    >
                      <FiBox className="text-xs" />
                      <span>{productsUnderCat.length} Products</span>
                      {isExpanded ? <FiChevronUp className="text-xs" /> : <FiChevronDown className="text-xs" />}
                    </button>

                    {/* Active Toggle Switch */}
                    <button
                      onClick={() => handleToggleStatus(cat)}
                      className={`p-1.5 rounded-lg border transition ${
                        cat.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={cat.isActive ? 'Deactivate category' : 'Activate category'}
                    >
                      {cat.isActive ? <FiCheckCircle className="text-sm" /> : <FiXCircle className="text-sm" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition"
                      title="Edit Category"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                      title="Delete Category"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Expanded Products View */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FiBox className="text-indigo-600" />
                        <span>Products under "{cat.name}" ({productsUnderCat.length})</span>
                      </span>
                    </div>

                    {productsUnderCat.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-400">
                        <FiBox className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <p className="text-xs">No products are currently assigned to this category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {productsUnderCat.map((p) => {
                          const pImg =
                            (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image) ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                          const vendorName =
                            typeof p.vendor === 'object' && p.vendor !== null
                              ? p.vendor.shopName || p.vendor.name || 'Merchant'
                              : 'Merchant';

                          return (
                            <div
                              key={p._id || p.id}
                              className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-xs"
                            >
                              <img
                                src={pImg}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">{p.name}</h4>
                                <p className="text-[11px] text-slate-400 truncate">{vendorName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-bold text-slate-800">₹{p.price}</span>
                                  {p.stock !== undefined && (
                                    <span className="text-[10px] text-slate-500">Stock: {p.stock}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating / Editing Category */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
    </div>
  );
}
