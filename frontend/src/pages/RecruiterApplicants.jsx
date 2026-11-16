import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STATUSES = ["submitted", "shortlisted", "rejected", "hired"];

export default function RecruiterApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function loadApplicants() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/applications/recruiter`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load applicants.");
      }

      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplicants();
    // loadApplicants uses the current router navigation function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(applicationId, newStatus) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setUpdatingId(applicationId);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_URL}/applications/${applicationId}/status?new_status=${encodeURIComponent(newStatus)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update application status.");
      }

      setApplicants((current) =>
        current.map((applicant) =>
          applicant.id === applicationId
            ? { ...applicant, status: data.status || newStatus }
            : applicant
        )
      );

      setMessage("Application status updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function downloadResume(applicationId, candidateName) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setDownloadingId(applicationId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/applications/recruiter/${applicationId}/resume`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        let detail = "Failed to download resume.";
        try {
          const data = await response.json();
          detail = data.detail || detail;
        } catch {
          // The server may return a non-JSON error response.
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (candidateName || "candidate")
        .trim()
        .replace(/[^a-z0-9_-]+/gi, "_");

      link.href = objectUrl;
      link.download = `${safeName}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      setMessage("Resume downloaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to download resume.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-slate-500">Loading applicants...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              RECRUITER WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Applicants
            </h1>
            <p className="mt-2 text-slate-500">
              Review applicants, candidate profiles, resumes, and application status.
            </p>
          </div>

          <Link
            to="/recruiter"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
          >
            {message}
          </div>
        )}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total applications</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {applicants.length}
          </p>
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="text-4xl">📄</div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No applicants yet
            </h2>
            <p className="mt-2 text-slate-500">
              Applications for your published jobs will appear here.
            </p>
            <Link
              to="/recruiter/jobs"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
            >
              Manage Jobs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Candidate profile</th>
                  <th className="px-5 py-4">Job</th>
                  <th className="px-5 py-4">Applied on</th>
                  <th className="px-5 py-4">Cover letter / Resume</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="align-top hover:bg-slate-50">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {applicant.candidate_name || "Unknown candidate"}
                      </p>
                      <p className="mt-1 break-all text-slate-500">
                        {applicant.candidate_email || "No email"}
                      </p>

                      <div className="mt-3 space-y-1 text-slate-600">
                        <p>
                          <span className="font-medium text-slate-700">Phone:</span>{" "}
                          {applicant.phone || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Location:</span>{" "}
                          {applicant.candidate_location || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Education:</span>{" "}
                          {applicant.education || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Skills:</span>{" "}
                          {applicant.skills || "Not provided"}
                        </p>
                        {applicant.bio && (
                          <p className="whitespace-pre-wrap break-words">
                            <span className="font-medium text-slate-700">Bio:</span>{" "}
                            {applicant.bio}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/recruiter/applicants/${applicant.id}`}
                        className="mt-3 inline-block font-semibold text-indigo-600 hover:underline"
                      >
                        View Application Details →
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {applicant.job_title || "Untitled job"}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {applicant.company || "Company not specified"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {applicant.applied_at
                        ? new Date(applicant.applied_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="whitespace-pre-wrap break-words text-slate-600">
                        {applicant.cover_letter || "No cover letter provided"}
                      </p>

                      {applicant.has_resume ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadResume(
                              applicant.id,
                              applicant.candidate_name
                            )
                          }
                          disabled={downloadingId === applicant.id}
                          className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-50"
                        >
                          {downloadingId === applicant.id
                            ? "Downloading..."
                            : "Download Resume"}
                        </button>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">
                          No profile resume uploaded
                        </p>
                      )}

                      {applicant.resume_url && (
                        <p className="mt-2 text-xs text-slate-500">
                          An older application resume link is available in the application record.
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        aria-label={`Status for ${applicant.candidate_name || "applicant"}`}
                        value={applicant.status || "submitted"}
                        disabled={updatingId === applicant.id}
                        onChange={(event) =>
                          updateStatus(applicant.id, event.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 capitalize outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-50"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingId === applicant.id && (
                        <p className="mt-2 text-xs text-slate-500">
                          Updating status...
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
