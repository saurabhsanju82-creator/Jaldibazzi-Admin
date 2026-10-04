import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/api';

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.loginSuperAdmin(email, password);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async () => {
    await authApi.logout();
    return true;
  }
);

export const checkAdminAuth = createAsyncThunk(
  'auth/checkAdminAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (err) {
      return rejectWithValue(err.message || 'Auth check failed');
    }
  }
);

const storedToken = localStorage.getItem('auth_token');
const storedUser = localStorage.getItem('auth_user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    initializing: !!storedToken, // if token exists, we verify it first
    loading: false,
    error: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUnauthenticated: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.initializing = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login Admin
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || action.payload;
        state.token = action.payload.token || localStorage.getItem('auth_token');
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout Admin
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.initializing = false;
        state.error = null;
      })
      // Check Admin Auth
      .addCase(checkAdminAuth.pending, (state) => {
        state.initializing = true;
      })
      .addCase(checkAdminAuth.fulfilled, (state, action) => {
        state.initializing = false;
        if (action.payload && action.payload.role === 'admin') {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAdminAuth.rejected, (state) => {
        state.initializing = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  }
});

export const { clearAuthError, setUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
