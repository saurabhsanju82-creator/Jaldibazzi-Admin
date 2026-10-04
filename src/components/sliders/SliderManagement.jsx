import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSliders,
  createNewSlider,
  updateExistingSlider,
  deleteExistingSlider,
} from '../../store/slices/slidersSlice';
import SliderModal from './SliderModal';
import {
  FiSliders,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiArrowRight,
  FiExternalLink,
  FiZap,
} from 'react-icons/fi';

export default function SliderManagement() {
  const dispatch = useDispatch();
  const { items: sliders, loading } = useSelector((state) => state.sliders || { items: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchSliders());
  }, [dispatch]);

  const handleOpenCreateModal = () => {
    setEditingSlider(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (slider) => {
    setEditingSlider(slider);
    setModalOpen(true);
  };

  const handleSaveSlider = async (data) => {
    if (editingSlider) {
      const id = editingSlider.id || editingSlider._id;
      await dispatch(updateExistingSlider({ id, sliderData: data }));
    } else {
      await dispatch(createNewSlider(data));
    }
    dispatch(fetchSliders());
  };

  const handleToggleStatus = async (slider) => {
    const id = slider.id || slider._id;
    await dispatch(updateExistingSlider({ id, sliderData: { isActive: !slider.isActive } }));
    dispatch(fetchSliders());
  };

  const handleDeleteSlider = async (slider) => {
    if (window.confirm(`Are you sure you want to delete slider "${slider.title}"?`)) {
      const id = slider.id || slider._id;
      await dispatch(deleteExistingSlider(id));
      dispatch(fetchSliders());
    }
  };

  const filteredSliders = (sliders || []).filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.tagline && s.tagline.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.link && s.link.toLowerCase().includes(q))
    );
  });

  const activeSlidersCount = (sliders || []).filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiSliders className="text-emerald-600" />
            <span>Home Slider Screens</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dynamically create, customize, and arrange homepage hero carousel banners
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
        >
          <FiPlus className="text-sm" />
          <span>Add New Slider Screen</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Slider Screens</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{sliders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FiLayers className="text-lg" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Live on Storefront</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeSlidersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <FiCheckCircle className="text-lg" />
          </div>
        </div>
      </div>

      {/* Sliders List */}
      <div className="space-y-4">
        {loading && sliders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <FiLayers className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-xs">Loading slider screens...</p>
          </div>
        ) : filteredSliders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FiSliders className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No home slider screens yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first dynamic homepage slider screen with an auto-generated gradient and custom CTA.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Create Slide Screen
            </button>
          </div>
        ) : (
          filteredSliders.map((slide, index) => {
            const slideId = slide.id || slide._id;
            return (
              <div
                key={slideId}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition overflow-hidden"
              >
                {/* Live Preview Header Strip */}
                <div
                  className="p-6 transition-all relative overflow-hidden"
                  style={{ background: slide.bgGradient }}
                >
                  <div className="max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left text preview */}
                    <div className="md:col-span-8 space-y-3">
                      {slide.tagline && (
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-white/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/50 inline-block">
                          {slide.tagline}
                        </span>
                      )}

                      <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                        {slide.title}
                      </h3>

                      {slide.description && (
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {slide.description}
                        </p>
                      )}

                      {/* CTA & Link preview */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="px-4 py-2 bg-[#182452] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
                          <span>{slide.ctaText || 'Shop Now'}</span>
                          <FiArrowRight className="text-xs" />
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <FiExternalLink className="text-[11px]" />
                          <span>{slide.link}</span>
                        </span>
                      </div>

                      {/* Features */}
                      {Array.isArray(slide.features) && slide.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {slide.features.map((feat, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[10px] font-semibold text-slate-600 bg-white/70 px-2 py-0.5 rounded border border-slate-200/50"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right image preview */}
                    <div className="md:col-span-4 flex justify-center">
                      <div className="w-48 h-36 rounded-xl overflow-hidden shadow-md border border-white/60 bg-white shrink-0">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Controls */}
                <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">Slide #{index + 1}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        slide.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {slide.isActive ? 'Active on Storefront' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <FiZap className="text-amber-500" /> Auto-gradient active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleStatus(slide)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        slide.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={slide.isActive ? 'Deactivate slide' : 'Activate slide'}
                    >
                      {slide.isActive ? <FiCheckCircle className="text-sm" /> : <FiXCircle className="text-sm" />}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(slide)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      title="Edit Slide"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSlider(slide)}
                      className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Delete Slide"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      <SliderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSlider}
        slider={editingSlider}
      />
    </div>
  );
}
