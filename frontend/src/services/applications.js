
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function applyForJob(jobId, applicationData = {}) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_URL}/applications/jobs/${jobId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(applicationData),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to apply for job");
  }

  return data;
}

export async function getMyApplications() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/applications/mine`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load applications");
  }

  return data;
}
