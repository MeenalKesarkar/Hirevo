import { useState, type FormEvent } from "react";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { signUp } from "../services/api";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setStatus("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    try {
      await signUp({
        name,
        email,
        password,
      });
      navigate("/login", { replace: true, state: { signupSuccess: true, signupEmail: email } });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5 py-6 text-lav-900 sm:px-8 sm:py-8">
      <div className="login-photo" aria-hidden="true" />
      <section className="login-content relative z-10 w-full max-w-[460px]">
        <header className="mb-5 flex items-center justify-center gap-3 text-center">
          <HirevoMark />
          <div className="flex items-baseline font-display text-[30px] font-semibold tracking-tight text-lav-900">
            Hirevo<span className="text-lav-500">.</span>
          </div>
        </header>

        <div className="mb-5 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-lav-500">Your next chapter starts here</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-lav-900 sm:text-4xl">Create your account</h1>
          <p className="mt-2 text-sm text-lav-700">Join Hirevo and make your next move.</p>
        </div>

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-lav-900">Full name</span>
            <input autoComplete="name" className={inputClass} maxLength={100} minLength={2} name="name" placeholder="Your name" required type="text" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-lav-900">Email address</span>
            <input autoComplete="email" className={inputClass} maxLength={254} name="email" placeholder="you@example.com" required type="email" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-lav-900">Password</span>
            <span className="relative block">
              <input autoComplete="new-password" className={`${inputClass} pr-12`} maxLength={72} minLength={8} name="password" placeholder="At least 8 characters" required type={showPassword ? "text" : "password"} />
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-lav-900">Confirm password</span>
            <input autoComplete="new-password" className={inputClass} maxLength={72} minLength={8} name="confirmPassword" placeholder="Enter your password again" required type={showPassword ? "text" : "password"} />
          </label>

          <button
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-lav-900 px-5 py-3.5 text-sm font-semibold text-lav-50 shadow-lg shadow-lav-900/15 transition hover:-translate-y-0.5 hover:bg-lav-700 focus:outline-none focus:ring-4 focus:ring-lav-200 disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account…" : "Create account"} {!isSubmitting && <MoveRight className="transition-transform group-hover:translate-x-1" size={17} />}
          </button>

          {status && <p aria-live="polite" className="text-center text-xs text-rose-700">{status}</p>}
          <p className="pt-1 text-center text-sm text-lav-700">
            Already have an account? <Link className="font-semibold text-lav-500 hover:text-lav-900" to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-[#D7CDED] bg-white/90 px-4 py-3 text-[15px] text-lav-900 outline-none transition placeholder:text-[#978DAF] focus:border-lav-500 focus:ring-4 focus:ring-lav-200/50";

function HirevoMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" rx="28" fill="#351A2E" />
      <path d="M38 48H58" fill="none" stroke="#FFF9ED" strokeWidth="6" strokeLinecap="round" />
      <circle cx="30" cy="48" r="12" fill="#FFF9ED" />
      <circle cx="66" cy="48" r="12" fill="#D7B9AD" />
    </svg>
  );
}
