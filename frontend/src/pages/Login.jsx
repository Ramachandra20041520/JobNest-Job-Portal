
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/api";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Authenticate using FastAPI.
      await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Step 2: Verify the token and retrieve the user.
      const user = await getCurrentUser();

      // Step 3: Redirect according to the user's role.
      if (user.role === "candidate") {
        navigate("/candidate", { replace: true });
      } else if (user.role === "recruiter") {
        navigate("/recruiter", { replace: true });
      } else {
        logoutUser();
        setError("Your account has an unsupported role.");
      }
    } catch (err) {
      logoutUser();
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {/* Page heading */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-indigo-600">
          WELCOME BACK
        </p>

        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Sign in to JobNest
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sign in to continue your career journey.
        </p>
      </div>

      {/* Registration success message */}
      {location.state?.message && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {location.state.message}
        </div>
      )}

      {/* Login error message */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="text-sm font-semibold text-slate-700"
          >
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <span className="text-xs text-slate-400">
              Secure sign-in
            </span>
          </div>

          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`${inputClass} mt-0 pr-16`}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((visible) => !visible)
              }
              className="absolute inset-y-0 right-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      {/* Registration link */}
      <p className="mt-7 text-center text-sm text-slate-500">
        New to JobNest?{" "}
        <Link
          to="/register"
          className="font-bold text-indigo-600 hover:text-indigo-800"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
