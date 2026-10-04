import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi } from '../../services/api';

export const fetchAdminMetrics = createAsyncThunk(
  'analytics/fetchAdminMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await analyticsApi.getSuperAdminSummary();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    summary: null,
    dateRange: '30D', // '7D', '30D', '90D', 'YTD'
    loading: false,
    error: null,
  },
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMetrics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAdminMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setDateRange } = analyticsSlice.actions;
export default analyticsSlice.reducer;
