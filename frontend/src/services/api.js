
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to FastAPI. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail || "Request failed.";

    throw new Error(message);
  }

  return data;
}

export function registerUser(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function loginUser(credentials) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (!data.access_token) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  localStorage.setItem("access_token", data.access_token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem("access_token");
}


export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in first.");
  }

  const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    localStorage.removeItem("access_token");
    throw new Error(data.detail || "Session expired. Please log in again.");
  }

  return data;
}
