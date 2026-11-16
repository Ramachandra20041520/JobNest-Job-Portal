import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedJobs } from "../services/jobs";

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load published jobs from FastAPI
  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        const data = await getPublishedJobs();

        if (active) {
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load jobs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      active = false;
    };
  }, []);

  // Search by job title or company
  const query = search.trim().toLowerCase();

  const filteredJobs = jobs.filter((job) => {
    const title = (job.title || "").toLowerCase();
    const company = (job.company || "").toLowerCase();

    return title.includes(query) || company.includes(query);
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-red-700">
            Unable to load jobs
          </h2>

          <p className="mt-2 text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-8">
          <p className="mb-2 font-semibold text-blue-600">
            JOBNEST CAREERS
          </p>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Explore Jobs
          </h1>

          <p className="mt-3 text-gray-600">
            Find your next opportunity and take the next step in your career.
          </p>
        </header>

        {/* Search bar */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="job-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search by job title or company
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="job-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. Python Developer, Google..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Results heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Opportunities
          </h2>

          <p className="text-sm text-gray-500">
            {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "job" : "jobs"} found
          </p>
        </div>

        {/* Empty states */}
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              No published jobs yet
            </h3>

            <p className="mt-2 text-gray-500">
              Please check back later for new opportunities.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              No matching jobs found
            </h3>

            <p className="mt-2 text-gray-500">
              Try another job title or company name.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Show all jobs
            </button>
          </div>
        ) : (
          /* Job cards */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {job.title}
                    </h3>

                    <p className="mt-1 font-medium text-gray-600">
                      {job.company}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {job.employment_type}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">
                      Location:
                    </span>{" "}
                    {job.location || "Not specified"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-800">
                      Salary:
                    </span>{" "}
                    {job.salary_min == null && job.salary_max == null
                      ? "Not specified"
                      : `${
                          job.salary_min == null
                            ? "Not specified"
                            : `₹${Number(job.salary_min).toLocaleString("en-IN")}`
                        } – ${
                          job.salary_max == null
                            ? "Not specified"
                            : `₹${Number(job.salary_max).toLocaleString("en-IN")}`
                        }`}
                  </p>
                </div>

                {job.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-500">
                    {job.description}
                  </p>
                )}

                {/* Keep buttons at the bottom */}
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    View Details →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
