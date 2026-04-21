import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach token automatically
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('flashdeck_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (e) {}
  return config;
});

// Global 401 handling — boot the user
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('flashdeck_user');
      if (!window.location.pathname.startsWith('/signin') &&
          !window.location.pathname.startsWith('/signup') &&
          window.location.pathname !== '/') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
