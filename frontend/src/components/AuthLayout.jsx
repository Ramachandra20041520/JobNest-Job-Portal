
import { Link } from "react-router-dom";

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left branding panel */}
      <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-24 top-28 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <Link to="/login" className="relative flex w-fit items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-2xl font-extrabold text-indigo-700 shadow-lg">
            J
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            JobNest
          </span>
        </Link>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold tracking-[0.25em] text-indigo-200">
            YOUR NEXT CHAPTER STARTS HERE
          </p>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight xl:text-6xl">
            Find work that
            <span className="mt-2 block text-violet-300">
              moves you forward.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-indigo-100">
            Connect your skills with opportunities that match your ambition.
            Discover new possibilities and take your next career step.
          </p>

          <div className="mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex -space-x-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-indigo-800 bg-amber-100 font-bold text-amber-800">R</span>
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-indigo-800 bg-pink-100 font-bold text-pink-800">A</span>
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-indigo-800 bg-emerald-100 font-bold text-emerald-800">S</span>
            </div>
            <div>
              <p className="text-sm font-bold">Your future starts today.</p>
              <p className="mt-1 text-xs text-indigo-200">
                Take the next step in your career.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-indigo-200">
          © {new Date().getFullYear()} JobNest. Built for your next move.
        </p>
      </aside>

      {/* Right content */}
      <section className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-14 xl:px-24">
        <Link to="/login" className="mb-10 flex w-fit items-center gap-3 lg:hidden">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl font-extrabold text-white">
            J
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            JobNest
          </span>
        </Link>

        <div className="mx-auto my-auto w-full max-w-md">
          {children}

          <p className="mt-8 text-center text-xs leading-6 text-slate-400">
            By continuing, you agree to our{" "}
            <a href="#terms" className="underline hover:text-indigo-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="underline hover:text-indigo-600">
              Privacy Policy
            </a>.
          </p>
        </div>
      </section>
    </main>
  );
}
