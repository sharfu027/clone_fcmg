import { STORAGE_KEYS } from '../constants/app';

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type UnauthorizedHandler = () => void;

class ApiClient {
  private baseUrl: string;
  private onUnauthorizedHandler: UnauthorizedHandler | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
    this.baseUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || '';
  }

  /**
   * Register a global 401 Unauthorized handler (e.g. from AuthProvider).
   */
  public setOnUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.onUnauthorizedHandler = handler;
  }

  private getAuthHeaders(skipAuth = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (!skipAuth) {
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseUrl || window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private handleUnauthorized() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    if (this.onUnauthorizedHandler) {
      this.onUnauthorizedHandler();
    }
  }

  private async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { params, headers, skipAuth, ...customConfig } = options;

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...this.getAuthHeaders(skipAuth),
        ...headers
      }
    };

    const fullUrl = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(fullUrl, config);

      if (!response.ok) {
        // CENTRALIZED 401 UNAUTHORIZED INTERCEPTOR
        if (response.status === 401 && !skipAuth && !endpoint.includes('/api/v1/auth/login')) {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

          if (refreshToken && !this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshResponse = await fetch(this.buildUrl('/api/v1/auth/refresh'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });

              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const newToken = data.accessToken || data.token;
                if (newToken) {
                  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
                  if (data.refreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
                  }
                  this.isRefreshing = false;
                  this.onTokenRefreshed(newToken);

                  // Retry original request with new token
                  return this.request<T>(endpoint, options);
                }
              }
            } catch {
              // Refresh failed
            }
            this.isRefreshing = false;
          } else if (this.isRefreshing) {
            // Queue request until refresh finishes
            return new Promise<T>((resolve) => {
              this.addRefreshSubscriber(() => {
                resolve(this.request<T>(endpoint, options));
              });
            });
          }

          // Trigger centralized 401 handling if refresh not possible or failed
          this.handleUnauthorized();
        }

        let errorData: unknown;
        try {
          const text = await response.text();
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = text;
          }
        } catch {
          errorData = response.statusText;
        }

        let friendlyMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        if (typeof errorData === 'object' && errorData !== null) {
          const errObj = errorData as Record<string, any>;
          friendlyMessage = errObj.detail || errObj.message || errObj.error || errObj.title || friendlyMessage;
        } else if (typeof errorData === 'string' && errorData.trim().length > 0 && errorData.length < 200) {
          friendlyMessage = errorData;
        }

        throw new ApiError(
          friendlyMessage,
          response.status,
          errorData
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected network error occurred',
        0
      );
    }
  }

  public async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async postBlob(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<Blob> {
    const { params, headers, skipAuth, ...customConfig } = options || {};
    const config: RequestInit = {
      ...customConfig,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...this.getAuthHeaders(skipAuth),
        ...headers
      }
    };
    const fullUrl = this.buildUrl(endpoint, params);
    const response = await fetch(fullUrl, config);
    if (!response.ok) {
      throw new ApiError(`HTTP Error ${response.status}: ${response.statusText}`, response.status);
    }
    return await response.blob();
  }

  public async put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async patch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
