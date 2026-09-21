import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined;

    if (
      typeof window === "undefined" ||
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem("refresh_token");

    if (refreshToken) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const newAccessToken = response.data.access;

        localStorage.setItem("access_token", newAccessToken);
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    } else {
      localStorage.removeItem("access_token");
    }

    delete originalRequest.headers.Authorization;

    // Public endpoints can now succeed without the expired token.
    // Protected endpoints will correctly return 401 once more.
    return api(originalRequest);
  },
);

export default api;