import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vendorsApi } from '../../services/api';

export const fetchVendors = createAsyncThunk(
  'vendors/fetchVendors',
  async (_, { rejectWithValue }) => {
    try {
      return await vendorsApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createVendor = createAsyncThunk(
  'vendors/createVendor',
  async (vendorData, { rejectWithValue }) => {
    try {
      return await vendorsApi.create(vendorData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/updateVendor',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await vendorsApi.update(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateVendorStatus = createAsyncThunk(
  'vendors/updateVendorStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await vendorsApi.updateStatus(id, status);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchVendorById = createAsyncThunk(
  'vendors/fetchVendorById',
  async (id, { rejectWithValue }) => {
    try {
      return await vendorsApi.getById(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: [],
    selectedVendor: null,
    statusFilter: 'ALL', // 'ALL', 'ACTIVE', 'PENDING', 'DEACTIVATED'
    searchQuery: '',
    loading: false,
    error: null,
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload;
    },
    clearSelectedVendor: (state) => {
      state.selectedVendor = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchVendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createVendor
      .addCase(createVendor.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // updateVendor
      .addCase(updateVendor.fulfilled, (state, action) => {
        const matchId = action.payload.id || action.payload._id;
        const index = state.items.findIndex((v) => v.id === matchId || v._id === matchId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        if (state.selectedVendor && (state.selectedVendor.id === matchId || state.selectedVendor._id === matchId)) {
          state.selectedVendor = { ...state.selectedVendor, ...action.payload };
        }
      })
      // updateVendorStatus
      .addCase(updateVendorStatus.fulfilled, (state, action) => {
        const matchId = action.payload.id || action.payload._id;
        const index = state.items.findIndex((v) => v.id === matchId || v._id === matchId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        if (state.selectedVendor && (state.selectedVendor.id === matchId || state.selectedVendor._id === matchId)) {
          state.selectedVendor = { ...state.selectedVendor, ...action.payload };
        }
      })
      // fetchVendorById
      .addCase(fetchVendorById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVendor = action.payload;
        // Also update/insert in the items list
        const matchId = action.payload.id || action.payload._id;
        const index = state.items.findIndex((v) => v.id === matchId || v._id === matchId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(fetchVendorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setStatusFilter, setSearchQuery, setSelectedVendor, clearSelectedVendor } = vendorsSlice.actions;
export default vendorsSlice.reducer;
