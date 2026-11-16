import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const metricCards = [
  {
    key: "total_jobs",
    label: "Total jobs",
    description: "Jobs created by you",
    color: "border-indigo-200 bg-indigo-50",
    valueColor: "text-indigo-700",
  },
  {
    key: "published_jobs",
    label: "Published jobs",
    description: "Jobs visible to candidates",
    color: "border-emerald-200 bg-emerald-50",
    valueColor: "text-emerald-700",
  },
  {
    key: "total_applications",
    label: "Total applications",
    description: "Applications across your jobs",
    color: "border-sky-200 bg-sky-50",
    valueColor: "text-sky-700",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    description: "Candidates moved forward",
    color: "border-amber-200 bg-amber-50",
    valueColor: "text-amber-700",
  },
];

const statusItems = [
  { key: "submitted", label: "Submitted", color: "bg-slate-400" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-amber-500" },
  { key: "rejected", label: "Rejected", color: "bg-rose-500" },
  { key: "hired", label: "Hired", color: "bg-emerald-500" },
];

export default function RecruiterAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/analytics/recruiter/dashboard`,
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
        throw new Error(data.detail || "Could not load dashboard analytics.");
      }

      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Could not load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    // Load once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Loading dashboard analytics...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Dashboard analytics
        </h2>
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={loadAnalytics}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </section>
    );
  }

  const totalApplications = Number(analytics?.total_applications || 0);
  const statuses = statusItems.map((item) => ({
    ...item,
    count: Number(analytics?.[item.key] || 0),
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Recruiter overview
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
            Dashboard analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Live counts from your jobs and applications.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.key}
            className={`rounded-2xl border p-5 shadow-sm ${card.color}`}
          >
            <p className="text-sm font-semibold text-slate-600">
              {card.label}
            </p>
            <p className={`mt-3 text-4xl font-extrabold ${card.valueColor}`}>
              {Number(analytics?.[card.key] || 0)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Application status breakdown
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Status counts for applications to your jobs.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {totalApplications} total
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {statuses.map((item) => {
            const percentage =
              totalApplications > 0
                ? Math.min(100, (item.count / totalApplications) * 100)
                : 0;

            return (
              <div key={item.key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {item.count}{" "}
                    <span className="font-normal text-slate-500">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${item.label} applications`}
                  aria-valuemin={0}
                  aria-valuemax={totalApplications || 1}
                  aria-valuenow={item.count}
                >
                  <div
                    className={`h-full rounded-full transition-all ${item.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {totalApplications === 0 && (
          <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            You haven't received applications yet. Publish a job to get started.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/recruiter/jobs"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Manage Jobs
          </Link>
          <Link
            to="/recruiter/applicants"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Applicants
          </Link>
        </div>
      </div>
    </section>
  );
}
