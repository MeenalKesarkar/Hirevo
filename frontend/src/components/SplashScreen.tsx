import type { CSSProperties } from "react";

const WORD = "Hirevo".split("");
const ROLES = ["Developers", "Designers", "Analysts", "Founders", "Developers"];
const DESKTOP_COPY = "Find meaningful work, build your network, and create what comes next.".split(" ");

const MEMBERS = [
  { initials: "AM", style: "bg-lav-50 text-lav-900" },
  { initials: "SI", style: "bg-lav-100 text-lav-900" },
  { initials: "RD", style: "bg-lav-200 text-lav-900" },
  { initials: "NK", style: "bg-lav-50 text-lav-900" },
  { initials: "+", style: "bg-lav-900 text-lav-50" },
] as const;

const delay = (seconds: number): CSSProperties => ({
  animationDelay: `${seconds}s`,
});

function HirevoMark() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 96 96"
      role="img"
      aria-label="Hirevo mark: two linked nodes"
    >
      <rect width="96" height="96" rx="28" fill="#2A1A5E" />
      <path
        d="M38 48H58"
        fill="none"
        stroke="#F6F3FF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="30" cy="48" r="12" fill="#F6F3FF" />
      <circle cx="66" cy="48" r="12" fill="#CBBDF4" />
    </svg>
  );
}

export default function SplashScreen() {
  return (
    <main className="splash-screen relative h-full min-h-[520px] w-full overflow-hidden bg-lav-100 font-sans text-lav-900">
      <div className="splash-brand-block absolute left-7 top-[9%] flex animate-mark items-center gap-2.5 motion-reduce:animate-none">
        <HirevoMark />
        <span className="animate-fade text-[13px] text-lav-700 motion-reduce:animate-none">
          Professional network
        </span>
      </div>

      <h1
        aria-label="Hirevo"
        className="splash-wordmark absolute left-6 top-[24%] w-[calc(100%-3rem)] whitespace-nowrap font-display text-[clamp(68px,26vw,104px)] font-semibold leading-[1.05] tracking-[-0.03em]"
      >
        {WORD.map((char, index) => (
          <span
            key={`${char}-${index}`}
            aria-hidden="true"
            className="inline-block overflow-hidden pb-3 align-top"
          >
            <span
              className="inline-block animate-letter motion-reduce:animate-none"
              style={delay(index * 0.07)}
            >
              {char}
            </span>
          </span>
        ))}
      </h1>

      <p className="splash-desktop-copy absolute hidden">
        {DESKTOP_COPY.map((word, index) => (
          <span
            key={`${word}-${index}`}
            aria-hidden="true"
            className="splash-copy-word"
            style={delay(index * 0.055)}
          >
            {word}{index < DESKTOP_COPY.length - 1 ? " " : ""}
          </span>
        ))}
        <span className="sr-only">
          Find meaningful work, build your network, and create what comes next.
        </span>
      </p>

      <section className="splash-band absolute bottom-0 left-0 h-[39%] min-h-[270px] w-full animate-band overflow-hidden rounded-t-[32px] bg-lav-500 motion-reduce:animate-none">
        <p className="splash-band-label absolute left-7 top-[13%] animate-fade text-[15px] text-lav-150 motion-reduce:animate-none">
          Connect with
        </p>

        <div
          className="splash-role-window absolute left-7 top-[23%] h-11 overflow-hidden"
          aria-hidden="true"
        >
          <div className="splash-role-list animate-roll font-display text-[clamp(30px,10vw,38px)] font-semibold leading-[44px] text-lav-50 motion-reduce:animate-none">
            {ROLES.map((role, index) => (
              <div key={`${role}-${index}`}>{role}</div>
            ))}
          </div>
        </div>
        <span className="sr-only">Developers, Designers, Analysts, Founders</span>

        <p className="splash-band-copy absolute left-7 top-[43%] w-[min(300px,calc(100%-3.5rem))] animate-fade text-[15px] leading-normal text-lav-150 motion-reduce:animate-none">
          Build a profile, grow real connections, and start the conversation.
        </p>

        <div
          role="status"
          aria-label="Loading"
          className="splash-members absolute bottom-[10%] left-[38px] flex animate-fade items-center motion-reduce:animate-none"
        >
          {MEMBERS.map((member, index) => (
            <div
              key={member.initials}
              aria-hidden="true"
              style={delay(index * 0.25)}
              className={`-ml-2.5 flex h-10 w-10 animate-pop items-center justify-center rounded-full border-2 border-lav-500 text-xs font-bold motion-reduce:animate-none ${member.style}`}
            >
              {member.initials}
            </div>
          ))}
          <span className="ml-3.5 whitespace-nowrap text-[13px] text-lav-150">
            Joining your network
          </span>
        </div>
      </section>
    </main>
  );
}
