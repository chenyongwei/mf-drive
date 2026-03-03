import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  withCredentials: true,
});

export const apiClient = api;

api.interceptors.request.use(
  (config) => {
    const searchParams = new URLSearchParams(window.location.search);
    const testParam = searchParams.get('test');

    if (testParam === 'true') {
      config.params = {
        ...config.params,
        test: 'true',
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const runtime = window as unknown as {
        __MF_SKIP_LOCAL_LOGIN__?: boolean;
      };
      const skipLocalLogin = runtime.__MF_SKIP_LOCAL_LOGIN__ === true;
      try {
        localStorage.removeItem('auth-storage');
      } catch {
        // Ignore storage access failures.
      }
      if (!skipLocalLogin && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      // Permission denied, keep silent.
    }

    return Promise.reject(error);
  }
);

export default api;
