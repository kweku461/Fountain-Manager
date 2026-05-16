// API Utility functions

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse error as JSON, otherwise use plain text
      try {
        const errorJson = JSON.parse(errorText);
        return {
          ok: false,
          error: errorJson.message || errorJson.error || "An error occurred",
        };
      } catch {
        return { ok: false, error: errorText || "An error occurred" };
      }
    }

    // ✅ Handle both JSON and plain text success responses
    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  window.location.href = "/login";
}

// Clear expired tokens on app initialization
export function clearExpiredToken() {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Basic JWT expiration check (without full validation)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp && payload.exp < currentTime) {
        console.warn("Expired token found, clearing localStorage");
        logout();
      }
    } catch (error) {
      // If token is malformed, clear it
      console.warn("Invalid token found, clearing localStorage");
      logout();
    }
  }
}

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { API_URL };