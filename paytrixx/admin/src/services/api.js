import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Request Interceptor (FIXED)
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("adminToken") ||
      localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor (SAFE VERSION)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔥 Only logout if token actually exists
    const hasToken =
      sessionStorage.getItem("adminToken") ||
      localStorage.getItem("adminToken");

    if (error.response?.status === 401 && hasToken) {
      console.log("401 Unauthorized - logging out");

      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminInfo");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");

      window.location.href = "/sign-in";
    }

    return Promise.reject(error);
  }
);

export default api;