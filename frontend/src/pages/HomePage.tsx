import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Heart,
  ImagePlus,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { apiRequest, getCurrentUser, signOut } from "../services/api";
import "./HomePage.css";

type Job = {
  _id?: string;
  title: string;
  company: string;
  location: string;
  workplaceType: "remote" | "hybrid" | "onsite";
  employmentType: string;
  description: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
};

type Post = {
  id: string;
  authorId?: string;
  name: string;
  role: string;
  initials: string;
  tone: string;
  time: string;
  text: string;
  tags: string[];
  likes: number;
  comments: number;
  featured?: boolean;
  imageData?: string;
};

type ApiPost = {
  _id: string;
  text: string;
  imageData?: string;
  createdAt: string;
  author: { _id: string; name: string; role: string };
};

const fallbackJobs: Job[] = [
  {
    title: "Frontend Engineer",
    company: "Northstar Studio",
    location: "Bengaluru, India",
    workplaceType: "hybrid",
    employmentType: "Full-time",
    description: "Build thoughtful product experiences with a small, ambitious design team.",
    skills: ["React", "TypeScript", "Design systems"],
    salaryMin: 18,
    salaryMax: 28,
  },
  {
    title: "Product Designer",
    company: "Juniper Labs",
    location: "Remote · India",
    workplaceType: "remote",
    employmentType: "Full-time",
    description: "Turn complex workflows into simple, welcoming product experiences.",
    skills: ["Figma", "Prototyping", "Research"],
    salaryMin: 14,
    salaryMax: 22,
  },
  {
    title: "Data Analyst Intern",
    company: "Brightpath Analytics",
    location: "Pune, India",
    workplaceType: "onsite",
    employmentType: "Internship",
    description: "Help teams make confident decisions with clear analysis and dashboards.",
    skills: ["SQL", "Python", "Analytics"],
  },
];

const suggestedPeople = [
  { name: "Rhea Desai", role: "Design lead at Paperplane", initials: "RD", tone: "gold" },
  { name: "Kabir Nair", role: "People partner at Northstar", initials: "KN", tone: "mint" },
  { name: "Simran Iyer", role: "Product manager · SaaS", initials: "SI", tone: "lilac" },
];

function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function toneFor(name: string): string {
  return ["lilac", "rose", "blue", "gold", "mint"][name.charCodeAt(0) % 5] ?? "lilac";
}

