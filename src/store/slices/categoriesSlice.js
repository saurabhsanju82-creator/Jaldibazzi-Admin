import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesApi } from '../../services/api';

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await categoriesApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch categories');
    }
  }
);

export const createNewCategory = createAsyncThunk(
  'categories/createNewCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      return await categoriesApi.create(categoryData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create category');
    }
  }
);

export const updateExistingCategory = createAsyncThunk(
  'categories/updateExistingCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      return await categoriesApi.update(id, categoryData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update category');
    }
  }
);

export const deleteExistingCategory = createAsyncThunk(
  'categories/deleteExistingCategory',
  async (id, { rejectWithValue }) => {
    try {
      await categoriesApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete category');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create category
      .addCase(createNewCategory.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // Update category
      .addCase(updateExistingCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (c) => c.id === action.payload.id || c._id === action.payload._id || c._id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })

      // Delete category
      .addCase(deleteExistingCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (c) => c.id !== action.payload && c._id !== action.payload
        );
      });
  },
});

export const { clearCategoryError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
