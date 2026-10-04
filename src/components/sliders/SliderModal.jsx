import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiX, FiSliders, FiUploadCloud, FiCheck, FiTrash2, FiZap, FiAlertCircle } from 'react-icons/fi';
import { extractGradientFromImage } from '../../utils/colorAnalyzer';

const sliderSchema = Yup.object({
  tagline: Yup.string().trim().optional(),
  title: Yup.string().trim().required('Slider headline title is required'),
  description: Yup.string().trim().optional(),
  ctaText: Yup.string().trim().default('Explore Catalog'),
  link: Yup.string().trim().required('Destination link URL is required'),
  features: Yup.string().trim().optional(),
  image: Yup.string().required('Slider image is required'),
  bgGradient: Yup.string().optional(),
  order: Yup.number().typeError('Order must be a number').min(0, 'Order cannot be negative').default(0),
  isActive: Yup.boolean().default(true),
});

export default function SliderModal({ isOpen, onClose, onSave, slider }) {
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingGradient, setAnalyzingGradient] = useState(false);
  const fileInputRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      tagline: slider?.tagline || (slider ? '' : 'EXCLUSIVE CURATED SELECTION'),
      title: slider?.title || '',
      description: slider?.description || '',
      ctaText: slider?.ctaText || 'Explore Catalog',
      link: slider?.link || '/shop',
      features: Array.isArray(slider?.features)
        ? slider.features.join(', ')
        : (slider?.features || (slider ? '' : 'Global Freight, Escrow Protection, 30-Day Returns')),
      image: slider?.image || '',
      bgGradient: slider?.bgGradient || 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.7) 100%)',
      order: slider?.order || 0,
      isActive: slider?.isActive !== undefined ? slider.isActive : true,
    },
    enableReinitialize: true,
    validationSchema: sliderSchema,
    onSubmit: (values) => {
      const featureList = (values.features || '')
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      onSave({
        tagline: (values.tagline || '').trim(),
        title: values.title.trim(),
        description: (values.description || '').trim(),
        ctaText: (values.ctaText || '').trim() || 'Explore Catalog',
        link: values.link.trim() || '/shop',
        features: featureList,
        image: values.image,
        bgGradient: values.bgGradient,
        order: Number(values.order) || 0,
        isActive: values.isActive,
      });
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        formik.setFieldValue('image', dataUrl);

        // Automatically analyze image colors and generate background gradient
        setAnalyzingGradient(true);
        const autoGradient = await extractGradientFromImage(dataUrl);
        formik.setFieldValue('bgGradient', autoGradient);
        setAnalyzingGradient(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FiSliders className="text-base" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">
                {slider ? 'Edit Home Slider Screen' : 'Create Dynamic Home Slider Screen'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure headline, CTA button, image, and auto-generated color gradient
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tagline & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline Badge (Optional)
              </label>
              <input
                type="text"
                name="tagline"
                placeholder="e.g. CURATED ATELIER EDIT • SS26"
                value={formik.values.tagline}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                min="0"
                value={formik.values.order}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              {formik.touched.order && formik.errors.order && (
                <p className="text-rose-500 text-[11px] mt-1">{formik.errors.order}</p>
              )}
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Headline Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Everything You Need, All in One Place"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3.5 py-2 text-xs border rounded-lg text-slate-900 focus:outline-none focus:ring-2 transition ${
                formik.touched.title && formik.errors.title
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'
              }`}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {formik.errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              name="description"
              placeholder="Discover millions of products from verified brand ateliers and trusted studios..."
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition resize-none"
            />
          </div>

          {/* CTA Button Text & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                name="ctaText"
                placeholder="e.g. Explore Catalog, Shop Now"
                value={formik.values.ctaText}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Link <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="link"
                placeholder="e.g. /shop, /category/fashion, /product/..."
                value={formik.values.link}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3.5 py-2 text-xs border rounded-lg text-slate-900 focus:outline-none focus:ring-2 transition ${
                  formik.touched.link && formik.errors.link
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'
                }`}
              />
              {formik.touched.link && formik.errors.link && (
                <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {formik.errors.link}
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trust Features (Comma separated)
            </label>
            <input
              type="text"
              name="features"
              placeholder="Global Freight, Escrow Protection, 30-Day Returns"
              value={formik.values.features}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Slider Image - Drag and Drop */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slider Image <span className="text-rose-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
              }}
            />

            {formik.values.image ? (
              <div className="relative border-2 border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img src={formik.values.image} alt="Slider preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Image uploaded</p>
                    <p className="text-[11px] text-slate-400">
                      Background gradient automatically generated from image palette
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-xs cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      formik.setFieldValue('image', '');
                      formik.setFieldValue('bgGradient', 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.7) 100%)');
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Remove image"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition text-center flex flex-col items-center justify-center gap-2 select-none ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/50'
                    : formik.touched.image && formik.errors.image
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500">
                  <FiUploadCloud className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop slider image here, or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports high-resolution PNG, JPG, or WEBP.
                  </p>
                </div>
              </div>
            )}
            {formik.touched.image && formik.errors.image && (
              <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {formik.errors.image}
              </p>
            )}
          </div>

          {/* Auto-Generated Background Gradient Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiZap className="text-amber-500 text-sm" />
                <span>Auto-Generated Background Gradient</span>
              </span>
              {analyzingGradient && (
                <span className="text-[10px] text-blue-600 animate-pulse font-medium">
                  Analyzing image colors...
                </span>
              )}
            </div>

            <div
              className="w-full h-14 rounded-xl border border-slate-200 flex items-center justify-between px-4 transition-all"
              style={{ background: formik.values.bgGradient }}
            >
              <span className="text-xs font-bold text-slate-800 drop-shadow-sm">
                Live Slide Backdrop Preview
              </span>
              <span className="text-[10px] font-mono bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded text-slate-600 border border-slate-200/50">
                Harmonized from image colors
              </span>
            </div>
          </div>

          {/* Active Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800">Slider Screen Active</span>
              <p className="text-[11px] text-slate-400">
                Display this slide on storefront homepage hero carousel
              </p>
            </div>
            <button
              type="button"
              onClick={() => formik.setFieldValue('isActive', !formik.values.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                formik.values.isActive ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formik.values.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FiCheck className="text-sm" />
              <span>{slider ? 'Save Slide Changes' : 'Create Slide'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
