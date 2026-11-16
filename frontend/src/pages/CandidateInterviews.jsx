import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const response = await fetch(`${API_URL}/interviews/candidate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(data.detail || "Could not load interviews.");
        setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Could not load interviews.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Interviews</h1>
          <p className="mt-1 text-slate-600">View interview schedules shared by recruiters.</p>
        </div>
        <Link to="/candidate" className="rounded-lg border px-4 py-2 hover:bg-slate-50">Back to dashboard</Link>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {loading ? <p>Loading interviews...</p> : interviews.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-slate-600">
          No interviews scheduled yet. When a recruiter schedules one for your application, it will appear here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Interview #{item.id}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{item.status}</span>
              </div>
              <p className="text-sm text-slate-600">Application #{item.application_id}</p>
              <p className="mt-3 font-medium">{new Date(item.scheduled_at + (item.scheduled_at.endsWith("Z") ? "" : "Z")).toLocaleString()}</p>
              <p className="text-sm text-slate-600">{item.duration_minutes} minutes · {item.interview_type.replace("_", " ")}</p>
              {item.meeting_link && <p className="mt-3"><a className="break-all text-indigo-700 underline" href={item.meeting_link} target="_blank" rel="noreferrer">Join interview</a></p>}
              {item.location && <p className="mt-3">Location: {item.location}</p>}
              {item.notes && <div className="mt-3"><p className="text-sm font-semibold">Recruiter notes</p><p className="whitespace-pre-wrap text-sm text-slate-700">{item.notes}</p></div>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
