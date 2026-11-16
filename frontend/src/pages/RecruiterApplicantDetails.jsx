import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STATUSES = ["submitted", "shortlisted", "rejected", "hired"];

export default function RecruiterApplicantDetails() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/applications/recruiter/${applicationId}`,
          {
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
          throw new Error(data.detail || "Could not load candidate details.");
        }

        setApplicant(data);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [applicationId, navigate]);

  async function updateStatus(newStatus) {
    const token = localStorage.getItem("access_token");

    if (!token || !applicant) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

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
        throw new Error(data.detail || "Could not update application status.");
      }

      setApplicant((current) => ({
        ...current,
        status: data.status || newStatus,
      }));
      setMessage("Application status updated successfully.");
    } catch (err) {
      setError(err.message || "Could not update status.");
    } finally {
      setUpdating(false);
    }
  }

  async function downloadResume() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setDownloading(true);
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not download the resume.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (applicant?.candidate_name || "candidate")
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
      setError(err.message || "Could not download the resume.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-slate-500">Loading candidate details...</p>
      </main>
    );
  }

  if (!applicant) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8">
          <h1 className="text-xl font-bold text-slate-900">
            Candidate details unavailable
          </h1>
          <p className="mt-3 text-red-600">
            {error || "Application not found."}
          </p>
          <Link
            to="/recruiter/applicants"
            className="mt-6 inline-block font-semibold text-indigo-600 hover:underline"
          >
            ← Back to applicants
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/recruiter/applicants"
          className="font-semibold text-indigo-600 hover:underline"
        >
          ← Back to applicants
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-indigo-600">
            CANDIDATE PROFILE
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            {applicant.candidate_name || "Candidate"}
          </h1>
          <p className="mt-2 break-all text-slate-600">
            {applicant.candidate_email || "No email provided"}
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-green-700">
              {message}
            </div>
          )}

          <hr className="my-7 border-slate-200" />

          <h2 className="text-xl font-bold text-slate-900">
            Candidate information
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.phone || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Candidate location</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.candidate_location || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Education</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.education || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Skills</p>
              <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-900">
                {applicant.skills || "Not provided"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500">Bio</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">
                {applicant.bio || "No bio provided"}
              </p>
            </div>
          </div>

          <hr className="my-7 border-slate-200" />

          <h2 className="text-xl font-bold text-slate-900">
            Application details
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Applied for</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.job_title || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Company</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.company || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Job location</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.location || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Application date</p>
              <p className="mt-1 font-semibold text-slate-900">
                {applicant.applied_at
                  ? new Date(applicant.applied_at).toLocaleDateString("en-IN")
                  : "Not available"}
              </p>
            </div>
          </div>

          <hr className="my-7 border-slate-200" />

          <h2 className="text-xl font-bold text-slate-900">Cover letter</h2>
          <div className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
            {applicant.cover_letter || "The candidate did not provide a cover letter."}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-slate-900">Resume</h2>

            {applicant.has_resume ? (
              <button
                type="button"
                onClick={downloadResume}
                disabled={downloading}
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-50"
              >
                {downloading ? "Downloading resume..." : "Download Candidate Resume"}
              </button>
            ) : applicant.resume_url ? (
              <a
                href={applicant.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                View resume ↗
              </a>
            ) : (
              <p className="mt-3 text-slate-500">
                No resume has been uploaded by this candidate.
              </p>
            )}
          </div>

          <hr className="my-7 border-slate-200" />

          <h2 className="text-xl font-bold text-slate-900">
            Hiring decision
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Update the candidate's current application status.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              aria-label="Application status"
              value={applicant.status || "submitted"}
              disabled={updating}
              onChange={(event) => updateStatus(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 capitalize outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {updating && (
              <span className="text-sm text-slate-500">Updating...</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
