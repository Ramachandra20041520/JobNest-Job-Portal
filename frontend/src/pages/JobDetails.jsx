
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { applyForJob } from "../services/applications";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadJob() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/jobs/${jobId}/public`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load job details.");
        }

        if (active) {
          setJob(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      active = false;
    };
  }, [jobId]);

  async function handleApply() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setApplying(true);
    setApplicationMessage("");
    setApplicationSuccess(false);

    try {
      await applyForJob(jobId, {
        resume_url: null,
        cover_letter: coverLetter.trim() || null,
      });

      setApplicationSuccess(true);
      setApplicationMessage("Your application was submitted successfully!");
    } catch (err) {
      setApplicationMessage(
        err.message || "Failed to submit your application."
      );
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <p className="p-6">Loading job details...</p>;
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error}</p>
        <Link to="/jobs" className="mt-4 inline-block text-indigo-600">
          Back to jobs
        </Link>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <Link to="/jobs" className="text-sm font-semibold text-indigo-600">
          ← Back to jobs
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          {job.title}
        </h1>

        <p className="mt-2 text-lg text-slate-600">{job.company}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-2">
            {job.location || "Location not specified"}
          </span>

          <span className="rounded-full bg-indigo-50 px-3 py-2 text-indigo-700">
            {job.employment_type || "Employment type not specified"}
          </span>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Salary</h2>
          <p className="mt-2 text-slate-600">
            {job.salary_min == null && job.salary_max == null
              ? "Not specified"
              : `${job.salary_min == null ? "Not specified" : `₹${Number(job.salary_min).toLocaleString("en-IN")}`} – ${job.salary_max == null ? "Not specified" : `₹${Number(job.salary_max).toLocaleString("en-IN")}`}`}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Job Description</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
            {job.description || "No description provided."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Requirements</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
            {job.requirements || "No requirements provided."}
          </p>
        </section>

        <section className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold">Apply for this job</h2>

          <label
            htmlFor="coverLetter"
            className="mt-4 block font-medium text-slate-700"
          >
            Cover Letter (optional)
          </label>

          <textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            rows={5}
            disabled={applying || applicationSuccess}
            placeholder="Explain why you are interested in this position..."
            className="mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          />

          <button
            type="button"
            onClick={handleApply}
            disabled={applying || applicationSuccess}
            className="mt-4 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {applying
              ? "Submitting application..."
              : applicationSuccess
                ? "Application Submitted"
                : "Apply for Job"}
          </button>

          {applicationMessage && (
            <p
              role="status"
              className={`mt-4 rounded-lg p-3 text-sm ${
                applicationSuccess
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {applicationMessage}
            </p>
          )}

          {applicationSuccess && (
            <Link
              to="/my-applications"
              className="mt-4 inline-block font-semibold text-indigo-600 hover:underline"
            >
              View My Applications →
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
