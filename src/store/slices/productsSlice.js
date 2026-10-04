import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsApi } from '../../services/api';

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAllProducts',
  async (_, { rejectWithValue }) => {
    try {
      return await productsApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProductStatus = createAsyncThunk(
  'products/updateProductStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await productsApi.updateStatus(id, status);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    vendorFilter: 'ALL',
    stockFilter: 'ALL', // 'ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
    searchQuery: '',
    loading: false,
    error: null,
  },
  reducers: {
    setVendorFilter: (state, action) => {
      state.vendorFilter = action.payload;
    },
    setStockFilter: (state, action) => {
      state.stockFilter = action.payload;
    },
    setProductSearch: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const {
  setVendorFilter,
  setStockFilter,
  setProductSearch,
  setSelectedProduct,
  clearSelectedProduct
} = productsSlice.actions;
export default productsSlice.reducer;
