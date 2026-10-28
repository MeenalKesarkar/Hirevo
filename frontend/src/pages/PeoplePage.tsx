import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, MapPin, MessageCircle, Search, Users, UserRound, House } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { apiRequest, signOut } from "../services/api";
import "./PeoplePage.css";

type Person = {
  _id: string;
  name: string;
  role: "candidate" | "recruiter";
  headline?: string;
  location?: string;
  skills?: string[];
};

type RoleFilter = "all" | "candidate" | "recruiter";

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ people: Person[] }>("/api/auth/people?limit=50", { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setPeople(result.people); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "People could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, []);

  const visiblePeople = useMemo(() => {
    const search = query.trim().toLowerCase();
    return people.filter((person) => {
      const roleMatches = roleFilter === "all" || person.role === roleFilter;
      const textMatches = !search || [person.name, person.role, person.headline, person.location, ...(person.skills ?? [])]
        .filter(Boolean).join(" ").toLowerCase().includes(search);
      return roleMatches && textMatches;
    });
  }, [people, query, roleFilter]);

  const handleSignOut = async () => {
    try { await signOut(); } catch { /* The local session is cleared even when the API is unavailable. */ }
    navigate("/login", { replace: true, state: { signedOut: true } });
  };

  return (
    <div className="people-page">
      <header className="people-topbar">
        <Link className="people-brand" to="/" aria-label="Hirevo home"><span className="people-brand-mark"><i /><i /></span>Hirevo<span>.</span></Link>
        <div className="people-top-actions"><span>Community</span><button onClick={() => void handleSignOut()}>Sign out</button></div>
      </header>

      <main className="people-layout">
        <section className="people-intro">
          <span className="people-eyebrow">YOUR HIREVO COMMUNITY</span>
          <h1>Find your people.</h1>
          <p>Meet thoughtful people building, hiring, and figuring out what comes next.</p>
          <div className="people-search"><Search size={19} /><input aria-label="Search people" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, skill, or location" value={query} /><kbd>⌘ K</kbd></div>
        </section>

        <div className="people-content-heading"><div><span className="people-eyebrow">A COMMUNITY THAT MOVES WITH YOU</span><h2>People to know <span>{isLoading ? "" : visiblePeople.length}</span></h2></div>
          <div className="people-filters" aria-label="Filter people">
            {(["all", "candidate", "recruiter"] as const).map((filter) => <button aria-pressed={roleFilter === filter} className={roleFilter === filter ? "is-selected" : ""} key={filter} onClick={() => setRoleFilter(filter)}>{filter === "all" ? "Everyone" : filter === "candidate" ? "Candidates" : "Recruiters"}</button>)}
          </div>
        </div>

        {notice && <div className="people-notice" role="status"><Check size={15} />{notice}</div>}
        {error && <div className="people-empty-state" role="alert"><strong>We couldn’t load the community</strong><span>{error}</span><button onClick={() => window.location.reload()}>Try again</button></div>}
        {isLoading && <div className="people-empty-state"><span className="people-spinner" /><strong>Finding your community…</strong></div>}
        {!isLoading && !error && visiblePeople.length > 0 && <section className="people-grid" aria-label="Hirevo members">
          {visiblePeople.map((person, index) => <article className="people-card" key={person._id}>
            <div className={`people-card-cover people-cover-tone-${index % 4}`}><span className="people-card-orbit" /><span className="people-card-role"><span />{person.role === "recruiter" ? "RECRUITER" : "CANDIDATE"}</span></div>
            <div className="people-card-body">
              <div className={`people-avatar people-avatar-tone-${index % 4}`}>{initials(person.name)}</div>
              <h3>{person.name}</h3>
              <p className="people-headline">{person.headline || (person.role === "recruiter" ? "Building a thoughtful team" : "Exploring what comes next")}</p>
              {person.location && <p className="people-location"><MapPin size={14} />{person.location}</p>}
              <div className="people-skill-list">{person.skills?.length ? person.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>) : <span>{person.role === "recruiter" ? "Talent & hiring" : "Open to opportunity"}</span>}</div>
              <div className="people-card-footer"><span><BriefcaseBusiness size={14} />{person.role === "recruiter" ? "Recruiting" : "Community member"}</span><button aria-label={`Message ${person.name}`} onClick={() => setNotice("Messaging is coming soon.")}><MessageCircle size={16} /> Message</button></div>
            </div>
          </article>)}
        </section>}
        {!isLoading && !error && visiblePeople.length === 0 && <div className="people-empty-state"><Users size={22} /><strong>{people.length ? "No one matches that search" : "Your community is just getting started"}</strong><span>{people.length ? "Try a different name, role, skill, or location." : "More Hirevo members will appear here as they join."}</span>{query && <button onClick={() => { setQuery(""); setRoleFilter("all"); }}>Clear filters <ArrowRight size={14} /></button>}</div>}
      </main>

      <nav className="people-bottom-nav" aria-label="Main navigation">
        <button onClick={() => navigate("/")} type="button"><House size={19} /><span>Home</span></button>
        <button className="is-active" aria-current="page" onClick={() => navigate("/people")} type="button"><Users size={19} /><span>People</span></button>
        <button onClick={() => navigate("/#opportunities")} type="button"><BriefcaseBusiness size={19} /><span>Jobs</span></button>
        <button onClick={() => navigate("/", { state: { showMessagesNotice: true } })} type="button"><MessageCircle size={19} /><span>Messages</span></button>
        <button onClick={() => navigate("/profile")} type="button"><UserRound size={19} /><span>Profile</span></button>
      </nav>
    </div>
  );
}
