import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { slidersApi } from '../../services/api';

export const fetchSliders = createAsyncThunk(
  'sliders/fetchSliders',
  async (_, { rejectWithValue }) => {
    try {
      return await slidersApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch sliders');
    }
  }
);

export const createNewSlider = createAsyncThunk(
  'sliders/createNewSlider',
  async (sliderData, { rejectWithValue }) => {
    try {
      return await slidersApi.create(sliderData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create slider');
    }
  }
);

export const updateExistingSlider = createAsyncThunk(
  'sliders/updateExistingSlider',
  async ({ id, sliderData }, { rejectWithValue }) => {
    try {
      return await slidersApi.update(id, sliderData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update slider');
    }
  }
);

export const deleteExistingSlider = createAsyncThunk(
  'sliders/deleteExistingSlider',
  async (id, { rejectWithValue }) => {
    try {
      await slidersApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete slider');
    }
  }
);

const slidersSlice = createSlice({
  name: 'sliders',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSliderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSliders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSliders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSliders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewSlider.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateExistingSlider.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (s) => s.id === action.payload.id || s._id === action.payload._id || s._id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(deleteExistingSlider.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (s) => s.id !== action.payload && s._id !== action.payload
        );
      });
  },
});

export const { clearSliderError } = slidersSlice.actions;
export default slidersSlice.reducer;
