import axiosClient from './axiosClient';
import {
  INITIAL_VENDORS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES_METRICS,
  INITIAL_PAYOUTS
} from './mockData';

const STORAGE_KEY = 'ecom_platform_database_v1';

// Synchronous and safe localStorage state loader
export const getPlatformDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        vendors: INITIAL_VENDORS,
        products: INITIAL_PRODUCTS,
        orders: INITIAL_ORDERS,
        customers: INITIAL_CUSTOMERS,
        metrics: INITIAL_SALES_METRICS,
        payouts: INITIAL_PAYOUTS
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.payouts || !Array.isArray(parsed.payouts)) {
      parsed.payouts = INITIAL_PAYOUTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    if (!parsed.inquiries || !Array.isArray(parsed.inquiries)) {
      parsed.inquiries = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error('Error loading mock database:', err);
    return {
      vendors: INITIAL_VENDORS,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      customers: INITIAL_CUSTOMERS,
      metrics: INITIAL_SALES_METRICS,
      payouts: INITIAL_PAYOUTS
    };
  }
};

export const savePlatformDb = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Trigger storage event for same-window or cross-tab sync
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving mock database:', err);
  }
};

const delay = (ms = 150) =>
  new Promise((resolve) => {
    window.dispatchEvent(new Event('api:loading:start'));
    setTimeout(() => {
      window.dispatchEvent(new Event('api:loading:stop'));
      resolve();
    }, ms);
  });

// Auth API
export const authApi = {
  loginSuperAdmin: async (email, password) => {
    const response = await axiosClient.post('/auth/admin-login', { email, password });
    const { token, data: user } = response.data;
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    return { token, user };
  },
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      const response = await axiosClient.get('/auth/me');
      const user = response.data?.data;
      if (user) {
        if (user.role !== 'admin') {
          throw new Error('Unauthorized role: Not an administrator');
        }
        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (err) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return null;
    }
  },
  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    return true;
  }
};

// Vendors API
export const vendorsApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/vendors?status=ALL');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((v) => ({
          id: v._id,
          _id: v._id,
          name: v.shopName || 'Unnamed Shop',
          shopName: v.shopName || 'Unnamed Shop',
          ownerName: v.user?.name || 'Registered Merchant',
          email: v.user?.email || '',
          phone: v.phone || v.user?.phone || 'N/A',
          status: ({ approved: 'ACTIVE', suspended: 'DEACTIVATED', rejected: 'REJECTED', pending: 'PENDING' }[v.status] ?? (v.status || 'PENDING').toUpperCase()),
          rawStatus: v.status,
          categories: Array.isArray(v.categories)
            ? v.categories.map((c) => (typeof c === 'object' && c?.name ? c.name : String(c)))
            : [],
          category:
            Array.isArray(v.categories) && v.categories.length > 0
              ? typeof v.categories[0] === 'object'
                ? v.categories[0]?.name || 'General'
                : v.categories[0]
              : 'General Store',
          logo:
            v.logo ||
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80',
          joinedDate: v.createdAt
            ? new Date(v.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          rating: 5.0,
          productsCount: 0,
          totalSales: 0,
          totalOrders: 0,
          commissionRate: v.commissionRate || 10,
        }));
      }
    } catch (err) {
      console.warn('Backend /vendors request failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.vendors;
  },
  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/vendors?status=ALL`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        const v = response.data.data.find((v) => String(v._id) === String(id));
        if (v) {
          return {
            id: v._id,
            _id: v._id,
            name: v.shopName || 'Unnamed Shop',
            shopName: v.shopName || 'Unnamed Shop',
            ownerName: v.user?.name || 'Registered Merchant',
            email: v.user?.email || '',
            phone: v.phone || v.user?.phone || 'N/A',
            status: ({ approved: 'ACTIVE', suspended: 'DEACTIVATED', rejected: 'REJECTED', pending: 'PENDING' }[v.status] ?? (v.status || 'PENDING').toUpperCase()),
            rawStatus: v.status,
            categories: Array.isArray(v.categories)
              ? v.categories.map((c) => (typeof c === 'object' && c?.name ? c.name : String(c)))
              : [],
            category:
              Array.isArray(v.categories) && v.categories.length > 0
                ? typeof v.categories[0] === 'object'
                  ? v.categories[0]?.name || 'General'
                  : v.categories[0]
                : 'General Store',
            logo: v.logo || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80',
            description: v.description || '',
            banner: v.banner || '',
            address: v.address || '',
            slug: v.slug || '',
            taxId: v.taxId || '',
            reviewNote: v.reviewNote || '',
            joinedDate: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            commissionRate: v.commissionRate || 10,
            rating: 5.0,
            productsCount: 0,
            totalSales: 0,
            totalOrders: 0,
          };
        }
      }
    } catch (err) {
      console.warn('Backend /vendors getById failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    const vendor = db.vendors.find((v) => v.id === id || v._id === id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  },
  create: async (vendorData) => {
    await delay();
    const db = getPlatformDb();
    const newVendor = {
      id: `v-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
      rating: 5.0,
      productsCount: 0,
      totalSales: 0,
      totalOrders: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      logo: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=160&auto=format&fit=crop&q=80',
      ...vendorData
    };
    db.vendors.unshift(newVendor);
    savePlatformDb(db);
    return newVendor;
  },
  update: async (id, vendorData) => {
    try {
      // Build backend-compatible payload
      const backendPayload = {};
      if (vendorData.commissionRate !== undefined) backendPayload.commissionRate = vendorData.commissionRate;
      if (vendorData.reviewNote !== undefined) backendPayload.reviewNote = vendorData.reviewNote;
      // The PATCH /vendors/:id/status endpoint requires a status field — fetch current to preserve it
      if (Object.keys(backendPayload).length > 0) {
        // Get current vendor status to avoid invalid status validation error
        try {
          const currentRes = await axiosClient.get(`/vendors?status=ALL`);
          const currentVendor = currentRes.data?.data?.find((v) => String(v._id) === String(id));
          if (currentVendor?.status) {
            backendPayload.status = currentVendor.status; // keep existing status unchanged
          }
        } catch {
          // If we can't get current status, skip the status field and hope the backend handles it
        }
        const response = await axiosClient.patch(`/vendors/${id}/status`, backendPayload);
        const v = response.data?.data;
        if (v) {
          const frontendStatusMap = { approved: 'ACTIVE', suspended: 'DEACTIVATED', rejected: 'REJECTED', pending: 'PENDING' };
          return {
            id: v._id,
            _id: v._id,
            name: v.shopName,
            shopName: v.shopName,
            status: frontendStatusMap[v.status] ?? v.status.toUpperCase(),
            rawStatus: v.status,
            commissionRate: v.commissionRate,
            reviewNote: v.reviewNote,
            ownerName: v.user?.name || '',
            email: v.user?.email || '',
            phone: v.phone || '',
            categories: Array.isArray(v.categories)
              ? v.categories.map((c) => (typeof c === 'object' && c?.name ? c.name : String(c)))
              : [],
          };
        }
      }
    } catch (err) {
      console.warn('Backend vendor update failed, using local storage:', err.message);
    }
    await delay();
    const db = getPlatformDb();
    const index = db.vendors.findIndex((v) => v.id === id || v._id === id);
    if (index === -1) throw new Error('Vendor not found');
    db.vendors[index] = { ...db.vendors[index], ...vendorData };
    savePlatformDb(db);
    return db.vendors[index];
  },
  updateStatus: async (id, status) => {
    try {
      // Map frontend status labels to backend enum values
      const statusMap = { active: 'approved', deactivated: 'suspended' };
      const backendStatus = statusMap[status.toLowerCase()] ?? status.toLowerCase();
      const response = await axiosClient.patch(`/vendors/${id}/status`, { status: backendStatus });
      const v = response.data?.data;
      if (v) {
        // Map backend enum values back to frontend display labels
        const frontendStatusMap = { approved: 'ACTIVE', suspended: 'DEACTIVATED', rejected: 'REJECTED', pending: 'PENDING' };
        return {
          id: v._id,
          _id: v._id,
          name: v.shopName,
          shopName: v.shopName,
          status: frontendStatusMap[v.status] ?? v.status.toUpperCase(),
          rawStatus: v.status,
        };
      }
    } catch (err) {
      console.warn('Backend /vendors/:id/status failed, using local update:', err.message);
    }
    const db = getPlatformDb();
    const index = db.vendors.findIndex((v) => v.id === id || v._id === id);
    if (index !== -1) {
      db.vendors[index].status = status;
      savePlatformDb(db);
      return db.vendors[index];
    }
    return { id, status };
  }
};

