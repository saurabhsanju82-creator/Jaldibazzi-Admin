import React from 'react';
import { createPortal } from 'react-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiX, FiCheck, FiTag, FiPercent, FiCalendar, FiDollarSign, FiInfo } from 'react-icons/fi';

const couponValidationSchema = Yup.object({
  code: Yup.string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .matches(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens and underscores')
    .required('Coupon code is required'),
  title: Yup.string().trim().required('Promotion headline is required'),
  description: Yup.string().trim().required('Description is required'),
  type: Yup.string().oneOf(['percent', 'fixed']).required(),
  value: Yup.number()
    .positive('Discount value must be greater than 0')
    .when('type', {
      is: 'percent',
      then: (schema) => schema.max(100, 'Percentage discount cannot exceed 100%'),
    })
    .required('Discount value is required'),
  minOrderAmount: Yup.number().min(0, 'Minimum order amount cannot be negative').default(0),
  maxDiscount: Yup.number().nullable().min(1, 'Max discount cap must be at least 1'),
  usageLimit: Yup.number().nullable().min(1, 'Usage limit must be at least 1'),
  expiresAt: Yup.date().nullable().min(new Date(Date.now() - 86400000), 'Expiry date cannot be in the past'),
  isActive: Yup.boolean().default(true),
  isGlobal: Yup.boolean().default(true),
});

const PRESET_CATEGORIES = [
  'Apparel & Fashion',
  'Electronics',
  'Home & Decor',
  'Beauty & Wellness',
  'Food & Beverage',
];

export default function CreateCouponModal({ isOpen, onClose, coupon, onSave }) {
  const isEditing = !!coupon;

  const initialValues = React.useMemo(() => {
    return {
      code: coupon?.code || '',
      title: coupon?.title || '',
      description: coupon?.description || '',
      type: coupon?.type || 'percent',
      value: coupon?.value !== undefined ? coupon.value : 20,
      minOrderAmount: coupon?.minOrderAmount !== undefined ? coupon.minOrderAmount : 499,
      maxDiscount: coupon?.maxDiscount || '',
      usageLimit: coupon?.usageLimit || '',
      expiresAt: coupon?.expiresAt ? (coupon.expiresAt.includes('T') ? coupon.expiresAt.split('T')[0] : coupon.expiresAt) : '',
      isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
      isGlobal: coupon?.isGlobal !== undefined ? coupon.isGlobal : true,
      applicableCategories: coupon?.applicableCategories || [],
    };
  }, [coupon, isOpen]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: couponValidationSchema,
    onSubmit: (values) => {
      const formatted = {
        ...values,
        code: values.code.trim().toUpperCase(),
        value: Number(values.value),
        minOrderAmount: Number(values.minOrderAmount || 0),
        maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : null,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
        expiresAt: values.expiresAt || null,
      };
      onSave(formatted);
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleToggleCategory = (cat) => {
    const current = formik.values.applicableCategories;
    if (current.includes(cat)) {
      formik.setFieldValue('applicableCategories', current.filter((c) => c !== cat));
    } else {
      formik.setFieldValue('applicableCategories', [...current, cat]);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FiTag className="text-base" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Global Coupon Voucher' : 'Create New Global Marketplace Coupon'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Coupons created here can be selected by merchants and opted-in for their products.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Coupon Code & Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Coupon Promo Code *
              </label>
              <div className="relative">
                <input
                  name="code"
                  type="text"
                  placeholder="e.g. JALDI20, FESTIVE50"
                  value={formik.values.code}
                  onChange={(e) => formik.setFieldValue('code', e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:outline-none focus:ring-2 uppercase transition ${
                    formik.touched.code && formik.errors.code
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
                  }`}
                />
              </div>
              {formik.touched.code && formik.errors.code && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{formik.errors.code}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Promotion Title / Headline *
              </label>
              <input
                name="title"
                type="text"
                placeholder="e.g. Mega Summer Super Sale"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition ${
                  formik.touched.title && formik.errors.title
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
                }`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{formik.errors.title}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
              Campaign Description / Terms Summary *
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="e.g. Applicable on all participating merchant products with orders above ₹999."
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 leading-relaxed transition ${
                formik.touched.description && formik.errors.description
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
              }`}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-rose-600 text-[11px] mt-1 font-medium">{formik.errors.description}</p>
            )}
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Discount Format *
              </label>
              <select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="percent">Percentage (%) Off</option>
                <option value="fixed">Flat Amount (₹) Off</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                {formik.values.type === 'percent' ? 'Discount Rate (%) *' : 'Discount Value (₹) *'}
              </label>
              <div className="relative">
                <input
                  name="value"
                  type="number"
                  step="any"
                  placeholder={formik.values.type === 'percent' ? '20' : '200'}
                  value={formik.values.value}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              {formik.touched.value && formik.errors.value && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{formik.errors.value}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Min Purchase Amount (₹)
              </label>
              <input
                name="minOrderAmount"
                type="number"
                placeholder="499"
                value={formik.values.minOrderAmount}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Limits & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {formik.values.type === 'percent' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                  Max Cap (₹) (Optional)
                </label>
                <input
                  name="maxDiscount"
                  type="number"
                  placeholder="e.g. 500"
                  value={formik.values.maxDiscount}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Total Redemption Limit
              </label>
              <input
                name="usageLimit"
                type="number"
                placeholder="e.g. 5000 (blank = unlimited)"
                value={formik.values.usageLimit}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Expiry Date
              </label>
              <input
                name="expiresAt"
                type="date"
                value={formik.values.expiresAt}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Category Scope Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Applicable Categories (Optional - Select none for all marketplace categories)
              </label>
              <span className="text-[11px] text-emerald-600 font-bold font-mono">
                {formik.values.applicableCategories.length === 0
                  ? 'All Marketplace Categories'
                  : `${formik.values.applicableCategories.length} selected`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = formik.values.applicableCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <FiCheck className="text-[11px]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Global switches */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                checked={formik.values.isActive}
                onChange={formik.handleChange}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Active &amp; redeemable immediately
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isGlobal"
                checked={formik.values.isGlobal}
                onChange={formik.handleChange}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Enable for Vendor Opt-in Pool
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <FiCheck className="text-sm stroke-[3]" />
              {isEditing ? 'Save Coupon Changes' : 'Create Global Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
