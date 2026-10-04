import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and signal global loading
axiosClient.interceptors.request.use(
  (config) => {
    window.dispatchEvent(new Event('api:loading:start'));
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    window.dispatchEvent(new Event('api:loading:stop'));
    return Promise.reject(error);
  }
);

// Response interceptor for unified error handling & loader dismissal
axiosClient.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event('api:loading:stop'));
    return response;
  },
  (error) => {
    window.dispatchEvent(new Event('api:loading:stop'));
    if (error.response && error.response.status === 401) {
      // Clear client-side auth cache on invalid/expired session
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