// Products API
const normalizeSuperAdminProduct = (p) => {
  if (!p) return null;
  const sPrice = Number(p.sellerPrice !== undefined ? p.sellerPrice : (p.price || 0));
  const dPrice = Number(p.discountedPrice !== undefined ? p.discountedPrice : (p.price || sPrice));
  const oPrice = Number(p.originalPrice !== undefined ? p.originalPrice : (p.compareAtPrice || 0));
  return {
    id: p._id || p.id,
    _id: p._id || p.id,
    name: p.name,
    description: p.description || '',
    sellerPrice: sPrice,
    originalPrice: oPrice,
    discountedPrice: dPrice,
    margin: Number(p.margin !== undefined ? p.margin : Math.max(0, dPrice - sPrice)),
    price: dPrice,
    salePrice: p.salePrice || oPrice || null,
    compareAtPrice: oPrice,
    stock: Number(p.stock !== undefined ? p.stock : 0),
    sku: p.sku || '',
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
    image: (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    category: typeof p.category === 'object' && p.category?.name ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
    categoryObj: typeof p.category === 'object' ? p.category : { name: p.category || 'General' },
    vendor: p.vendor,
    vendorId: typeof p.vendor === 'object' ? (p.vendor?._id || p.vendor?.id) : (p.vendor || p.vendorId),
    vendorName: typeof p.vendor === 'object' ? (p.vendor?.shopName || p.vendor?.name) : (p.vendorName || 'Merchant'),
    status: p.status || (p.isActive ? 'ACTIVE' : 'DRAFT'),
    isActive: p.isActive !== undefined ? p.isActive : (p.status === 'ACTIVE'),
    isApproved: Boolean(p.isApproved),
    lowStockThreshold: Number(p.lowStockThreshold || 10),
    id: p._id || p.id,
    couponCodes: Array.isArray(p.couponCodes)
      ? p.couponCodes
      : (Array.isArray(p.coupons) ? p.coupons.map((c) => (typeof c === 'object' ? c.code : c)).filter(Boolean) : []),
    coupons: Array.isArray(p.coupons) ? p.coupons : [],
  };
};

export const productsApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/products?all=true&limit=1000');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const products = response.data.data.map(normalizeSuperAdminProduct);
        const db = getPlatformDb();
        db.products = products;
        savePlatformDb(db);
        return products;
      }
    } catch (err) {
      console.warn('Backend /products request failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.products.map(normalizeSuperAdminProduct);
  },

  getByVendor: async (vendorId) => {
    try {
      const response = await axiosClient.get(`/products?vendor=${vendorId}&all=true&limit=500`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map(normalizeSuperAdminProduct);
      }
    } catch (err) {
      console.warn('Backend /products?vendor failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.products
      .filter((p) => String(p.vendorId || p.vendor?._id || p.vendor) === String(vendorId))
      .map(normalizeSuperAdminProduct);
  },

  updateStatus: async (id, status) => {
    try {
      const response = await axiosClient.put(`/products/${id}`, {
        status,
        isActive: status === 'ACTIVE',
      });
      const updated = normalizeSuperAdminProduct(response.data?.data);
      if (updated) {
        const db = getPlatformDb();
        const index = db.products.findIndex((p) => p.id === id || p._id === id);
        if (index !== -1) {
          db.products[index] = { ...db.products[index], ...updated };
          savePlatformDb(db);
        }
        return updated;
      }
    } catch (err) {
      console.warn(`PUT /products/${id} status update failed on backend:`, err.message);
    }
    const db = getPlatformDb();
    const index = db.products.findIndex((p) => p.id === id || p._id === id);
    if (index !== -1) {
      db.products[index].status = status;
      db.products[index].isActive = status === 'ACTIVE';
      savePlatformDb(db);
      return normalizeSuperAdminProduct(db.products[index]);
    }
    throw new Error('Product not found');
  },

  updatePricingAndApproval: async (id, { originalPrice, discountedPrice, isApproved, couponCodes }) => {
    try {
      const response = await axiosClient.put(`/products/${id}`, {
        originalPrice: Number(originalPrice),
        discountedPrice: Number(discountedPrice),
        isApproved: Boolean(isApproved),
        isActive: true,
        status: 'ACTIVE',
        couponCodes: Array.isArray(couponCodes) ? couponCodes : [],
      });
      const updated = normalizeSuperAdminProduct(response.data?.data);
      if (updated) {
        if (Array.isArray(couponCodes)) {
          updated.couponCodes = couponCodes;
        }
        const db = getPlatformDb();
        const index = db.products.findIndex((p) => p.id === id || p._id === id);
        if (index !== -1) {
          db.products[index] = { ...db.products[index], ...updated, couponCodes: updated.couponCodes };
          savePlatformDb(db);
        }
        return updated;
      }
    } catch (err) {
      console.warn('Backend updatePricingAndApproval failed, updating local DB:', err.message);
    }
    const db = getPlatformDb();
    const index = db.products.findIndex((p) => p.id === id || p._id === id);
    if (index !== -1) {
      const orig = Number(originalPrice);
      const disc = Number(discountedPrice);
      const sPrice = db.products[index].sellerPrice || db.products[index].price || 0;
      db.products[index] = {
        ...db.products[index],
        originalPrice: orig,
        discountedPrice: disc,
        price: disc,
        compareAtPrice: orig,
        margin: disc - sPrice,
        isApproved: Boolean(isApproved),
        status: isApproved ? 'ACTIVE' : db.products[index].status,
        isActive: isApproved ? true : db.products[index].isActive,
        couponCodes: Array.isArray(couponCodes) ? couponCodes : (db.products[index].couponCodes || []),
      };
      savePlatformDb(db);
      return normalizeSuperAdminProduct(db.products[index]);
    }
    throw new Error('Product not found');
  },
};

// Orders API
export const ordersApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/orders');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((o) => ({
          id: o._id,
          _id: o._id,
          orderNumber: o.orderNumber,
          status: (o.status || 'pending').toUpperCase(),
          totalAmount: o.total,
          total: o.total,
          createdAt: o.createdAt,
          customerName: o.user?.name || 'Customer',
          customerEmail: o.user?.email || '',
          items: o.items || [],
          // vendorOrders for vendor-based filtering
          vendorOrders: o.vendorOrders || [],
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
        }));
      }
    } catch (err) {
      console.warn('Backend /orders request failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.orders;
  },
  getByVendor: async (vendorId) => {
    try {
      const response = await axiosClient.get('/orders');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const all = response.data.data;
        return all
          .filter((o) => Array.isArray(o.vendorOrders) && o.vendorOrders.some((vo) => String(vo.vendor?._id || vo.vendor) === String(vendorId)))
          .map((o) => ({
            id: o._id,
            _id: o._id,
            orderNumber: o.orderNumber,
            status: (o.status || 'pending').toUpperCase(),
            totalAmount: o.total,
            total: o.total,
            createdAt: o.createdAt,
            customerName: o.user?.name || 'Customer',
            customerEmail: o.user?.email || '',
            items: o.items || [],
            vendorOrders: o.vendorOrders || [],
          }));
      }
    } catch (err) {
      console.warn('Backend /orders?vendor failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.orders.filter((o) => o.vendorId === vendorId);
  },
  updateStatus: async (id, status) => {
    await delay();
    const db = getPlatformDb();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Order not found');
    db.orders[index].status = status;
    savePlatformDb(db);
    return db.orders[index];
  }
};

// Analytics API
export const analyticsApi = {
  getSuperAdminSummary: async () => {
    const response = await axiosClient.get('/dashboard');
    return response.data.data;
  }
};


// Coupons API (Global Marketplace Promotions)
export const couponsApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/coupons');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const coupons = response.data.data.map((c) => ({
          id: c._id || c.id,
          _id: c._id || c.id,
          code: c.code,
          title: c.title || '',
          description: c.description || '',
          type: c.type || 'percent',
          value: Number(c.value || 0),
          minOrderAmount: Number(c.minOrderAmount || 0),
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          usageLimit: c.usageLimit ? Number(c.usageLimit) : null,
          usedCount: Number(c.usedCount || 0),
          expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : null,
          isActive: c.isActive !== undefined ? c.isActive : true,
          isGlobal: c.isGlobal !== undefined ? c.isGlobal : true,
          applicableCategories: c.applicableCategories || [],
          enrolledVendors: c.enrolledVendors || [],
          applicableProducts: c.applicableProducts || [],
          createdAt: c.createdAt || new Date().toISOString(),
        }));
        const db = getPlatformDb();
        db.coupons = coupons;
        savePlatformDb(db);
        return coupons;
      }
    } catch (err) {
      console.warn('Backend /coupons failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    if (!db.coupons) {
      db.coupons = [
        {
          id: 'c-101',
          code: 'FESTIVAL20',
          title: 'Mega Festive Discount',
          description: 'Flat 20% off on eligible apparel, electronics and home decor.',
          type: 'percent',
          value: 20,
          minOrderAmount: 999,
          maxDiscount: 500,
          usageLimit: 2500,
          usedCount: 342,
          expiresAt: '2026-12-31',
          isActive: true,
          isGlobal: true,
          applicableCategories: ['Apparel & Fashion', 'Home & Decor'],
          enrolledVendors: [],
          applicableProducts: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c-102',
          code: 'WELCOME100',
          title: 'First Merchant Order Flat Off',
          description: 'Flat ₹100 discount for new customers on all participating vendor products.',
          type: 'fixed',
          value: 100,
          minOrderAmount: 499,
          maxDiscount: 100,
          usageLimit: 5000,
          usedCount: 1280,
          expiresAt: '2026-11-30',
          isActive: true,
          isGlobal: true,
          applicableCategories: [],
          enrolledVendors: [],
          applicableProducts: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c-103',
          code: 'SUPERVIP15',
          title: 'VIP Merchant Special 15%',
          description: '15% instant savings on premium brand collections with zero minimum purchase.',
          type: 'percent',
          value: 15,
          minOrderAmount: 0,
          maxDiscount: 1500,
          usageLimit: 1000,
          usedCount: 89,
          expiresAt: '2026-10-15',
          isActive: true,
          isGlobal: true,
          applicableCategories: [],
          enrolledVendors: [],
          applicableProducts: [],
          createdAt: new Date().toISOString(),
        },
      ];
      savePlatformDb(db);
    }
    return db.coupons;
  },

  create: async (couponData) => {
    try {
      const response = await axiosClient.post('/coupons', couponData);
      const created = response.data?.data;
      if (created) {
        const normalized = {
          id: created._id || created.id,
          _id: created._id || created.id,
          code: created.code,
          title: created.title || '',
          description: created.description || '',
          type: created.type || 'percent',
          value: Number(created.value || 0),
          minOrderAmount: Number(created.minOrderAmount || 0),
          maxDiscount: created.maxDiscount ? Number(created.maxDiscount) : null,
          usageLimit: created.usageLimit ? Number(created.usageLimit) : null,
          usedCount: Number(created.usedCount || 0),
          expiresAt: created.expiresAt ? created.expiresAt.split('T')[0] : null,
          isActive: created.isActive !== undefined ? created.isActive : true,
          isGlobal: created.isGlobal !== undefined ? created.isGlobal : true,
          applicableCategories: created.applicableCategories || [],
          enrolledVendors: created.enrolledVendors || [],
          applicableProducts: created.applicableProducts || [],
          createdAt: created.createdAt || new Date().toISOString(),
        };
        const db = getPlatformDb();
        if (!db.coupons) db.coupons = [];
        db.coupons.unshift(normalized);
        savePlatformDb(db);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend POST /coupons failed, creating locally:', err.message);
    }
    const db = getPlatformDb();
    if (!db.coupons) db.coupons = [];
    const newCoupon = {
      id: `c-${Date.now().toString().slice(-4)}`,
      code: couponData.code.toUpperCase(),
      title: couponData.title || '',
      description: couponData.description || '',
      type: couponData.type || 'percent',
      value: Number(couponData.value || 0),
      minOrderAmount: Number(couponData.minOrderAmount || 0),
      maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : null,
      usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : null,
      usedCount: 0,
      expiresAt: couponData.expiresAt || null,
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      isGlobal: couponData.isGlobal !== undefined ? couponData.isGlobal : true,
      applicableCategories: couponData.applicableCategories || [],
      enrolledVendors: [],
      applicableProducts: [],
      createdAt: new Date().toISOString(),
    };
    db.coupons.unshift(newCoupon);
    savePlatformDb(db);
    return newCoupon;
  },

  update: async (id, couponData) => {
    try {
      const response = await axiosClient.put(`/coupons/${id}`, couponData);
      const updated = response.data?.data;
      if (updated) {
        const db = getPlatformDb();
        if (db.coupons) {
          const index = db.coupons.findIndex((c) => c.id === id || c._id === id);
          if (index !== -1) {
            db.coupons[index] = { ...db.coupons[index], ...updated };
            savePlatformDb(db);
          }
        }
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /coupons/${id} failed, updating locally:`, err.message);
    }
    const db = getPlatformDb();
    if (!db.coupons) db.coupons = [];
    const index = db.coupons.findIndex((c) => c.id === id || c._id === id);
    if (index === -1) throw new Error('Coupon not found');
    db.coupons[index] = { ...db.coupons[index], ...couponData };
    savePlatformDb(db);
    return db.coupons[index];
  },

  updateStatus: async (id, isActive) => {
    try {
      const response = await axiosClient.put(`/coupons/${id}`, { isActive });
      const updated = response.data?.data;
      if (updated) {
        const db = getPlatformDb();
        if (db.coupons) {
          const index = db.coupons.findIndex((c) => c.id === id || c._id === id);
          if (index !== -1) {
            db.coupons[index].isActive = isActive;
            savePlatformDb(db);
          }
        }
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /coupons/${id} status update failed:`, err.message);
    }
    const db = getPlatformDb();
    if (!db.coupons) db.coupons = [];
    const index = db.coupons.findIndex((c) => c.id === id || c._id === id);
    if (index !== -1) {
      db.coupons[index].isActive = isActive;
      savePlatformDb(db);
      return db.coupons[index];
    }
    return { id, isActive };
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/coupons/${id}`);
    } catch (err) {
      console.warn(`Backend DELETE /coupons/${id} failed:`, err.message);
    }
    const db = getPlatformDb();
    if (db.coupons) {
      db.coupons = db.coupons.filter((c) => c.id !== id && c._id !== id);
      savePlatformDb(db);
    }
    return true;
  }
};

// Categories API (Super Admin Category Management)
export const categoriesApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/categories?active=all');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const categories = response.data.data.map((c) => ({
          id: c._id || c.id,
          _id: c._id || c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          image: c.image || '',
          isActive: c.isActive !== undefined ? c.isActive : true,
          productCount: c.productCount || (Array.isArray(c.products) ? c.products.length : 0),
          products: Array.isArray(c.products) ? c.products : [],
          createdAt: c.createdAt || new Date().toISOString(),
        }));
        const db = getPlatformDb();
        db.categories = categories;
        savePlatformDb(db);
        return categories;
      }
    } catch (err) {
      console.warn('Backend /categories failed, using local storage:', err.message);
    }

    const db = getPlatformDb();
    if (!db.categories) {
      db.categories = [];
      savePlatformDb(db);
    }
    return db.categories;
  },

  create: async (categoryData) => {
    try {
      const response = await axiosClient.post('/categories', categoryData);
      const created = response.data?.data;
      if (created) {
        const normalized = {
          id: created._id || created.id,
          _id: created._id || created.id,
          name: created.name,
          slug: created.slug,
          description: created.description || '',
          image: created.image || '',
          isActive: created.isActive !== undefined ? created.isActive : true,
          productCount: created.productCount || 0,
          products: created.products || [],
          createdAt: created.createdAt || new Date().toISOString(),
        };
        const db = getPlatformDb();
        if (!db.categories) db.categories = [];
        db.categories.unshift(normalized);
        savePlatformDb(db);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend POST /categories failed, creating locally:', err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (!db.categories) db.categories = [];
    const newCategory = {
      id: `cat-${Date.now()}`,
      _id: `cat-${Date.now()}`,
      name: categoryData.name,
      slug: (categoryData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: categoryData.description || '',
      image: categoryData.image || '',
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      productCount: 0,
      products: [],
      createdAt: new Date().toISOString(),
    };
    db.categories.unshift(newCategory);
    savePlatformDb(db);
    return newCategory;
  },

  update: async (id, categoryData) => {
    try {
      const response = await axiosClient.put(`/categories/${id}`, categoryData);
      const updated = response.data?.data;
      if (updated) {
        const normalized = {
          id: updated._id || updated.id,
          _id: updated._id || updated.id,
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          image: updated.image || '',
          isActive: updated.isActive !== undefined ? updated.isActive : true,
          productCount: updated.productCount || 0,
          products: updated.products || [],
          createdAt: updated.createdAt || new Date().toISOString(),
        };
        const db = getPlatformDb();
        if (db.categories) {
          const index = db.categories.findIndex((c) => c.id === id || c._id === id);
          if (index !== -1) {
            db.categories[index] = { ...db.categories[index], ...normalized };
            savePlatformDb(db);
          }
        }
        return normalized;
      }
    } catch (err) {
      console.warn(`Backend PUT /categories/${id} failed, updating locally:`, err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (!db.categories) db.categories = [];
    const index = db.categories.findIndex((c) => c.id === id || c._id === id);
    if (index === -1) throw new Error('Category not found');
    db.categories[index] = { ...db.categories[index], ...categoryData };
    savePlatformDb(db);
    return db.categories[index];
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/categories/${id}`);
    } catch (err) {
      console.warn(`Backend DELETE /categories/${id} failed:`, err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (db.categories) {
      db.categories = db.categories.filter((c) => c.id !== id && c._id !== id);
      savePlatformDb(db);
    }
    return true;
  },
};

