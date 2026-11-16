
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../services/api";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const currentUser = await getCurrentUser();

        if (!active) return;

        if (currentUser.role !== "candidate") {
          navigate(
            currentUser.role === "recruiter"
              ? "/recruiter"
              : "/login",
            { replace: true }
          );
          return;
        }

        setUser(currentUser);

        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(
          `${API_URL}/candidate-profile/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load your profile completion."
          );
        }

        const profileData = await response.json();

        if (active) {
          setProfile(profileData);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load your account."
          );
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Calculate profile completion using six fields.
  const profileFields = [
    profile?.phone,
    profile?.location,
    profile?.education,
    profile?.skills,
    profile?.resume_url,
    profile?.bio,
  ];

  const completedFields = profileFields.filter(
    (field) =>
      typeof field === "string" &&
      field.trim().length > 0
  ).length;

  const completionPercentage = Math.round(
    (completedFields / profileFields.length) * 100
  );

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-slate-500">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            to="/candidate"
            className="text-2xl font-extrabold text-indigo-700"
          >
            JobNest
          </Link>

          <button
            type="button"
            onClick={() => {
              logoutUser();
              navigate("/login", { replace: true });
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* Welcome */}
        <p className="text-sm font-semibold text-indigo-600">
          CANDIDATE WORKSPACE
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
          Welcome, {user.name}!
        </h2>

        <p className="mt-3 text-slate-500">
          Your next career opportunity starts here.
        </p>

        {/* Profile completion */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Profile completion
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Complete your profile to highlight your qualifications.
              </p>
            </div>

            <span className="shrink-0 text-2xl font-extrabold text-indigo-700">
              {profile ? `${completionPercentage}%` : "—"}
            </span>
          </div>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              profile ? completionPercentage : 0
            }
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${
                  profile ? completionPercentage : 0
                }%`,
              }}
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {profile
              ? `${completedFields} of ${profileFields.length} fields completed`
              : "Profile completion is currently unavailable."}
          </p>

          <Link
            to="/candidate/profile"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {profile && completionPercentage === 100
              ? "Update Profile"
              : "Complete Profile →"}
          </Link>
        </section>

        {/* Browse jobs banner */}
        <section className="mt-8 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shadow-sm sm:p-8">
          <h3 className="text-2xl font-bold">
            Find your next opportunity
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
            Explore published jobs, search by job title or company,
            and discover opportunities that match your skills.
          </p>

          <Link
            to="/jobs"
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Search Jobs →
          </Link>
        </section>

        {/* Dashboard cards */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Find jobs */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-2xl">🔎</div>

            <h3 className="mt-4 text-lg font-bold">
              Find jobs
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Browse available opportunities and search by job title
              or company name.
            </p>

            <Link
              to="/jobs"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Browse Jobs →
            </Link>
          </div>

          {/* My applications */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-2xl">📄</div>

            <h3 className="mt-4 text-lg font-bold">
              My applications
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep track of the jobs you've applied for and their
              application status.
            </p>

            <Link
              to="/my-applications"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View Applications →
            </Link>
          </div>

          {/* My profile */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-2xl">👤</div>

            <h3 className="mt-4 text-lg font-bold">
              My profile
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your contact details, education, skills,
              professional summary, and resume.
            </p>

            <Link
              to="/candidate/profile"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Edit My Profile →
            </Link>
          </div>

          {/* My interviews - NEW */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-2xl">📅</div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              My interviews
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View your scheduled interviews, meeting links,
              interview locations, dates, and times.
            </p>

            <Link
              to="/candidate/interviews"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              View Interviews →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} JobNest. Your next opportunity starts here.
        </footer>
      </main>
    </div>
  );
}
