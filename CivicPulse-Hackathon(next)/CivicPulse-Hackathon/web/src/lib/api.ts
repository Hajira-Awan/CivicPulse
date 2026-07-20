const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("civicpulse_token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function apiGet<T = any>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: "GET" });
}

export function apiPost<T = any>(endpoint: string, body?: any): Promise<T> {
  return api<T>(endpoint, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function apiPatch<T = any>(endpoint: string, body?: any): Promise<T> {
  return api<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiDelete<T = any>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: "DELETE" });
}
