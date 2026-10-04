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
  return {
    id: p._id || p.id,
    _id: p._id || p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price || 0),
    salePrice: p.salePrice || p.compareAtPrice || null,
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
    isApproved: p.isApproved !== undefined ? p.isApproved : true,
    lowStockThreshold: Number(p.lowStockThreshold || 10),
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
    if (index === -1) throw new Error('Product not found');
    db.products[index].status = status;
    db.products[index].isActive = status === 'ACTIVE';
    savePlatformDb(db);
    return db.products[index];
  }
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
    await delay();
    const db = getPlatformDb();
    const totalSales = db.orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = db.orders.length;
    const totalCustomers = db.customers.length;
    const activeVendors = db.vendors.filter((v) => v.status === 'ACTIVE').length;
    const pendingVendors = db.vendors.filter((v) => v.status === 'PENDING').length;
    const activeProducts = db.products.filter((p) => p.status === 'ACTIVE').length;
    const lowStockProducts = db.products.filter((p) => p.stock <= p.lowStockThreshold).length;

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      totalVendors: db.vendors.length,
      activeVendors,
      pendingVendors,
      activeProducts,
      lowStockProducts,
      monthlySales: db.metrics.monthly,
      topVendors: db.vendors
        .filter((v) => v.status === 'ACTIVE')
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 4)
    };
  }
};

// Payouts API (Manual controlled flow)
export const payoutsApi = {
  getAll: async () => {
    await delay(100);
    const db = getPlatformDb();
    return db.payouts || [];
  },
  updateStatus: async (id, { status, referenceNumber, notes, settledAt }) => {
    await delay(120);
    const db = getPlatformDb();
    const index = db.payouts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Payout record not found');
    
    db.payouts[index] = {
      ...db.payouts[index],
      status: status.toUpperCase(),
      ...(referenceNumber !== undefined ? { referenceNumber } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(settledAt !== undefined
        ? { settledAt }
        : status.toUpperCase() === 'SETTLED' && !db.payouts[index].settledAt
        ? { settledAt: new Date().toISOString() }
        : status.toUpperCase() === 'PENDING'
        ? { settledAt: null }
        : {})
    };
    savePlatformDb(db);
    return db.payouts[index];
  },
  create: async (payoutData) => {
    await delay(120);
    const db = getPlatformDb();
    const newPayout = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      settledAt: null,
      referenceNumber: '',
      ...payoutData
    };
    if (!db.payouts) db.payouts = [];
    db.payouts.unshift(newPayout);
    savePlatformDb(db);
    return newPayout;
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
  get: async () => {
    try {
      const response = await axiosClient.get('/home-settings');
      if (response.data?.data) {
        const db = getPlatformDb();
        db.homeSettings = response.data.data;
        savePlatformDb(db);
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend /home-settings failed, using local storage:', err.message);
    }
    const db = getPlatformDb();
    return db.homeSettings || { featuredProducts: [], saleProducts: [], mainCategories: [] };
  },

  update: async (data) => {
    try {
      const response = await axiosClient.put('/home-settings', data);
      if (response.data?.data) {
        const db = getPlatformDb();
        db.homeSettings = response.data.data;
        savePlatformDb(db);
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend PUT /home-settings failed, saving locally:', err.message);
    }
    const db = getPlatformDb();
    const featuredPopulated = Array.isArray(data.featuredProducts)
      ? data.featuredProducts.map((id) => (typeof id === 'object' ? id : (db.products?.find((p) => (p._id || p.id) === id) || id)))
      : [];
    const salePopulated = Array.isArray(data.saleProducts)
      ? data.saleProducts.map((id) => (typeof id === 'object' ? id : (db.products?.find((p) => (p._id || p.id) === id) || id)))
      : [];
    const mainCatsPopulated = Array.isArray(data.mainCategories)
      ? data.mainCategories.map((mc) => ({
          ...mc,
          category: typeof mc.category === 'object' ? mc.category : (db.categories?.find((c) => (c._id || c.id) === mc.category) || mc.category),
        }))
      : [];

    const populatedData = {
      ...data,
      featuredProducts: featuredPopulated,
      saleProducts: salePopulated,
      mainCategories: mainCatsPopulated,
    };
    db.homeSettings = populatedData;
    savePlatformDb(db);
    return populatedData;
  },
};

// Reports & Analytics Export API
export const reportsApi = {
  exportReport: async ({ type, format, range, data }) => {
    const response = await axiosClient.post(
      '/admin/reports/export',
      { type, format, range, data },
      { responseType: 'blob' }
    );
    return response.data;
  },
};




