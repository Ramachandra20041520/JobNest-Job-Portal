
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createJob,
  deleteJob,
  getMyJobs,
  updateJob,
} from "../services/jobs";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  employment_type: "Full-time",
  salary_min: "",
  salary_max: "",
  description: "",
  requirements: "",
  status: "draft",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function formatSalary(job) {
  if (job.salary_min == null && job.salary_max == null) {
    return "Salary not specified";
  }

  const format = (value) =>
    value == null ? null : `₹${value.toLocaleString("en-IN")}`;

  if (job.salary_min == null) return `Up to ${format(job.salary_max)}`;
  if (job.salary_max == null) return `From ${format(job.salary_min)}`;

  return `${format(job.salary_min)} – ${format(job.salary_max)}`;
}

export default function RecruiterJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message);

      if (
        !localStorage.getItem("access_token") ||
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("log in")
      ) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEditing(job) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      employment_type: job.employment_type,
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
      description: job.description,
      requirements: job.requirements,
      status: job.status,
    });
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      form.salary_min !== "" &&
      form.salary_max !== "" &&
      Number(form.salary_min) > Number(form.salary_max)
    ) {
      setError("Minimum salary cannot exceed maximum salary.");
      return;
    }

    const payload = {
      ...form,
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateJob(editingId, payload);
        setMessage("Job updated successfully.");
      } else {
        await createJob(payload);
        setMessage("Job created successfully.");
      }

      resetForm();
      await loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(job) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteJob(job.id);

      if (editingId === job.id) {
        resetForm();
      }

      setJobs((previous) =>
        previous.filter((item) => item.id !== job.id)
      );

      setMessage("Job deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            to="/recruiter"
            className="text-2xl font-extrabold text-indigo-700"
          >
            JobNest
          </Link>

          <Link
            to="/recruiter"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-600">
            RECRUITER WORKSPACE
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Manage job postings
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Create listings and manage the jobs you have posted.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Create and edit form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId !== null ? "Edit job" : "Create a new job"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="title" className="text-sm font-semibold text-slate-700">
                  Job title *
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Python Developer"
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="text-sm font-semibold text-slate-700">
                    Company *
                  </label>
                  <input
                    id="company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Company name"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="text-sm font-semibold text-slate-700">
                    Location *
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Bhubaneswar / Remote"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="employment_type"
                  className="text-sm font-semibold text-slate-700"
                >
                  Employment type
                </label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={form.employment_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="salary_min" className="text-sm font-semibold text-slate-700">
                    Minimum salary (₹)
                  </label>
                  <input
                    id="salary_min"
                    name="salary_min"
                    type="number"
                    min="0"
                    step="1"
                    value={form.salary_min}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. 300000"
                  />
                </div>

                <div>
                  <label htmlFor="salary_max" className="text-sm font-semibold text-slate-700">
                    Maximum salary (₹)
                  </label>
                  <input
                    id="salary_max"
                    name="salary_max"
                    type="number"
                    min="0"
                    step="1"
                    value={form.salary_max}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. 600000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Job description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={inputClass}
                  rows={5}
                  minLength={20}
                  placeholder="Describe the role and responsibilities..."
                  required
                />
              </div>

              <div>
                <label htmlFor="requirements" className="text-sm font-semibold text-slate-700">
                  Requirements *
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  className={inputClass}
                  rows={4}
                  minLength={5}
                  placeholder="List the required skills and qualifications..."
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="text-sm font-semibold text-slate-700">
                  Publication status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save changes"
                      : "Create job"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Current recruiter's jobs */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Your job postings
              </h2>

              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                {jobs.length} jobs
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
                Loading job postings...
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="text-4xl">📋</div>
                <h3 className="mt-4 font-bold text-slate-900">
                  No jobs posted yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill out the form to create your first job listing.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-slate-900">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-indigo-600">
                          {job.company}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          job.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : job.status === "closed"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>📍 {job.location}</span>
                      <span>💼 {job.employment_type}</span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      {formatSalary(job)}
                    </p>

                    <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-500">
                      {job.description}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      Posted:{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => startEditing(job)}
                        className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(job)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
