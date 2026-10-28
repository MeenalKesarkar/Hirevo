import { useState, type FormEvent } from "react";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { signIn } from "../services/api";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: { pathname?: string }; signupSuccess?: boolean; signupEmail?: string } | null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""), rememberMe);
      const from = routeState?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5 py-6 text-lav-900 sm:px-8 sm:py-8">
      <div className="login-photo" aria-hidden="true" />

      <section className="login-content relative z-10 w-full max-w-[430px]">
        <header className="mb-6 flex items-center justify-center gap-3 text-center">
          <HirevoMark />
          <div className="flex items-baseline font-display text-[30px] font-semibold tracking-tight text-lav-900">
            Hirevo<span className="text-lav-500">.</span>
          </div>
        </header>

        <div className="mb-5 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-lav-900 sm:text-4xl">
            Welcome back
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-lav-900">Email address</span>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-[#D7CDED] bg-white/90 px-4 py-3.5 text-[15px] text-lav-900 outline-none transition placeholder:text-[#978DAF] focus:border-lav-500 focus:ring-4 focus:ring-lav-200/50"
              name="email"
              defaultValue={routeState?.signupEmail ?? ""}
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-lav-900">Password</span>
            <span className="relative block">
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-[#D7CDED] bg-white/90 px-4 py-3.5 pr-12 text-[15px] text-lav-900 outline-none transition placeholder:text-[#978DAF] focus:border-lav-500 focus:ring-4 focus:ring-lav-200/50"
                name="password"
                placeholder="Enter your password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lav-700 transition hover:text-lav-900"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <label className="flex items-center gap-2.5 text-lav-700">
              <input checked={rememberMe} className="h-4 w-4 accent-[#5B45B0]" onChange={(event) => setRememberMe(event.target.checked)} type="checkbox" />
              Remember me
            </label>
            <button
              className="font-semibold text-lav-500 transition hover:text-lav-900"
              onClick={() => setStatus("Password recovery can be connected with the authentication API.")}
              type="button"
            >
              Forgot password?
            </button>
          </div>

          <button
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-lav-900 px-5 py-3.5 text-sm font-semibold text-lav-50 shadow-lg shadow-lav-900/15 transition hover:-translate-y-0.5 hover:bg-lav-700 focus:outline-none focus:ring-4 focus:ring-lav-200 disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"} {!isSubmitting && <MoveRight className="transition-transform group-hover:translate-x-1" size={17} />}
          </button>

          <div className="flex items-center gap-4 py-1" aria-hidden="true">
            <span className="h-px flex-1 bg-[#DCD3F8]" />
            <span className="text-xs text-lav-700">or</span>
            <span className="h-px flex-1 bg-[#DCD3F8]" />
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D7CDED] bg-white/85 px-5 py-3.5 text-sm font-semibold text-lav-900 transition hover:border-lav-500 hover:bg-white focus:outline-none focus:ring-4 focus:ring-lav-200/50"
            onClick={() => setStatus("Google sign-in will be available once authentication is configured.")}
            type="button"
          >
            <GoogleMark />
            Sign in with Google
          </button>
          <p className="text-center text-sm text-lav-700">
            New to Hirevo? <Link className="font-semibold text-lav-500 hover:text-lav-900" state={{ enterSignup: true }} to="/signup">Create an account</Link>
          </p>
          {routeState?.signupSuccess && <p aria-live="polite" className="text-center text-xs font-medium text-emerald-700">Your account is ready. Sign in to continue.</p>}
          {status && <p aria-live="polite" className="text-center text-xs text-lav-700">{status}</p>}
        </form>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
      <path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#4CAF50" d="M12.8 27.8a12 12 0 0 1 0-7.6V15H5.9a20 20 0 0 0 0 18l6.9-5.2Z" />
      <path fill="#1976D2" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9A19.6 19.6 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.2c1.6-4.7 6-8.1 11.2-8.1Z" />
    </svg>
  );
}

function HirevoMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" rx="28" fill="#2A1A5E" />
      <path d="M38 48H58" fill="none" stroke="#F6F3FF" strokeWidth="6" strokeLinecap="round" />
      <circle cx="30" cy="48" r="12" fill="#F6F3FF" />
      <circle cx="66" cy="48" r="12" fill="#CBBDF4" />
    </svg>
  );
}