// Sliders API (Home Swiper Dynamic Screens)
export const slidersApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/sliders?active=all');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const sliders = response.data.data.map((s) => ({
          id: s._id || s.id,
          _id: s._id || s.id,
          tagline: s.tagline || '',
          title: s.title || '',
          description: s.description || '',
          ctaText: s.ctaText || 'Shop Now',
          link: s.link || '/shop',
          features: Array.isArray(s.features) ? s.features : [],
          image: s.image || '',
          bgGradient: s.bgGradient || 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.6) 100%)',
          order: s.order || 0,
          isActive: s.isActive !== undefined ? s.isActive : true,
          createdAt: s.createdAt || new Date().toISOString(),
        }));
        const db = getPlatformDb();
        db.sliders = sliders;
        savePlatformDb(db);
        return sliders;
      }
    } catch (err) {
      console.warn('Backend /sliders request failed, using local storage:', err.message);
    }

    const db = getPlatformDb();
    if (!db.sliders) {
      db.sliders = [];
      savePlatformDb(db);
    }
    return db.sliders;
  },

  create: async (sliderData) => {
    try {
      const response = await axiosClient.post('/sliders', sliderData);
      const created = response.data?.data;
      if (created) {
        const normalized = {
          id: created._id || created.id,
          _id: created._id || created.id,
          tagline: created.tagline || '',
          title: created.title || '',
          description: created.description || '',
          ctaText: created.ctaText || 'Shop Now',
          link: created.link || '/shop',
          features: Array.isArray(created.features) ? created.features : [],
          image: created.image || '',
          bgGradient: created.bgGradient || 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.6) 100%)',
          order: created.order || 0,
          isActive: created.isActive !== undefined ? created.isActive : true,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        const db = getPlatformDb();
        if (!db.sliders) db.sliders = [];
        db.sliders.push(normalized);
        savePlatformDb(db);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend POST /sliders failed, saving locally:', err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (!db.sliders) db.sliders = [];
    const newSlider = {
      id: `slide-${Date.now()}`,
      _id: `slide-${Date.now()}`,
      tagline: sliderData.tagline || '',
      title: sliderData.title || '',
      description: sliderData.description || '',
      ctaText: sliderData.ctaText || 'Shop Now',
      link: sliderData.link || '/shop',
      features: Array.isArray(sliderData.features) ? sliderData.features : [],
      image: sliderData.image || '',
      bgGradient: sliderData.bgGradient || 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.6) 100%)',
      order: sliderData.order || 0,
      isActive: sliderData.isActive !== undefined ? sliderData.isActive : true,
      createdAt: new Date().toISOString(),
    };
    db.sliders.push(newSlider);
    savePlatformDb(db);
    return newSlider;
  },

  update: async (id, sliderData) => {
    try {
      const response = await axiosClient.put(`/sliders/${id}`, sliderData);
      const updated = response.data?.data;
      if (updated) {
        const normalized = {
          id: updated._id || updated.id,
          _id: updated._id || updated.id,
          tagline: updated.tagline || '',
          title: updated.title || '',
          description: updated.description || '',
          ctaText: updated.ctaText || 'Shop Now',
          link: updated.link || '/shop',
          features: Array.isArray(updated.features) ? updated.features : [],
          image: updated.image || '',
          bgGradient: updated.bgGradient || '',
          order: updated.order || 0,
          isActive: updated.isActive !== undefined ? updated.isActive : true,
          createdAt: updated.createdAt || new Date().toISOString(),
        };
        const db = getPlatformDb();
        if (db.sliders) {
          const index = db.sliders.findIndex((s) => s.id === id || s._id === id);
          if (index !== -1) {
            db.sliders[index] = { ...db.sliders[index], ...normalized };
            savePlatformDb(db);
          }
        }
        return normalized;
      }
    } catch (err) {
      console.warn(`Backend PUT /sliders/${id} failed, updating locally:`, err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (!db.sliders) db.sliders = [];
    const index = db.sliders.findIndex((s) => s.id === id || s._id === id);
    if (index === -1) throw new Error('Slider not found');
    db.sliders[index] = { ...db.sliders[index], ...sliderData };
    savePlatformDb(db);
    return db.sliders[index];
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/sliders/${id}`);
    } catch (err) {
      console.warn(`Backend DELETE /sliders/${id} failed:`, err.message);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const db = getPlatformDb();
    if (db.sliders) {
      db.sliders = db.sliders.filter((s) => s.id !== id && s._id !== id);
      savePlatformDb(db);
    }
    return true;
  },
};

// Home Settings API (Showcase curation: featured, on-sale, 2 main categories)
export const homeSettingsApi = {
  get: async (context = {}) => {
    let result = null;
    try {
      const response = await axiosClient.get('/home-settings');
      if (response.data?.data) {
        result = response.data.data;
      }
    } catch (err) {
      console.warn('Backend /home-settings failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    if (!result) {
      result = db.homeSettings || { featuredProducts: [], saleProducts: [], mainCategories: [] };
    }

    const allProducts = [
      ...(Array.isArray(context.allProducts) ? context.allProducts : []),
      ...(Array.isArray(db.products) ? db.products : []),
    ];

    if (result) {
      if (Array.isArray(result.featuredProducts)) {
        result.featuredProducts = result.featuredProducts.map((p) => {
          if (typeof p === 'object' && p && p.name) return p;
          const id = typeof p === 'object' && p ? (p._id || p.id) : p;
          return allProducts.find((item) => String(item._id || item.id) === String(id)) || p;
        }).filter(Boolean);
      }
      if (Array.isArray(result.saleProducts)) {
        result.saleProducts = result.saleProducts.map((p) => {
          if (typeof p === 'object' && p && p.name) return p;
          const id = typeof p === 'object' && p ? (p._id || p.id) : p;
          return allProducts.find((item) => String(item._id || item.id) === String(id)) || p;
        }).filter(Boolean);
      }
      db.homeSettings = result;
      savePlatformDb(db);
    }

    return result;
  },

  update: async (data, context = {}) => {
    let backendResult = null;
    try {
      const response = await axiosClient.put('/home-settings', data);
      if (response.data?.data) {
        backendResult = response.data.data;
      }
    } catch (err) {
      console.warn('Backend PUT /home-settings failed, saving locally:', err.message);
    }

    const db = getPlatformDb();
    const allProducts = [
      ...(Array.isArray(context.allProducts) ? context.allProducts : []),
      ...(Array.isArray(db.products) ? db.products : []),
    ];
    const allCategories = [
      ...(Array.isArray(context.allCategories) ? context.allCategories : []),
      ...(Array.isArray(db.categories) ? db.categories : []),
    ];

    const resolveProduct = (item) => {
      if (!item) return null;
      if (typeof item === 'object' && item && item.name) return item;
      const id = typeof item === 'object' && item ? (item._id || item.id) : item;
      const found = allProducts.find((p) => String(p._id || p.id) === String(id));
      return found || (typeof item === 'object' ? item : { _id: id, id, name: `Product (${id})` });
    };

    const resolveCategory = (cat) => {
      if (!cat) return null;
      if (typeof cat === 'object' && cat && (cat.name || cat.title)) return cat;
      const id = typeof cat === 'object' && cat ? (cat._id || cat.id) : cat;
      const found = allCategories.find((c) => String(c._id || c.id) === String(id));
      return found || (typeof cat === 'object' ? cat : null);
    };

    const featuredPopulated = Array.isArray(context.featuredProducts) && context.featuredProducts.length > 0
      ? context.featuredProducts
      : (Array.isArray(backendResult?.featuredProducts) && backendResult.featuredProducts.length > 0 && typeof backendResult.featuredProducts[0] === 'object'
          ? backendResult.featuredProducts
          : (Array.isArray(data.featuredProducts) ? data.featuredProducts.map(resolveProduct).filter(Boolean) : []));

    const salePopulated = Array.isArray(context.saleProducts) && context.saleProducts.length > 0
      ? context.saleProducts
      : (Array.isArray(backendResult?.saleProducts) && backendResult.saleProducts.length > 0 && typeof backendResult.saleProducts[0] === 'object'
          ? backendResult.saleProducts
          : (Array.isArray(data.saleProducts) ? data.saleProducts.map(resolveProduct).filter(Boolean) : []));

    const mainCatsPopulated = Array.isArray(data.mainCategories)
      ? data.mainCategories.map((mc) => ({
          ...mc,
          category: resolveCategory(mc.category),
        }))
      : (backendResult?.mainCategories || []);

    const populatedData = {
      ...data,
      ...(backendResult || {}),
      featuredProducts: featuredPopulated,
      saleProducts: salePopulated,
      mainCategories: mainCatsPopulated,
    };

    db.homeSettings = populatedData;
    savePlatformDb(db);
    return backendResult || populatedData;
  },
};

// Reports & Analytics Export API
export const reportsApi = {
  exportReport: async ({ type, format, range, data }) => {
    const response = await axiosClient.post(
      '/reports/export',
      { type, format, range, data },
      { responseType: 'blob' }
    );
    return response.data;
  },
};

// Resend Emails & Webhooks API
export const emailsApi = {
  getEmails: async (params = {}) => {
    const response = await axiosClient.get('/emails', { params });
    return response.data?.data || { emails: [], stats: {}, pagination: {} };
  },
  getEmailById: async (id) => {
    const response = await axiosClient.get(`/emails/${id}`);
    return response.data?.data;
  },
  sendTestEmail: async (to) => {
    const response = await axiosClient.post('/emails/send-test', { to });
    return response.data?.data;
  },
};

// Pincode Availability API
export const pincodesApi = {
  getPincodes: async (params = {}) => {
    try {
      const response = await axiosClient.get('/pincodes', { params });
      return response.data?.data || { pincodes: [], total: 0, page: 1, pages: 1 };
    } catch (err) {
      console.warn('Backend /pincodes request failed, using local storage fallback:', err.message);
      const db = getPlatformDb();
      let list = Array.isArray(db.pincodes) ? [...db.pincodes] : [
        { _id: 'pin-1', name: 'South Delhi', pincode: '110001', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-2', name: 'Indiranagar Bangalore', pincode: '560038', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-3', name: 'Bandra West Mumbai', pincode: '400050', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-4', name: 'Connaught Place New Delhi', pincode: '110002', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-5', name: 'Koramangala Bangalore', pincode: '560034', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-6', name: 'Andheri West Mumbai', pincode: '400053', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-7', name: 'Salt Lake Kolkata', pincode: '700091', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-8', name: 'Hitech City Hyderabad', pincode: '500081', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-9', name: 'T Nagar Chennai', pincode: '600017', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-10', name: 'Civil Lines Jaipur', pincode: '302006', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-11', name: 'Viman Nagar Pune', pincode: '411014', isActive: true, createdAt: new Date().toISOString() },
        { _id: 'pin-12', name: 'Navrangpura Ahmedabad', pincode: '380009', isActive: true, createdAt: new Date().toISOString() },
      ];
      if (!db.pincodes) {
        db.pincodes = list;
        savePlatformDb(db);
      }
      if (params.search) {
        const s = String(params.search).toLowerCase().trim();
        list = list.filter((p) => (p.pincode && p.pincode.toLowerCase().includes(s)) || (p.name && p.name.toLowerCase().includes(s)));
      }
      const page = Math.max(1, parseInt(params.page, 10) || 1);
      const limit = Math.max(1, parseInt(params.limit, 10) || 10);
      const total = list.length;
      const pages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const pincodes = list.slice(start, start + limit);
      return { pincodes, total, page, pages, limit };
    }
  },
  createPincode: async (data) => {
    try {
      const response = await axiosClient.post('/pincodes', data);
      return response.data?.data;
    } catch (err) {
      const db = getPlatformDb();
      if (!Array.isArray(db.pincodes)) db.pincodes = [];
      const newPin = {
        _id: `pin-${Date.now()}`,
        name: data.name,
        pincode: data.pincode,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      db.pincodes.unshift(newPin);
      savePlatformDb(db);
      return newPin;
    }
  },
  bulkUploadPincodes: async (pincodes) => {
    try {
      const response = await axiosClient.post('/pincodes/bulk', { pincodes });
      return response.data;
    } catch (err) {
      const db = getPlatformDb();
      if (!Array.isArray(db.pincodes)) db.pincodes = [];
      let added = 0;
      for (const item of pincodes) {
        if (!db.pincodes.find((p) => p.pincode === item.pincode)) {
          db.pincodes.unshift({
            _id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            pincode: item.pincode,
            isActive: true,
            createdAt: new Date().toISOString()
          });
          added++;
        }
      }
      savePlatformDb(db);
      return { success: true, count: added, duplicates: pincodes.length - added };
    }
  },
  togglePincode: async (id) => {
    try {
      const response = await axiosClient.put(`/pincodes/${id}/toggle`);
      return response.data?.data;
    } catch (err) {
      const db = getPlatformDb();
      if (Array.isArray(db.pincodes)) {
        const item = db.pincodes.find((p) => p._id === id || p.id === id);
        if (item) {
          item.isActive = !item.isActive;
          savePlatformDb(db);
          return item;
        }
      }
      return null;
    }
  },
  deletePincode: async (id) => {
    try {
      const response = await axiosClient.delete(`/pincodes/${id}`);
      return response.data;
    } catch (err) {
      const db = getPlatformDb();
      if (Array.isArray(db.pincodes)) {
        db.pincodes = db.pincodes.filter((p) => p._id !== id && p.id !== id);
        savePlatformDb(db);
      }
      return { success: true };
    }
  },
};

export const inquiriesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/inquiries', { params });
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('GET /inquiries failed, falling back to local platform DB:', err.message);
    }
    const db = getPlatformDb();
    let list = Array.isArray(db.inquiries) ? [...db.inquiries] : [];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.email && i.email.toLowerCase().includes(q)) ||
          (i.topic && i.topic.toLowerCase().includes(q)) ||
          (i.orderNumber && i.orderNumber.toLowerCase().includes(q)) ||
          (i.ticketId && i.ticketId.toLowerCase().includes(q)) ||
          (i.message && i.message.toLowerCase().includes(q))
      );
    }
    return list;
  },

  updateStatus: async (id, status) => {
    try {
      const response = await axiosClient.patch(`/inquiries/${id}/status`, { status });
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('PATCH /inquiries/:id/status failed, updating locally:', err.message);
    }
    const db = getPlatformDb();
    if (Array.isArray(db.inquiries)) {
      const idx = db.inquiries.findIndex((i) => i._id === id || i.id === id);
      if (idx !== -1) {
        db.inquiries[idx].status = status;
        savePlatformDb(db);
        return db.inquiries[idx];
      }
    }
    return null;
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/inquiries/${id}`);
    } catch (err) {
      console.warn('DELETE /inquiries/:id failed, removing locally:', err.message);
    }
    const db = getPlatformDb();
    if (Array.isArray(db.inquiries)) {
      db.inquiries = db.inquiries.filter((i) => i._id !== id && i.id !== id);
      savePlatformDb(db);
    }
    return { success: true };
  },
};

