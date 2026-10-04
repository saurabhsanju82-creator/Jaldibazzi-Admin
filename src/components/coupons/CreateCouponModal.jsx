import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiX, FiCheck, FiTag } from 'react-icons/fi';

const couponValidationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens and underscores'),
  title: z.string().trim().min(1, 'Promotion headline is required'),
  description: z.string().trim().min(1, 'Description is required'),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive('Discount value must be greater than 0'),
  minOrderAmount: z.coerce.number().min(0, 'Minimum order amount cannot be negative').default(0),
  maxDiscount: z.string().optional().default(''),
  usageLimit: z.string().optional().default(''),
  expiresAt: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  isGlobal: z.boolean().default(true),
  applicableCategories: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.type === 'percent' && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value'],
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

  const getInitialValues = () => ({
    code: coupon?.code || '',
    title: coupon?.title || '',
    description: coupon?.description || '',
    type: coupon?.type || 'percent',
    value: coupon?.value !== undefined ? coupon.value : 20,
    minOrderAmount: coupon?.minOrderAmount !== undefined ? coupon.minOrderAmount : 499,
    maxDiscount: coupon?.maxDiscount !== undefined && coupon?.maxDiscount !== null ? String(coupon.maxDiscount) : '',
    usageLimit: coupon?.usageLimit !== undefined && coupon?.usageLimit !== null ? String(coupon.usageLimit) : '',
    expiresAt: coupon?.expiresAt ? (coupon.expiresAt.includes('T') ? coupon.expiresAt.split('T')[0] : coupon.expiresAt) : '',
    isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
    isGlobal: coupon?.isGlobal !== undefined ? coupon.isGlobal : true,
    applicableCategories: coupon?.applicableCategories || [],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponValidationSchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (isOpen) {
      reset(getInitialValues());
    }
  }, [coupon, isOpen, reset]);

  const typeValue = watch('type');
  const applicableCategories = watch('applicableCategories') || [];
  const isActiveValue = watch('isActive');
  const isGlobalValue = watch('isGlobal');

  if (!isOpen) return null;

  const handleToggleCategory = (cat) => {
    if (applicableCategories.includes(cat)) {
      setValue('applicableCategories', applicableCategories.filter((c) => c !== cat));
    } else {
      setValue('applicableCategories', [...applicableCategories, cat]);
    }
  };

  const onSubmit = (values) => {
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Coupon Code & Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Coupon Promo Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. JALDI20, FESTIVE50"
                  {...register('code')}
                  onChange={(e) => setValue('code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:outline-none focus:ring-2 uppercase transition ${
                    errors.code
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
                  }`}
                />
              </div>
              {errors.code && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Promotion Title / Headline *
              </label>
              <input
                type="text"
                placeholder="e.g. Mega Summer Super Sale"
                {...register('title')}
                className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition ${
                  errors.title
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
                }`}
              />
              {errors.title && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.title.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
              Campaign Description / Terms Summary *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Applicable on all participating merchant products with orders above ₹999."
              {...register('description')}
              className={`w-full px-3 py-2 bg-slate-50/60 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 leading-relaxed transition ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/15'
              }`}
            />
            {errors.description && (
              <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Discount Format *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="percent">Percentage (%) Off</option>
                <option value="fixed">Flat Amount (₹) Off</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                {typeValue === 'percent' ? 'Discount Rate (%) *' : 'Discount Value (₹) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder={typeValue === 'percent' ? '20' : '200'}
                  {...register('value')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              {errors.value && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.value.message}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Min Purchase Amount (₹)
              </label>
              <input
                type="number"
                placeholder="499"
                {...register('minOrderAmount')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Limits & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {typeValue === 'percent' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                  Max Cap (₹) (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  {...register('maxDiscount')}
                  className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Total Redemption Limit
              </label>
              <input
                type="number"
                placeholder="e.g. 5000 (blank = unlimited)"
                {...register('usageLimit')}
                className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Expiry Date
              </label>
              <input
                type="date"
                {...register('expiresAt')}
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
                {applicableCategories.length === 0
                  ? 'All Marketplace Categories'
                  : `${applicableCategories.length} selected`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = applicableCategories.includes(cat);
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
                checked={isActiveValue}
                onChange={(e) => setValue('isActive', e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Active &amp; redeemable immediately
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGlobalValue}
                onChange={(e) => setValue('isGlobal', e.target.checked)}
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
