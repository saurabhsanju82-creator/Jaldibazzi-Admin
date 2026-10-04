import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiX, FiCheck } from 'react-icons/fi';

const validationSchema = z.object({
  name: z.string().min(1, 'Brand/Company Name is required'),
  ownerName: z.string().min(1, 'Owner/Contact Person is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  category: z.string().min(1, 'Primary category is required'),
  description: z.string().min(1, 'Description is required'),
  address: z.string().min(1, 'Business address is required'),
  taxId: z.string().optional().default(''),
});

export default function CreateVendorModal({ isOpen, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      category: 'Apparel & Fashion',
      description: '',
      address: '',
      taxId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        category: 'Apparel & Fashion',
        description: '',
        address: '',
        taxId: '',
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (values) => {
    onSubmit(values);
    reset();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Provision New Vendor</h3>
            <p className="text-xs text-slate-500">Create and activate a merchant profile on the platform.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Brand / Store Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Goods"
                {...register('name')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {errors.name && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                {...register('ownerName')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {errors.ownerName && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.ownerName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="vendor@company.com"
                {...register('email')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {errors.email && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                {...register('phone')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {errors.phone && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Category *</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white text-slate-900"
              >
                <option value="Apparel & Fashion">Apparel & Fashion</option>
                <option value="Home & Decor">Home & Decor</option>
                <option value="Electronics">Electronics</option>
                <option value="Beauty & Wellness">Beauty & Wellness</option>
                <option value="Food & Beverage">Food & Beverage</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tax / Registration ID</label>
              <input
                type="text"
                placeholder="e.g. US-991823"
                {...register('taxId')}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Business Address *</label>
            <input
              type="text"
              placeholder="Full business address"
              {...register('address')}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
            {errors.address && (
              <p className="text-rose-500 text-[11px] mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Brand Description *</label>
            <textarea
              rows={3}
              placeholder="Brief description of the merchant's business and catalog."
              {...register('description')}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
            {errors.description && (
              <p className="text-rose-500 text-[11px] mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <FiCheck /> Create Vendor
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
