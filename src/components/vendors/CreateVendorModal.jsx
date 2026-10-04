import React from 'react';
import { createPortal } from 'react-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiX, FiCheck } from 'react-icons/fi';

const validationSchema = Yup.object({
  name: Yup.string().required('Brand/Company Name is required'),
  ownerName: Yup.string().required('Owner/Contact Person is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  category: Yup.string().required('Primary category is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.string().required('Business address is required'),
});

export default function CreateVendorModal({ isOpen, onClose, onSubmit }) {
  const formik = useFormik({
    initialValues: {
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      category: 'Apparel & Fashion',
      description: '',
      address: '',
      taxId: '',
    },
    validationSchema,
    onSubmit: (values, { resetForm }) => {
      onSubmit(values);
      resetForm();
      onClose();
    },
  });

  if (!isOpen) return null;

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
            className="p-1 text-slate-400 hover:text-slate-700 transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Brand / Store Name *</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Acme Goods"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-rose-500 text-[11px] mt-1">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Person *</label>
              <input
                name="ownerName"
                type="text"
                placeholder="e.g. John Doe"
                value={formik.values.ownerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {formik.touched.ownerName && formik.errors.ownerName && (
                <p className="text-rose-500 text-[11px] mt-1">{formik.errors.ownerName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                name="email"
                type="email"
                placeholder="vendor@company.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-rose-500 text-[11px] mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
              <input
                name="phone"
                type="text"
                placeholder="+1 (555) 000-0000"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-rose-500 text-[11px] mt-1">{formik.errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Category *</label>
              <select
                name="category"
                value={formik.values.category}
                onChange={formik.handleChange}
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
                name="taxId"
                type="text"
                placeholder="e.g. US-991823"
                value={formik.values.taxId}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Business Address *</label>
            <input
              name="address"
              type="text"
              placeholder="Full business address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
            {formik.touched.address && formik.errors.address && (
              <p className="text-rose-500 text-[11px] mt-1">{formik.errors.address}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Brand Description *</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief description of the merchant's business and catalog."
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-rose-500 text-[11px] mt-1">{formik.errors.description}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md flex items-center gap-1.5 transition shadow-sm"
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
