
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { registerUser } from "../services/api";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully! Please sign in.",
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-indigo-600">
          GET STARTED — IT'S FREE
        </p>

        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Create your account
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Join JobNest and take the next step in your career.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={inputClass}
            autoComplete="name"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
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

        <div>
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={`${inputClass} mt-0 pr-16`}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="role" className="text-sm font-semibold text-slate-700">
            I want to join as
          </label>

          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="candidate">Job seeker / Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
