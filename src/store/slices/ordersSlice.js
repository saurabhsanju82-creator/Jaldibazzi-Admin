import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersApi } from '../../services/api';

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      return await ordersApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await ordersApi.updateStatus(id, status);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    selectedOrder: null,
    statusFilter: 'ALL',
    searchQuery: '',
    loading: false,
    error: null,
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setOrderSearch: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedOrder && state.selectedOrder.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      });
  }
});

export const { setStatusFilter, setOrderSearch, setSelectedOrder, clearSelectedOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
