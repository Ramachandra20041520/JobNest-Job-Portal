
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyApplications } from "../services/applications";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      try {
        const data = await getMyApplications();

        if (active) {
          setApplications(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load applications.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="p-8">Loading your applications...</p>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              My Applications
            </h1>
            <p className="mt-2 text-slate-600">
              Track the jobs you have applied for.
            </p>
          </div>

          <Link
            to="/jobs"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Browse Jobs
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
            <button
              onClick={() => navigate("/login")}
              className="ml-3 font-semibold underline"
            >
              Go to Login
            </button>
          </div>
        )}

        {!error && applications.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">
              No applications yet
            </h2>
            <p className="mt-2 text-slate-600">
              Browse published jobs and apply for a position that suits you.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {application.job?.title || `Job #${application.job_id}`}
                  </h2>

                  <p className="mt-1 font-medium text-slate-600">
                    {application.job?.company || "Company not available"}
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold capitalize text-indigo-700">
                  {application.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span>
                  📍 {application.job?.location || "Location not specified"}
                </span>

                {application.job?.employment_type && (
                  <span>
                    💼 {application.job.employment_type}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Applied on:{" "}
                {new Date(application.applied_at).toLocaleDateString("en-IN")}
              </p>

              {application.cover_letter && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-indigo-600">
                    View cover letter
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-slate-600">
                    {application.cover_letter}
                  </p>
                </details>
              )}

              <Link
                to={`/jobs/${application.job_id}`}
                className="mt-5 inline-block font-semibold text-indigo-600 hover:underline"
              >
                View Job Details →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
