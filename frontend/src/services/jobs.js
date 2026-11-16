
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function jobRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in before managing jobs.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot connect to the backend.");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail || "The job request failed.";

    throw new Error(message);
  }

  return data;
}

export function createJob(jobData) {
  return jobRequest("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

export function getMyJobs() {
  return jobRequest("/jobs/mine");
}

export function updateJob(jobId, jobData) {
  return jobRequest(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(jobData),
  });
}

export function deleteJob(jobId) {
  return jobRequest(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export async function getPublishedJobs() {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/jobs`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load jobs");
  }

  return data;
}