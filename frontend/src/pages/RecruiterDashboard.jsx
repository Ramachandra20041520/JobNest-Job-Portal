
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logoutUser,
} from "../services/api";
import RecruiterAnalytics from "../components/RecruiterAnalytics";

export default function RecruiterDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        if (!active) return;

        if (currentUser.role !== "recruiter") {
          navigate(
            currentUser.role === "candidate"
              ? "/candidate"
              : "/login",
            { replace: true }
          );
          return;
        }

        setUser(currentUser);
      } catch (err) {
        if (!active) return;

        setError(err.message || "Unable to load your account.");
        logoutUser();
        navigate("/login", { replace: true });
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [navigate]);

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            to="/recruiter"
            className="flex items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl font-extrabold text-white">
              J
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-indigo-700">
              JobNest
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">
                {user.name}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-7 text-white shadow-lg sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-200">
            RECRUITER WORKSPACE
          </p>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Welcome, {user.name}!
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
            Manage your hiring activities, publish opportunities, and
            connect with talented candidates through JobNest.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/recruiter/jobs"
              className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Manage job postings <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/recruiter/applicants"
              className="inline-flex items-center gap-3 rounded-xl border border-white/40 px-5 py-3 font-bold text-white transition hover:bg-white/10"
            >
              View applicants <span aria-hidden="true">→</span>
            </Link>

            {/* Interview Scheduling shortcut */}
            <Link
              to="/recruiter/interviews"
              className="inline-flex items-center gap-3 rounded-xl border border-white/40 px-5 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Schedule interviews <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Recruiter analytics */}
        <section className="mt-10">
          <RecruiterAnalytics />
        </section>

        {/* Dashboard cards */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Recruitment workspace
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose an area to continue working.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Job postings */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-2xl">
                📢
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Job postings
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create new job listings, edit existing posts, change
                publication status, and delete jobs.
              </p>

              <Link
                to="/recruiter/jobs"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
              >
                Open job management →
              </Link>
            </article>

            {/* Candidates */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-2xl">
                👥
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Candidates
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review applicants for your job postings, read cover
                letters, and update application statuses.
              </p>

              <Link
                to="/recruiter/applicants"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View Applicants →
              </Link>
            </article>

            {/* Hiring activity */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-2xl">
                📊
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Hiring activity
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Monitor application progress and review hiring decisions.
              </p>

              <Link
                to="/recruiter/applicants"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
              >
                Review applications →
              </Link>
            </article>

            {/* Interview Scheduling - NEW */}
            <article className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-2xl">
                📅
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Interview Scheduling
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Schedule interviews with applicants, reschedule meetings,
                and manage interview status.
              </p>

              <Link
                to="/recruiter/interviews"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Manage Interviews →
              </Link>
            </article>
          </div>
        </section>

        {/* Account information */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Account information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </p>
              <p className="mt-2 break-words font-semibold text-slate-900">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-2 break-words font-semibold text-slate-900">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </p>
              <p className="mt-2 font-semibold capitalize text-slate-900">
                {user.role}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account status
              </p>
              <p className="mt-2 font-semibold text-emerald-700">
                {user.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} JobNest. Recruiter workspace.
        </div>
      </footer>
    </div>
  );
}
