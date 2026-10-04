import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiX, FiFolder, FiUploadCloud, FiCheck, FiTrash2, FiAlertCircle } from 'react-icons/fi';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().optional().default(''),
  image: z.string().optional().default(''),
  isActive: z.boolean().default(true),
});

export default function CategoryModal({ isOpen, onClose, onSave, category }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      image: category?.image || '',
      isActive: category?.isActive !== undefined ? category.isActive : true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: category?.name || '',
        description: category?.description || '',
        image: category?.image || '',
        isActive: category?.isActive !== undefined ? category.isActive : true,
      });
    }
  }, [category, isOpen, reset]);

  const imageValue = watch('image');
  const isActiveValue = watch('isActive');

  if (!isOpen) return null;

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
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
        setValue('image', canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (values) => {
    onSave({
      name: values.name.trim(),
      description: (values.description || '').trim(),
      image: (values.image || '').trim(),
      isActive: values.isActive,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FiFolder className="text-base" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">
                {category ? 'Edit Category' : 'Create New Category'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {category
                  ? 'Modify category parameters and thumbnail'
                  : 'Add a new catalog category for storefront and products'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fashion, Electronics, Home Decor..."
              {...register('name')}
              className={`w-full px-3.5 py-2 text-xs border rounded-lg text-slate-900 focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'
              }`}
            />
            {errors.name && (
              <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of products in this category..."
              {...register('description')}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition resize-none"
            />
          </div>
          {/* Category Image - Drag and Drop Only */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Image / Icon
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

            {imageValue ? (
              <div className="relative border-2 border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img src={imageValue} alt="Category preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Image uploaded</p>
                    <p className="text-[11px] text-slate-400">Drag a new image or click replace</p>
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
                    onClick={() => setValue('image', '')}
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
                className={`w-full p-5 border-2 border-dashed rounded-xl cursor-pointer transition text-center flex flex-col items-center justify-center gap-2 select-none ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500">
                  <FiUploadCloud className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop category image here, or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PNG, JPG, or WEBP.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800">Storefront Visibility</span>
              <p className="text-[11px] text-slate-400">
                Display this category in storefront rails and product navigation
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue('isActive', !isActiveValue)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                isActiveValue ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActiveValue ? 'translate-x-6' : 'translate-x-1'
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
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FiCheck className="text-sm" />
              <span>{category ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