function timeSince(date: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function fromApiPost(post: ApiPost): Post {
  return {
    id: post._id,
    authorId: post.author._id,
    name: post.author.name,
    role: post.author.role[0]?.toUpperCase() + post.author.role.slice(1),
    initials: initialsFor(post.author.name),
    tone: toneFor(post.author.name),
    time: timeSince(post.createdAt),
    text: post.text,
    tags: [],
    likes: 0,
    comments: 0,
    imageData: post.imageData,
  };
}

const navItems = [
  { label: "Your feed", icon: Compass, href: "#feed" },
  { label: "Explore jobs", icon: BriefcaseBusiness, href: "#opportunities" },
  { label: "Your community", icon: Users, href: "#community" },
];

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>(fallbackJobs);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [followedPeople, setFollowedPeople] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [imageData, setImageData] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postError, setPostError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const currentUser = getCurrentUser();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  const displayName = currentUser?.name ?? "Hirevo member";
  const avatarInitials = initialsFor(displayName) || "HM";
  const avatarTone = toneFor(displayName);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
    const controller = new AbortController();
    fetch(`${apiBase}/api/jobs?limit=3`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { jobs?: Job[] }) => {
        if (data.jobs?.length) setJobs(data.jobs);
      })
      .catch(() => undefined);
    apiRequest<{ posts: ApiPost[] }>("/api/posts", { signal: controller.signal })
      .then((data) => setPosts(data.posts.map(fromApiPost)))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPostError(error instanceof Error ? error.message : "Could not load posts.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPosts(false);
      });
    return () => controller.abort();
  }, []);

  const visibleJobs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return jobs;
    return jobs.filter((job) =>
      [job.title, job.company, job.location, ...job.skills].join(" ").toLowerCase().includes(search),
    );
  }, [jobs, query]);

  const toggleLike = (id: string) => {
    setLikedPosts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleSavedJob = (title: string) => {
    setSavedJobs((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  };

  const publishPost = async () => {
    const text = draft.trim();
    if (!text || isPublishing) return;
    setIsPublishing(true);
    setPostError("");
    try {
      const result = await apiRequest<{ post: ApiPost }>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ text, ...(imageData ? { imageData } : {}) }),
      });
      setPosts((current) => [fromApiPost(result.post), ...current]);
      setDraft("");
      setImageData("");
      setComposerOpen(false);
      setNotice("Your post has been shared.");
      window.setTimeout(() => setNotice(""), 2800);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Your post could not be shared.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setPostError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 768 * 1024) {
      setPostError("Images must be 768 KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageData(reader.result);
        setPostError("");
        setComposerOpen(true);
      }
    };
    reader.onerror = () => setPostError("That image could not be opened. Try another file.");
    reader.readAsDataURL(file);
  };

  const deletePost = async (post: Post) => {
    try {
      await apiRequest<void>(`/api/posts/${post.id}`, { method: "DELETE" });
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setPendingDeleteId(null);
      setNotice("Your post has been deleted.");
      window.setTimeout(() => setNotice(""), 2800);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "That post could not be deleted.");
      setPendingDeleteId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // The local session is cleared by signOut even when the API is unavailable.
    }
    navigate("/login", { replace: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.querySelector("#opportunities")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-shell">
      <header className="home-topbar">
        <div className="topbar-inner">
          <a className="brand-lockup" href="#feed" aria-label="Hirevo home">
            <span className="brand-mark" aria-hidden="true"><i /><i /></span>
            <span>hirevo<span className="brand-period">.</span></span>
          </a>

          <form className="global-search" onSubmit={handleSearch} role="search">
            <Search size={18} />
            <input
              aria-label="Search jobs, skills, or companies"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles, skills, or companies"
              value={query}
            />
            <kbd>⌘ K</kbd>
          </form>

          <nav className="topbar-links" aria-label="Primary navigation">
            <a className="top-link top-link-active" href="#feed"><Compass size={18} /><span>Home</span></a>
            <a className="top-link" href="#opportunities"><BriefcaseBusiness size={18} /><span>Jobs</span></a>
            <a className="top-link" href="#community"><Users size={18} /><span>People</span></a>
          </nav>

          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You’re all caught up.")}>
              <Bell size={19} /><span className="notification-dot" />
            </button>
            <button className={`top-avatar avatar avatar-${avatarTone}`} aria-label={`Signed in as ${displayName}`}>{avatarInitials}</button>
            <button aria-label="Sign out" className="login-link" onClick={() => void handleSignOut()}><LogOut size={14} /> Sign out</button>
          </div>
        </div>
      </header>

      {notice && <div aria-live="polite" className="home-toast"><Check size={16} />{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={15} /></button></div>}

      <main className="home-layout" id="feed">
        <aside className="left-rail">
          <section className="surface profile-card" id="profile">
            <div className="profile-cover"><span className="cover-orb cover-orb-one" /><span className="cover-orb cover-orb-two" /><span className="cover-spark">✳</span></div>
            <div className="profile-content">
              <div className={`avatar profile-avatar avatar-${avatarTone}`}>{avatarInitials}</div>
              <div className="profile-heading"><h2>{displayName}</h2><span className="verified-mark"><Check size={11} /></span></div>
              <p>{currentUser?.role === "recruiter" ? "Connecting thoughtful teams with great people." : "Building your next chapter, one connection at a time."}</p>
              <div className="profile-location"><MapPin size={14} /> Hirevo community</div>
              <div className="profile-divider" />
              <a className="profile-stat" href="#community"><span>Profile views</span><strong>248 <ArrowDownRight size={14} /></strong></a>
              <a className="profile-stat" href="#opportunities"><span>Applications</span><strong>12 <ChevronRight size={14} /></strong></a>
            </div>
          </section>

          <nav className="surface side-nav" aria-label="Your space">
            <p className="side-eyebrow">YOUR SPACE</p>
            {navItems.map(({ label, icon: Icon, href }, index) => (
              <a className={`side-nav-link ${index === 0 ? "side-nav-current" : ""}`} href={href} key={label}>
                <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{index === 1 && <span className="side-count">3</span>}
              </a>
            ))}
            <div className="side-divider" />
            <a className="side-nav-link side-saved-link" href="#opportunities"><Bookmark size={18} strokeWidth={1.8} /><span>Saved jobs</span><span className="side-count">{savedJobs.length}</span></a>
          </nav>

          <section className="surface trend-card">
            <div className="trend-heading"><div><span className="trend-icon"><Flame size={15} /></span><h3>On the rise</h3></div><button aria-label="More trending topics"><MoreHorizontal size={19} /></button></div>
            <a href="#opportunities"><span className="trend-number">01</span><span><strong>Design systems</strong><small>1.8k conversations</small></span><ChevronRight size={15} /></a>
            <a href="#opportunities"><span className="trend-number">02</span><span><strong>Career pivots</strong><small>946 conversations</small></span><ChevronRight size={15} /></a>
            <a href="#opportunities"><span className="trend-number">03</span><span><strong>Remote work</strong><small>732 conversations</small></span><ChevronRight size={15} /></a>
            <a className="see-trends" href="#community">Explore conversations <ArrowRight size={14} /></a>
          </section>

          <footer className="rail-footer"><a href="#about">About</a><a href="#guidelines">Community guidelines</a><a href="#privacy">Privacy</a><span>© 2026 Hirevo, Inc.</span></footer>
        </aside>

        <section className="main-column" aria-label="Your Hirevo feed">
          <section className="welcome-panel">
            <div className="welcome-decoration welcome-decoration-a" /><div className="welcome-decoration welcome-decoration-b" />
            <div className="welcome-copy"><span className="welcome-kicker"><Sparkles size={14} /> YOUR NEXT CHAPTER</span><h1>Good things happen<br />when you <em>show up.</em></h1><p>Find your people. Find your next move. Make work feel more like you.</p></div>
            <div className="welcome-art" aria-hidden="true"><div className="welcome-art-ring" /><div className="welcome-art-card"><span className="welcome-art-spark">✳</span><span className="welcome-art-dot" /><span className="welcome-art-line" /><span className="welcome-art-line short" /><span className="welcome-art-chip">your next move</span></div><div className="welcome-art-tag">✨ <span>made for you</span></div></div>
            <a className="welcome-cta" href="#opportunities">Find your next role <ArrowRight size={16} /></a>
          </section>

          <section className="prompt-strip" aria-label="Suggested actions">
            <span className="prompt-spark"><Sparkles size={16} /></span>
            <div><strong>A little momentum goes a long way.</strong><span>Share what you’re working toward today.</span></div>
            <button onClick={() => { setComposerOpen(true); document.querySelector("#composer")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Write an update <ArrowRight size={15} /></button>
          </section>

          <section className="composer surface" id="composer">
            <div className="composer-top"><div className={`avatar avatar-${avatarTone}`}>{avatarInitials}</div>{composerOpen ? <textarea autoFocus aria-label="Write a post" maxLength={2000} onChange={(event) => setDraft(event.target.value)} placeholder={`What’s on your mind, ${displayName.split(" ")[0]}? Share a win, an idea, or a question...`} value={draft} /> : <button className="composer-placeholder" onClick={() => setComposerOpen(true)}>What’s on your mind, {displayName.split(" ")[0]}?</button>}</div>
            {imageData && <div className="composer-image-preview"><img alt="Selected post attachment preview" src={imageData} /><button aria-label="Remove selected image" onClick={() => setImageData("")}><X size={15} /></button></div>}
            {postError && <p className="post-error" role="alert">{postError}</p>}
            <div className="composer-bottom"><div><span className="composer-audience"><Users size={14} /> Your community <ChevronDown size={13} /></span><span className="composer-hint">A thoughtful update can start something.</span></div><div className="composer-tools"><label className="attach-image-button" title="Add a photo"><ImagePlus size={16} /><span>Photo</span><input accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Attach a photo" onChange={handleImageSelect} type="file" /></label><button className="publish-button" disabled={!composerOpen || !draft.trim() || isPublishing} onClick={() => void publishPost()}>{isPublishing ? <LoaderCircle className="spinning" size={14} /> : <Send size={14} />}{isPublishing ? "Sharing…" : "Share post"}</button></div></div>
          </section>

          <section className="feed-section" aria-labelledby="feed-heading">
            <div className="section-heading"><div><span className="section-eyebrow">A good place to start</span><h2 id="feed-heading">Your community</h2></div><button className="feed-sort">For you <ChevronDown size={15} /></button></div>
            <div className="story-row" aria-label="People to catch up with">
              <button className="story-add" onClick={() => setNotice("Your story feature is coming soon.")}><span className="story-ring story-ring-add"><span><Plus size={19} /></span></span><small>Your story</small></button>
              {[
                { name: "Priya", initials: "PS", tone: "rose", label: "Design" },
                { name: "Arjun", initials: "AM", tone: "blue", label: "Engineering" },
                { name: "Rhea", initials: "RD", tone: "gold", label: "Ideas" },
                { name: "Kabir", initials: "KN", tone: "mint", label: "Hiring" },
                { name: "Simran", initials: "SI", tone: "lilac", label: "Product" },
              ].map((person) => <button className="story-item" key={person.name} onClick={() => setNotice(`${person.name}’s latest update is in your feed.`)}><span className="story-ring"><span className={`avatar avatar-${person.tone}`}>{person.initials}</span></span><small>{person.name}<span>{person.label}</span></small></button>)}
              <button className="story-next" aria-label="More stories" onClick={() => setNotice("You’re up to date with your community.")}><ChevronRight size={17} /></button>
            </div>

            <div className="post-list">
              {isLoadingPosts && <div className="post-state surface"><LoaderCircle className="spinning" size={18} /> Loading your community…</div>}
              {!isLoadingPosts && posts.length === 0 && <div className="post-state surface"><Sparkles size={18} /><strong>Your feed starts here</strong><span>Share a thought or a photo with your community.</span></div>}
              {posts.map((post) => {
                const canDelete = post.authorId === currentUser?.id || currentUser?.role === "admin";
                return <article className="surface post-card" key={post.id}>
                  <div className="post-top"><div className={`avatar avatar-${post.tone}`}>{post.initials}</div><div className="post-author"><div><strong>{post.name}</strong><span className="post-time">· {post.time}</span></div><p>{post.role}</p></div>{canDelete ? <button className="post-delete-trigger" aria-label={`Delete your post from ${post.time}`} disabled={pendingDeleteId === post.id} onClick={() => setPendingDeleteId(post.id)}><Trash2 size={16} /> <span>Delete</span></button> : <button className="post-more" aria-label={`More options for ${post.name}'s post`} onClick={() => setNotice("More post options will be available soon.")}><MoreHorizontal size={20} /></button>}</div>
                  {pendingDeleteId === post.id && <div className="delete-confirm" role="group" aria-label="Confirm post deletion"><span>Delete this post? This can’t be undone.</span><button onClick={() => setPendingDeleteId(null)}>Keep post</button><button className="confirm-delete" onClick={() => void deletePost(post)}>Delete</button></div>}
                  <p className="post-copy">{post.text}</p>
                  {post.imageData && <img className="post-attachment" src={post.imageData} alt={`Photo shared by ${post.name}`} />}
                  {post.featured && <div className="post-visual"><div className="post-visual-orbit orbit-one" /><div className="post-visual-orbit orbit-two" /><span className="visual-label">THE WORK BEHIND THE WORK</span><strong>Make it<br /><em>mean something.</em></strong><span className="visual-signature">Notes from the studio <ArrowRight size={14} /></span><span className="visual-sticker">✳</span></div>}
                  {post.tags.length > 0 && <div className="post-tags">{post.tags.map((tag) => <a href="#community" key={tag}>#{tag.replaceAll(" ", "")}</a>)}</div>}
                  <div className="post-metrics"><span>{post.likes + (likedPosts.includes(post.id) ? 1 : 0)} appreciations</span><span>{post.comments} comments</span></div>
                  <div className="post-actions"><button className={likedPosts.includes(post.id) ? "is-liked" : ""} onClick={() => toggleLike(post.id)}><Heart size={17} fill={likedPosts.includes(post.id) ? "currentColor" : "none"} /> Appreciate</button><button onClick={() => setNotice("Comments are coming soon.")}><MessageCircle size={17} /> Comment</button><button onClick={() => setNotice("Share link copied to your clipboard.")}><Send size={16} /> Share</button><button className="post-bookmark" aria-label="Save post" onClick={() => setNotice("Post saved to your collection.")}><Bookmark size={17} /></button></div>
                </article>;
              })}
            </div>
            {!isLoadingPosts && posts.length > 0 && <button className="load-more" onClick={() => setNotice("You’re all caught up for now.")}>You’re all caught up <Sparkles size={14} /></button>}
          </section>
        </section>

        <aside className="right-rail">
          <section className="surface jobs-panel" id="opportunities">
            <div className="panel-heading"><div><span className="section-eyebrow">Picked for your path</span><h2>Open doors</h2></div><span className="panel-heading-icon"><BriefcaseBusiness size={17} /></span></div>
            <p className="panel-subtitle">A few roles that could feel like a fit.</p>
            {visibleJobs.length === 0 ? <div className="no-jobs"><Search size={20} /><strong>No matching roles yet</strong><span>Try a different title, skill, or company.</span></div> : visibleJobs.map((job, index) => {
              const key = job._id ?? job.title;
              const saved = savedJobs.includes(job.title);
              return <article className="job-card" key={key}>
                <div className={`company-mark company-mark-${index % 3}`}>{job.company.slice(0, 1).toUpperCase()}</div>
                <div className="job-main"><div className="job-title-row"><h3>{job.title}</h3><button aria-label={saved ? `Remove saved ${job.title}` : `Save ${job.title}`} className={`job-save ${saved ? "job-save-active" : ""}`} onClick={() => toggleSavedJob(job.title)}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button></div><p className="job-company">{job.company}</p><div className="job-meta"><span><MapPin size={12} />{job.location}</span><span><Clock3 size={12} />{job.workplaceType}</span></div>{job.skills.slice(0, 3).map((skill) => <span className="job-skill" key={skill}>{skill}</span>)}</div>
              </article>;
            })}
            <a className="all-jobs-link" href="#feed">Explore all opportunities <ArrowRight size={15} /></a>
          </section>

          <section className="surface people-panel" id="community">
            <div className="panel-heading"><div><span className="section-eyebrow">Your next good conversation</span><h2>People to know</h2></div><button className="panel-more" aria-label="More people"><MoreHorizontal size={19} /></button></div>
            <div className="people-list">{suggestedPeople.map((person) => {
              const following = followedPeople.includes(person.name);
              return <div className="person-row" key={person.name}><div className={`avatar avatar-${person.tone}`}>{person.initials}</div><div className="person-info"><strong>{person.name}</strong><span>{person.role}</span></div><button aria-label={`${following ? "Following" : "Follow"} ${person.name}`} className={`follow-button ${following ? "followed" : ""}`} onClick={() => setFollowedPeople((current) => following ? current.filter((name) => name !== person.name) : [...current, person.name])}>{following ? <Check size={16} /> : <Plus size={16} />}</button></div>;
            })}</div>
            <a className="people-link" href="#community">Meet your community <ArrowRight size={15} /></a>
          </section>

          <section className="event-card"><div className="event-overline"><span className="event-live-dot" /> COMING UP · HIREVO LIVE</div><h2>Make your next move<br />feel less like a leap.</h2><p>A candid conversation on building a career you actually want.</p><div className="event-bottom"><span><Users size={14} /> 186 interested</span><button onClick={() => setNotice("You’re on the list for this Hirevo session.")}>Save my spot <ArrowRight size={14} /></button></div><div className="event-shape event-shape-one" /><div className="event-shape event-shape-two" /></section>

          <div className="right-footer"><a href="#about">About</a><a href="#help">Help</a><a href="#terms">Terms</a><span>Built for what’s next <span aria-hidden="true">✳</span></span></div>
        </aside>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><a className="mobile-nav-current" href="#feed"><Compass size={20} /><span>Home</span></a><a href="#opportunities"><BriefcaseBusiness size={20} /><span>Jobs</span></a><a href="#community"><Users size={20} /><span>People</span></a><a href="#profile"><span className={`avatar avatar-${avatarTone}`}>{avatarInitials}</span><span>Profile</span></a></nav>
    </div>
  );
}
