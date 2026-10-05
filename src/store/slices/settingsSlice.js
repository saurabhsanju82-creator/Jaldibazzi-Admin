import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../services/axiosClient';

export const fetchSettings = createAsyncThunk('settings/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosClient.get('/settings');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const saveSettings = createAsyncThunk('settings/save', async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosClient.put('/settings', payload);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { pageSize: 10, dateFormat: 'DD/MM/YYYY' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => ({ ...state, ...action.payload }))
      .addCase(saveSettings.fulfilled, (state, action) => ({ ...state, ...action.payload }));
  },
});

export default settingsSlice.reducer;
