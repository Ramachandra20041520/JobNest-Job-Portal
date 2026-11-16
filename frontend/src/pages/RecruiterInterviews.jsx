
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const emptyForm = {
  application_id: "",
  scheduled_at: "",
  duration_minutes: 30,
  interview_type: "online",
  meeting_link: "",
  location: "",
  notes: "",
};

function getErrorMessage(detail, fallback = "Request failed.") {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        const message = item?.msg || item?.message;
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";

        if (message) return field ? `${field}: ${message}` : message;

        return JSON.stringify(item);
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return fallback;
}

export default function RecruiterInterviews() {
  const [form, setForm] = useState(emptyForm);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function request(path, options = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      throw new Error("Please log in again.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/login", { replace: true });
      throw new Error("Your session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(
        getErrorMessage(data.detail, `Request failed (${response.status}).`)
      );
    }

    return data;
  }

  async function loadInterviews() {
    try {
      setLoading(true);
      setError("");

      const data = await request("/interviews/recruiter");

      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load interviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeField(event) {
    const { name, value } = event.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function schedule(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const {
        application_id,
        scheduled_at,
        duration_minutes,
        interview_type,
        meeting_link,
        location,
        notes,
      } = form;

      if (!application_id || Number(application_id) < 1) {
        throw new Error("Enter a valid application ID.");
      }

      if (!scheduled_at) {
        throw new Error("Please select an interview date and time.");
      }

      // datetime-local represents the time in the recruiter's local timezone.
      const selectedDate = new Date(scheduled_at);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Please enter a valid interview date and time.");
      }

      if (selectedDate.getTime() <= Date.now()) {
        throw new Error("Please select a future interview date and time.");
      }

      if (interview_type === "online" && !meeting_link.trim()) {
        throw new Error("Enter a meeting link for an online interview.");
      }

      if (interview_type === "in_person" && !location.trim()) {
        throw new Error("Enter a location for an in-person interview.");
      }

      const payload = {
        scheduled_at: selectedDate.toISOString(),
        duration_minutes: Number(duration_minutes),
        interview_type,
        meeting_link:
          interview_type === "online" ? meeting_link.trim() : null,
        location:
          interview_type === "in_person" ? location.trim() : null,
        notes: notes.trim() || null,
      };

      await request(
        `/interviews/applications/${Number(application_id)}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setForm(emptyForm);
      setMessage("Interview scheduled successfully.");

      await loadInterviews();
    } catch (err) {
      console.error("Interview scheduling error:", err);
      setError(err.message || "Could not schedule interview.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(interviewId, status) {
    setError("");
    setMessage("");

    try {
      await request(`/interviews/${interviewId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(`Interview marked ${status}.`);
      await loadInterviews();
    } catch (err) {
      console.error("Interview update error:", err);
      setError(err.message || "Could not update interview.");
    }
  }

  async function cancelInterview(interviewId) {
    if (!window.confirm("Cancel this interview?")) return;

    await changeStatus(interviewId, "cancelled");
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    // Backend timestamps are treated as UTC when they lack a timezone.
    const normalized =
      typeof dateValue === "string" &&
      !/(Z|[+-]\d{2}:\d{2})$/i.test(dateValue)
        ? `${dateValue}Z`
        : dateValue;

    const date = new Date(normalized);

    return Number.isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Interview Scheduling
          </h1>
          <p className="mt-1 text-slate-600">
            Schedule and manage candidate interviews.
          </p>
        </div>

        <Link
          className="rounded-lg border px-4 py-2 hover:bg-slate-50"
          to="/recruiter"
        >
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-green-700"
        >
          {message}
        </div>
      )}

      <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Schedule an interview
        </h2>

        <p className="mb-4 text-sm text-slate-600">
          Enter the application ID shown in your recruiter applicant records.
        </p>

        <form onSubmit={schedule} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Application ID
            <input
              required
              min="1"
              type="number"
              name="application_id"
              value={form.application_id}
              onChange={changeField}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>

          <label className="text-sm font-medium">
            Date and time
            <input
              required
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={changeField}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>

          <label className="text-sm font-medium">
            Duration
            <select
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={changeField}
              className="mt-1 w-full rounded-lg border p-2.5"
            >
              {[15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Interview type
            <select
              name="interview_type"
              value={form.interview_type}
              onChange={changeField}
              className="mt-1 w-full rounded-lg border p-2.5"
            >
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </label>

          {form.interview_type === "online" ? (
            <label className="text-sm font-medium md:col-span-2">
              Meeting link
              <input
                required
                type="url"
                name="meeting_link"
                value={form.meeting_link}
                onChange={changeField}
                placeholder="https://meet.example.com/..."
                className="mt-1 w-full rounded-lg border p-2.5"
              />
            </label>
          ) : (
            <label className="text-sm font-medium md:col-span-2">
              Interview location
              <input
                required
                name="location"
                value={form.location}
                onChange={changeField}
                placeholder="Office address or meeting room"
                className="mt-1 w-full rounded-lg border p-2.5"
              />
            </label>
          )}

          <label className="text-sm font-medium md:col-span-2">
            Notes (optional)
            <textarea
              name="notes"
              rows="3"
              maxLength="5000"
              value={form.notes}
              onChange={changeField}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>

          <button
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 md:col-span-2"
          >
            {saving ? "Scheduling..." : "Schedule interview"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Scheduled interviews
          </h2>

          <button
            onClick={loadInterviews}
            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading interviews...</p>
        ) : interviews.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-slate-600">
            No interviews scheduled yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {interviews.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    Interview #{item.id}
                  </h3>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-600">
                  Application #{item.application_id}
                </p>

                <p className="mt-2">
                  {formatDate(item.scheduled_at)}
                </p>

                <p className="text-sm text-slate-600">
                  {item.duration_minutes} minutes ·{" "}
                  {item.interview_type.replace("_", " ")}
                </p>

                {item.meeting_link && (
                  <p className="mt-2 break-all">
                    <a
                      className="text-indigo-700 underline"
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open meeting link
                    </a>
                  </p>
                )}

                {item.location && (
                  <p className="mt-2">
                    Location: {item.location}
                  </p>
                )}

                {item.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {item.notes}
                  </p>
                )}

                {item.status !== "cancelled" &&
                  item.status !== "completed" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          changeStatus(item.id, "completed")
                        }
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Mark completed
                      </button>

                      <button
                        onClick={() => cancelInterview(item.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Cancel interview
                      </button>
                    </div>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
