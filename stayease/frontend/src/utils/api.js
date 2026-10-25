
const API_BASE_URL = "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("stayease_admin_token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid server response. Check your backend.");
  }

  if (response.status === 401) {
    sessionStorage.removeItem("stayease_admin_token");
    sessionStorage.removeItem("stayease_admin_user");
    throw new Error(data.message || "Please log in again.");
  }

  if (response.status === 403) {
    throw new Error(data.message || "Admin access only.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