export const payoutsApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/payouts');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('GET /payouts failed:', err.message);
    }
    return [];
  },

  updateStatus: async (id, updates) => {
    try {
      const response = await axiosClient.patch(`/payouts/${id}/status`, updates);
      if (response.data?.data) return response.data.data;
      if (response.data?.id || response.data?._id) return response.data;
    } catch (err) {
      console.warn('PATCH /payouts/:id/status failed, updating locally:', err.message);
    }
    const db = getPlatformDb();
    if (Array.isArray(db.payouts)) {
      const idx = db.payouts.findIndex((p) => p.id === id || p._id === id);
      if (idx !== -1) {
        const current = db.payouts[idx];
        const newStatus = (updates.status || current.status).toUpperCase();
        let settledAt = current.settledAt;
        if (updates.settledAt !== undefined) {
          settledAt = updates.settledAt;
        } else if (newStatus === 'SETTLED' && !current.settledAt) {
          settledAt = new Date().toISOString();
        } else if (newStatus === 'PENDING') {
          settledAt = null;
        }
        db.payouts[idx] = { ...current, ...updates, status: newStatus, settledAt };
        savePlatformDb(db);
        return db.payouts[idx];
      }
    }
    return { id, ...updates };
  },

  create: async (payoutData) => {
    try {
      const response = await axiosClient.post('/payouts', payoutData);
      if (response.data?.data) return response.data.data;
      if (response.data?.id || response.data?._id) return response.data;
    } catch (err) {
      console.warn('POST /payouts failed, saving locally:', err.message);
    }
    const db = getPlatformDb();
    const newPayout = {
      ...payoutData,
      id: `PO-${Date.now().toString().slice(-4)}`,
      status: 'PENDING',
      referenceNumber: '',
      createdAt: new Date().toISOString(),
      settledAt: null,
    };
    if (!Array.isArray(db.payouts)) db.payouts = [];
    db.payouts.unshift(newPayout);
    savePlatformDb(db);
    return newPayout;
  },
};





