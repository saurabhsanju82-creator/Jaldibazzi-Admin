import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponsApi } from '../../services/api';

export const fetchCoupons = createAsyncThunk(
  'coupons/fetchCoupons',
  async (_, { rejectWithValue }) => {
    try {
      return await couponsApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch coupons');
    }
  }
);

export const createNewCoupon = createAsyncThunk(
  'coupons/createNewCoupon',
  async (couponData, { rejectWithValue }) => {
    try {
      return await couponsApi.create(couponData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create coupon');
    }
  }
);

export const updateExistingCoupon = createAsyncThunk(
  'coupons/updateExistingCoupon',
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      return await couponsApi.update(id, couponData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update coupon');
    }
  }
);

export const toggleCouponActiveStatus = createAsyncThunk(
  'coupons/toggleCouponActiveStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      await couponsApi.updateStatus(id, isActive);
      return { id, isActive };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update coupon status');
    }
  }
);

export const deleteExistingCoupon = createAsyncThunk(
  'coupons/deleteExistingCoupon',
  async (id, { rejectWithValue }) => {
    try {
      await couponsApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete coupon');
    }
  }
);

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: {
    items: [],
    loading: false,
    error: null,
    statusFilter: 'ALL', // 'ALL', 'ACTIVE', 'INACTIVE'
    searchQuery: '',
    selectedCoupon: null,
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setCouponSearch: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCoupon: (state, action) => {
      state.selectedCoupon = action.payload;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createNewCoupon.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update
      .addCase(updateExistingCoupon.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (c) => c.id === action.payload.id || c._id === action.payload.id || c.id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      // Toggle status
      .addCase(toggleCouponActiveStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (c) => c.id === action.payload.id || c._id === action.payload.id
        );
        if (index !== -1) {
          state.items[index].isActive = action.payload.isActive;
        }
      })
      // Delete
      .addCase(deleteExistingCoupon.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (c) => c.id !== action.payload && c._id !== action.payload
        );
      });
  },
});

export const {
  setStatusFilter,
  setCouponSearch,
  setSelectedCoupon,
  clearSelectedCoupon,
} = couponsSlice.actions;

export default couponsSlice.reducer;
