import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Fired when the session can no longer be refreshed; AuthProvider listens and logs the user out. */
export const AUTH_EXPIRED_EVENT = "auth:expired";

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<{ accessToken: string }>(
    `${api.defaults.baseURL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  setAccessToken(res.data.accessToken);
  return res.data.accessToken;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = config?.url?.includes("/auth/login") || config?.url?.includes("/auth/register");

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? fallback;
  }
  return fallback;
}
