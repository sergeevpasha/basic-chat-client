import { getApiUrl } from './echo';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = getApiUrl(endpoint);
  if (options.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body && config.method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', params });
}

export function post<T>(endpoint: string, body?: any, params?: Record<string, string>): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body, params });
}

export function put<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'PUT', body });
}

export function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

export default {
  get,
  post,
  put,
  delete: del,
};
