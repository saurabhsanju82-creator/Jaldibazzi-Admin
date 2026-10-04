import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { homeSettingsApi } from '../../services/api';
import { extractGradientFromImage } from '../../utils/colorAnalyzer';
import {
  FiSliders,
  FiStar,
  FiTag,
  FiGrid,
  FiCheck,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiX,
  FiZap,
  FiLayers,
  FiArrowRight,
} from 'react-icons/fi';

export default function HomeShowcaseSettings() {
  const dispatch = useDispatch();
  const { items: allProducts } = useSelector((state) => state.products || { items: [] });
  const { items: allCategories } = useSelector((state) => state.categories || { items: [] });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Tab: 'featured' | 'sale' | 'categories'
  const [activeTab, setActiveTab] = useState('featured');

  // Selected State
  const [selectedFeatured, setSelectedFeatured] = useState([]); // Array of product objects (max 6)
  const [selectedSale, setSelectedSale] = useState([]); // Array of product objects (max 4)
  const [mainCat1, setMainCat1] = useState({
    category: null,
    title: '',
    subtitle: '',
    bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.8) 100%)',
  });
  const [mainCat2, setMainCat2] = useState({
    category: null,
    title: '',
    subtitle: '',
    bgGradient: 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(219, 234, 254, 0.8) 100%)',
  });

  // Product Selection Modal
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'featured' | 'sale'
  const [productSearch, setProductSearch] = useState('');

  // Load existing settings on mount
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const data = await homeSettingsApi.get();
      if (data) {
        if (Array.isArray(data.featuredProducts)) {
          setSelectedFeatured(data.featuredProducts);
        }
        if (Array.isArray(data.saleProducts)) {
          setSelectedSale(data.saleProducts);
        }
        if (Array.isArray(data.mainCategories)) {
          if (data.mainCategories[0]) {
            setMainCat1({
              category: data.mainCategories[0].category || null,
              title: data.mainCategories[0].title || '',
              subtitle: data.mainCategories[0].subtitle || '',
              bgGradient: data.mainCategories[0].bgGradient || 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.8) 100%)',
            });
          }
          if (data.mainCategories[1]) {
            setMainCat2({
              category: data.mainCategories[1].category || null,
              title: data.mainCategories[1].title || '',
              subtitle: data.mainCategories[1].subtitle || '',
              bgGradient: data.mainCategories[1].bgGradient || 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(219, 234, 254, 0.8) 100%)',
            });
          }
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  // When a category is picked for Main Card 1, auto-generate background gradient
  const handleSelectCategory1 = async (catId) => {
    const cat = allCategories.find((c) => (c._id || c.id) === catId);
    if (!cat) return;
    let autoGradient = 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.8) 100%)';
    if (cat.image) {
      autoGradient = await extractGradientFromImage(cat.image);
    }
    setMainCat1((prev) => ({
      ...prev,
      category: cat,
      title: prev.title || cat.name || '',
      subtitle: prev.subtitle || cat.description || 'Up to 50% Off On Curated Selection',
      bgGradient: autoGradient,
    }));
  };

  // When a category is picked for Main Card 2, auto-generate background gradient
  const handleSelectCategory2 = async (catId) => {
    const cat = allCategories.find((c) => (c._id || c.id) === catId);
    if (!cat) return;
    let autoGradient = 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(219, 234, 254, 0.8) 100%)';
    if (cat.image) {
      autoGradient = await extractGradientFromImage(cat.image);
    }
    setMainCat2((prev) => ({
      ...prev,
      category: cat,
      title: prev.title || cat.name || '',
      subtitle: prev.subtitle || cat.description || 'Up to 40% Off Handcrafted Goods',
      bgGradient: autoGradient,
    }));
  };

  // Open product picker
  const openProductPicker = (target) => {
    setPickerTarget(target);
    setProductSearch('');
    setPickerModalOpen(true);
  };

  // Toggle / Select product from picker
  const handlePickProduct = (product) => {
    const pId = product._id || product.id;
    if (pickerTarget === 'featured') {
      const exists = selectedFeatured.some((p) => (p._id || p.id) === pId);
      if (exists) {
        setSelectedFeatured((prev) => prev.filter((p) => (p._id || p.id) !== pId));
      } else {
        if (selectedFeatured.length >= 6) {
          alert('You can select a maximum of 6 featured products.');
          return;
        }
        setSelectedFeatured((prev) => [...prev, product]);
      }
    } else if (pickerTarget === 'sale') {
      const exists = selectedSale.some((p) => (p._id || p.id) === pId);
      if (exists) {
        setSelectedSale((prev) => prev.filter((p) => (p._id || p.id) !== pId));
      } else {
        if (selectedSale.length >= 4) {
          alert('You can select a maximum of 4 on-sale products.');
          return;
        }
        setSelectedSale((prev) => [...prev, product]);
      }
    }
  };

  const removeFeaturedProduct = (pId) => {
    setSelectedFeatured((prev) => prev.filter((p) => (p._id || p.id) !== pId));
  };

  const removeSaleProduct = (pId) => {
    setSelectedSale((prev) => prev.filter((p) => (p._id || p.id) !== pId));
  };

  // Save all settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      featuredProducts: selectedFeatured.map((p) => p._id || p.id),
      saleProducts: selectedSale.map((p) => p._id || p.id),
      mainCategories: [
        {
          category: mainCat1.category ? (mainCat1.category._id || mainCat1.category.id) : null,
          title: mainCat1.title,
          subtitle: mainCat1.subtitle,
          bgGradient: mainCat1.bgGradient,
        },
        {
          category: mainCat2.category ? (mainCat2.category._id || mainCat2.category.id) : null,
          title: mainCat2.title,
          subtitle: mainCat2.subtitle,
          bgGradient: mainCat2.bgGradient,
        },
      ],
    };

    await homeSettingsApi.update(payload);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const getProductImage = (p) =>
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image) ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80';

  const filteredPickerProducts = (allProducts || []).filter((p) => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiSliders className="text-emerald-600" />
            <span>Storefront Showcase Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Handpick 6 featured products, 4 on-sale products, and configure 2 main categories cards with auto-gradient
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <FiCheck className="text-sm stroke-[3]" />
          <span>{saving ? 'Saving...' : 'Save Showcase Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <FiCheck className="text-emerald-600" />
          <span>Showcase settings saved! Changes are live on the storefront homepage.</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('featured')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'featured'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiStar className="text-sm" />
          <span>Featured Products ({selectedFeatured.length}/6)</span>
        </button>

        <button
          onClick={() => setActiveTab('sale')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'sale'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiTag className="text-sm" />
          <span>Products On Sale ({selectedSale.length}/4)</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'categories'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiGrid className="text-sm" />
          <span>2 Main Categories Cards</span>
        </button>
      </div>

      {/* TAB 1: FEATURED PRODUCTS (6 ITEMS) */}
      {activeTab === 'featured' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FiStar className="text-amber-500" />
                <span>Select 6 Featured Products</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These 6 chosen products will occupy the "Featured Products" grid section on the homepage
              </p>
            </div>

            <button
              type="button"
              onClick={() => openProductPicker('featured')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer self-start"
            >
              <FiPlus />
              <span>Select from Catalog ({selectedFeatured.length}/6)</span>
            </button>
          </div>

          {selectedFeatured.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              <FiStar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No featured products chosen yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Select from Catalog" to choose up to 6 products to feature.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFeatured.map((p, idx) => (
                <div
                  key={p._id || p.id}
                  className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 bg-slate-50/50 shadow-xs relative group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">₹{p.price}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFeaturedProduct(p._id || p.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                    title="Remove from featured"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS ON SALE (4 ITEMS) */}
      {activeTab === 'sale' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FiTag className="text-rose-500" />
                <span>Select 4 On-Sale Products</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These 4 chosen products will be displayed in the "Products On Sale" deal showcase
              </p>
            </div>

            <button
              type="button"
              onClick={() => openProductPicker('sale')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer self-start"
            >
              <FiPlus />
              <span>Select from Catalog ({selectedSale.length}/4)</span>
            </button>
          </div>

          {selectedSale.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              <FiTag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No on-sale products chosen yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Select from Catalog" to choose up to 4 discounted products.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedSale.map((p, idx) => (
                <div
                  key={p._id || p.id}
                  className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 bg-slate-50/50 shadow-xs relative group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-rose-600 font-mono font-bold">₹{p.salePrice || p.price}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSaleProduct(p._id || p.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                    title="Remove from sale"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 2 MAIN CATEGORIES CARDS */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FiGrid className="text-indigo-600" />
                <span>2 Main Category Spotlight Cards</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select 2 categories. Their background gradient is automatically extracted from their logo/image, and can be edited anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1 Configuration */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Category Spotlight Card #1
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded">
                    Left Card
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Category
                  </label>
                  <select
                    value={mainCat1.category?._id || mainCat1.category?.id || ''}
                    onChange={(e) => handleSelectCategory1(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="">-- Choose Category --</option>
                    {allCategories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headline Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Collection"
                    value={mainCat1.title}
                    onChange={(e) => setMainCat1((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 50% Off On Fashion & Accessories"
                    value={mainCat1.subtitle}
                    onChange={(e) => setMainCat1((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                {/* Background Gradient (Auto-generated from image & editable) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FiZap className="text-amber-500 text-xs" />
                      <span>Background Gradient (Auto-detected &amp; Editable)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={mainCat1.bgGradient}
                    onChange={(e) => setMainCat1((prev) => ({ ...prev, bgGradient: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                {/* Live Card Preview */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Live Preview
                  </span>
                  <div
                    className="rounded-2xl p-5 flex items-center justify-between overflow-hidden relative min-h-[140px] shadow-sm border border-slate-200/50"
                    style={{ background: mainCat1.bgGradient }}
                  >
                    <div className="space-y-1.5 max-w-[200px] z-10">
                      <h4 className="font-black text-slate-950 text-base leading-tight">
                        {mainCat1.title || 'Category 1 Title'}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-800 line-clamp-2">
                        {mainCat1.subtitle || 'Category 1 Subtitle description'}
                      </p>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#182452] text-white text-[10px] font-bold rounded-lg mt-1">
                        <span>Explore</span>
                        <FiArrowRight className="text-[10px]" />
                      </span>
                    </div>

                    {mainCat1.category?.image && (
                      <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border border-white/60 shadow-sm">
                        <img
                          src={mainCat1.category.image}
                          alt="Category 1"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2 Configuration */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Category Spotlight Card #2
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded">
                    Right Card
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Category
                  </label>
                  <select
                    value={mainCat2.category?._id || mainCat2.category?.id || ''}
                    onChange={(e) => handleSelectCategory2(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="">-- Choose Category --</option>
                    {allCategories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headline Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Home Essentials"
                    value={mainCat2.title}
                    onChange={(e) => setMainCat2((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 40% Off Handcrafted Living Goods"
                    value={mainCat2.subtitle}
                    onChange={(e) => setMainCat2((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                {/* Background Gradient (Auto-generated from image & editable) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FiZap className="text-amber-500 text-xs" />
                      <span>Background Gradient (Auto-detected &amp; Editable)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={mainCat2.bgGradient}
                    onChange={(e) => setMainCat2((prev) => ({ ...prev, bgGradient: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-white rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                {/* Live Card Preview */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Live Preview
                  </span>
                  <div
                    className="rounded-2xl p-5 flex items-center justify-between overflow-hidden relative min-h-[140px] shadow-sm border border-slate-200/50"
                    style={{ background: mainCat2.bgGradient }}
                  >
                    <div className="space-y-1.5 max-w-[200px] z-10">
                      <h4 className="font-black text-slate-950 text-base leading-tight">
                        {mainCat2.title || 'Category 2 Title'}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-800 line-clamp-2">
                        {mainCat2.subtitle || 'Category 2 Subtitle description'}
                      </p>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#182452] text-white text-[10px] font-bold rounded-lg mt-1">
                        <span>Explore</span>
                        <FiArrowRight className="text-[10px]" />
                      </span>
                    </div>

                    {mainCat2.category?.image && (
                      <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border border-white/60 shadow-sm">
                        <img
                          src={mainCat2.category.image}
                          alt="Category 2"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {pickerModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all animate-fadeIn max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FiLayers className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {pickerTarget === 'featured'
                    ? `Pick Featured Products (Selected: ${selectedFeatured.length}/6)`
                    : `Pick On-Sale Products (Selected: ${selectedSale.length}/4)`}
                </h3>
              </div>
              <button
                onClick={() => setPickerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search products by title, brand, or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredPickerProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No products found matching your search.</p>
              ) : (
                filteredPickerProducts.map((p) => {
                  const pId = p._id || p.id;
                  const isSelected =
                    pickerTarget === 'featured'
                      ? selectedFeatured.some((item) => (item._id || item.id) === pId)
                      : selectedSale.some((item) => (item._id || item.id) === pId);

                  return (
                    <div
                      key={pId}
                      onClick={() => handlePickProduct(p)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer rounded-lg transition ${
                        isSelected ? 'bg-emerald-50/70 border border-emerald-200/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-400">{p.brand || 'Merchant Brand'} • ₹{p.price}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : 'Add +'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
