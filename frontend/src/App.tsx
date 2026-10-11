
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Users,
} from "lucide-react";

const features = [
  {
    icon: BriefcaseBusiness,
    title: "Discover opportunities",
    description:
      "Find roles that match your skills, ambitions, and next career move.",
  },
  {
    icon: Users,
    title: "Build connections",
    description:
      "Meet professionals, share ideas, and grow your network meaningfully.",
  },
  {
    icon: Building2,
    title: "Meet great companies",
    description:
      "Explore organizations and discover where your talent can make a difference.",
  },
];

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FAF6EF] text-[#28202A]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="/" className="text-2xl font-bold tracking-tight text-[#351629]">
          hirevo<span className="text-[#B8849B]">.</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-[#756B76] md:flex">
          <a href="#opportunities" className="transition hover:text-[#351629]">
            Opportunities
          </a>
          <a href="#features" className="transition hover:text-[#351629]">
            Why Hirevo
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#351629] sm:inline-flex"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-[#351629] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4B2440]"
          >
            Get started <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <section
        id="opportunities"
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 md:pb-28 md:pt-20 lg:grid-cols-2 lg:px-10"
      >
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5DAD9] bg-white/70 px-4 py-2 text-sm text-[#756B76]">
            <span className="h-2 w-2 rounded-full bg-[#B8849B]" />
            Your next chapter starts here
          </span>

          <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Where talent meets{" "}
            <span className="italic text-[#8C536F]">opportunity.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-[#756B76] sm:text-lg">
            A place to discover meaningful work, build genuine professional
            connections, and grow into what comes next.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full bg-[#351629] px-6 py-4 font-semibold text-white transition hover:bg-[#4B2440]"
            >
              Find your next opportunity <ArrowRight size={18} />
            </a>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border border-[#E5DAD9] px-6 py-4 font-semibold text-[#351629] transition hover:bg-white"
            >
              Explore Hirevo
            </a>
          </div>

          <p className="mt-8 text-sm text-[#756B76]">
            Built for people, possibilities, and professional growth.
          </p>
        </div>

        <div className="relative mx-auto flex min-h-[360px] w-full max-w-xl items-center justify-center sm:min-h-[440px]">
          <div className="absolute h-72 w-72 rounded-full bg-[#EACFD5]/60 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute h-64 w-64 rounded-full border border-[#D8B7C5] sm:h-80 sm:w-80" />
          <div className="absolute h-52 w-52 rounded-full border border-[#D8B7C5]/70 sm:h-64 sm:w-64" />

          <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-[#351629] text-center text-white shadow-2xl shadow-[#351629]/20 sm:h-60 sm:w-60">
            <span className="text-4xl font-bold tracking-tight sm:text-5xl">
              hirevo<span className="text-[#EACFD5]">.</span>
            </span>
            <span className="mt-3 text-xs tracking-[0.2em] text-[#F4EBDD] sm:text-sm">
              FIND YOUR NEXT
            </span>
            <span className="mt-1 text-xs tracking-[0.2em] text-[#F4EBDD] sm:text-sm">
              POSSIBILITY
            </span>
          </div>

          <div className="absolute right-0 top-10 rounded-2xl border border-[#E5DAD9] bg-white/90 p-4 shadow-lg shadow-[#351629]/5 sm:right-2">
            <BriefcaseBusiness className="text-[#8C536F]" size={23} />
            <p className="mt-2 text-sm font-semibold">New opportunities</p>
            <p className="mt-1 text-xs text-[#756B76]">Your next move awaits</p>
          </div>

          <div className="absolute bottom-9 left-0 rounded-2xl border border-[#E5DAD9] bg-white/90 p-4 shadow-lg shadow-[#351629]/5 sm:left-2">
            <Users className="text-[#8C536F]" size={23} />
            <p className="mt-2 text-sm font-semibold">Real connections</p>
            <p className="mt-1 text-xs text-[#756B76]">Grow together</p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-[#E5DAD9] bg-white/50 px-6 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8C536F]">
            A better way to grow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            More than a job search.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-[#756B76]">
            Build your professional future with the right opportunities,
            people, and companies in one place.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-[#E5DAD9] bg-[#FAF6EF] p-7 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#351629]/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EACFD5]/50">
                  <Icon className="text-[#351629]" size={23} />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[#756B76]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5DAD9] px-6 py-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#756B76] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[#351629]">hirevo.</p>
          <p>Where talent meets opportunity.</p>
          <p>Made for what comes next.</p>
        </div>
      </footer>
    </main>
  );
}
