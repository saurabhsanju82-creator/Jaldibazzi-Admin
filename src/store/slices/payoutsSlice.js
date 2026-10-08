import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payoutsApi } from '../../services/api';

export const fetchPayouts = createAsyncThunk(
  'payouts/fetchPayouts',
  async (_, { rejectWithValue }) => {
    try {
      return await payoutsApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePayoutStatus = createAsyncThunk(
  'payouts/updatePayoutStatus',
  async ({ id, status, referenceNumber, notes, settledAt }, { rejectWithValue }) => {
    try {
      return await payoutsApi.updateStatus(id, { status, referenceNumber, notes, settledAt });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createPayout = createAsyncThunk(
  'payouts/createPayout',
  async (payoutData, { rejectWithValue }) => {
    try {
      return await payoutsApi.create(payoutData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const payoutsSlice = createSlice({
  name: 'payouts',
  initialState: {
    items: [],
    loading: false,
    error: null,
    statusTab: 'ALL', // 'ALL', 'PENDING', 'SETTLED'
    vendorFilter: 'ALL', // 'ALL' or specific vendorId
    searchQuery: '',
    selectedPayout: null,
  },
  reducers: {
    setStatusTab: (state, action) => {
      state.statusTab = action.payload;
    },
    setVendorFilter: (state, action) => {
      state.vendorFilter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedPayout: (state, action) => {
      state.selectedPayout = action.payload;
    },
    clearSelectedPayout: (state) => {
      state.selectedPayout = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchPayouts
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updatePayoutStatus
      .addCase(updatePayoutStatus.fulfilled, (state, action) => {
        const payloadId = action.payload.id || action.payload._id;
        const index = state.items.findIndex((p) => (p.id || p._id) === payloadId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedPayout && (state.selectedPayout.id || state.selectedPayout._id) === payloadId) {
          state.selectedPayout = action.payload;
        }
      })
      // createPayout
      .addCase(createPayout.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  }
});

export const {
  setStatusTab,
  setVendorFilter,
  setSearchQuery,
  setSelectedPayout,
  clearSelectedPayout
} = payoutsSlice.actions;

export default payoutsSlice.reducer;
