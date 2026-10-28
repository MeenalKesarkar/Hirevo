import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, BriefcaseBusiness, Camera, Check, ChevronRight, FileText, GraduationCap, House, LoaderCircle, LogOut, MapPin, Pencil, Plus, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { apiRequest, getCurrentUser, signOut } from "../services/api";
import "./ProfilePage.css";

type Profile = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter" | "admin";
  createdAt?: string;
  headline?: string;
  location?: string;
  about?: string;
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  profileImageData?: string;
  coverImageData?: string;
};

type EducationEntry = { institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string };
type ExperienceEntry = { title: string; company: string; location: string; startYear: string; endYear: string; description: string };
type SuggestedPerson = { _id: string; name: string; role: Profile["role"]; headline?: string; location?: string; skills?: string[] };
type SuggestedJob = { _id: string; title: string; company: string; location: string; workplaceType: string; skills: string[] };

type ApiPost = {
  _id: string;
  text: string;
  imageData?: string;
  createdAt: string;
  author: { _id: string; name: string; role: string };
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function dateLabel(value?: string): string {
  if (!value) return "New member";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "New member" : `Joined ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

function timeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const emptyEducation = (): EducationEntry => ({ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" });
const emptyExperience = (): ExperienceEntry => ({ title: "", company: "", location: "", startYear: "", endYear: "", description: "" });

export default function ProfilePage() {
  const signedInUser = getCurrentUser();
  const [profile, setProfile] = useState<Profile | null>(signedInUser ? { ...signedInUser } : null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<SuggestedPerson[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<SuggestedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [educationDraft, setEducationDraft] = useState<EducationEntry[]>([]);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ user: Profile }>("/api/auth/me", { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setProfile(result.user); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Your profile could not be loaded."); });
    apiRequest<{ posts: ApiPost[] }>("/api/posts/mine", { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setPosts(result.posts); })
      .catch(() => undefined)
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    apiRequest<{ people: SuggestedPerson[] }>("/api/auth/people", { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setSuggestedPeople(result.people); })
      .catch(() => undefined);
    apiRequest<{ jobs: SuggestedJob[] }>("/api/jobs?limit=12", { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setSuggestedJobs(result.jobs); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [signedInUser?.id]);

  const completedFields = useMemo(() => {
    if (!profile) return 0;
    return [profile.name, profile.email, profile.headline, profile.location, profile.about, profile.skills?.length ? "skills" : "", profile.education?.length ? "education" : "", profile.experience?.length ? "experience" : ""]
      .filter(Boolean).length;
  }, [profile]);
  const completion = Math.round(completedFields / 8 * 100);
  const postsThisMonth = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return posts.filter((post) => new Date(post.createdAt).getTime() >= cutoff).length;
  }, [posts]);
  const recommendedJobs = useMemo(() => {
    const skills = (profile?.skills ?? []).map((skill) => skill.toLowerCase());
    return [...suggestedJobs].sort((first, second) => {
      const score = (job: SuggestedJob) => job.skills?.filter((skill) => skills.includes(skill.toLowerCase())).length ?? 0;
      return score(second) - score(first);
    }).slice(0, 3);
  }, [profile?.skills, suggestedJobs]);

  const prepareEditorDrafts = () => {
    if (!profile) return;
    setEducationDraft((profile.education ?? []).map((item) => ({ ...emptyEducation(), ...item })));
    setExperienceDraft((profile.experience ?? []).map((item) => ({ ...emptyExperience(), ...item })));
  };

  const toggleEditor = () => {
    if (!isEditing) prepareEditorDrafts();
    setIsEditing((editing) => !editing);
    setStatus("");
  };

  const addExperience = () => {
    if (isEditing) {
      setExperienceDraft((items) => items.length < 10 ? [...items, emptyExperience()] : items);
      return;
    }
    prepareEditorDrafts();
    setEducationDraft((profile?.education ?? []).map((item) => ({ ...emptyEducation(), ...item })));
    setExperienceDraft([...(profile?.experience ?? []).map((item) => ({ ...emptyExperience(), ...item })), emptyExperience()]);
    setIsEditing(true);
    setStatus("");
  };

  const addEducation = () => {
    if (isEditing) {
      setEducationDraft((items) => items.length < 10 ? [...items, emptyEducation()] : items);
      return;
    }
    prepareEditorDrafts();
    setExperienceDraft((profile?.experience ?? []).map((item) => ({ ...emptyExperience(), ...item })));
    setEducationDraft([...(profile?.education ?? []).map((item) => ({ ...emptyEducation(), ...item })), emptyEducation()]);
    setIsEditing(true);
    setStatus("");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const skills = String(form.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean);
    if (skills.length > 20) {
      setStatus("Add up to 20 skills.");
      return;
    }
    const education = educationDraft.filter((item) => Object.values(item).some((value) => value.trim())).map((item) => ({
      institution: item.institution.trim(), degree: item.degree.trim(), fieldOfStudy: item.fieldOfStudy.trim(),
      startYear: item.startYear.trim(), endYear: item.endYear.trim(),
    }));
    const experience = experienceDraft.filter((item) => Object.values(item).some((value) => value.trim())).map((item) => ({
      title: item.title.trim(), company: item.company.trim(), location: item.location.trim(),
      startYear: item.startYear.trim(), endYear: item.endYear.trim(), description: item.description.trim(),
    }));
    if (education.length > 10 || experience.length > 10) {
      setStatus("Add up to 10 education and 10 experience entries.");
      return;
    }
    if (education.some((item) => !item.institution || !item.degree)) {
      setStatus("Each education entry needs an institution and degree. Complete or remove unfinished entries.");
      return;
    }
    if (experience.some((item) => !item.title || !item.company)) {
      setStatus("Each experience entry needs a job title and company. Complete or remove unfinished entries.");
      return;
    }
    setIsSaving(true);
    setStatus("");
    try {
      const result = await apiRequest<{ user: Profile }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          headline: String(form.get("headline") ?? "").trim(),
          location: String(form.get("location") ?? "").trim(),
          about: String(form.get("about") ?? "").trim(),
          skills,
          education,
          experience,
        }),
      });
      setProfile(result.user);
      setIsEditing(false);
      setStatus("Your profile is up to date.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfileImage = async (field: "profileImageData" | "coverImageData", image: string, imageLabel: string) => {
    setStatus(`Saving ${imageLabel.toLowerCase()}…`);
    try {
      const result = await apiRequest<{ user: Profile }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ [field]: image }),
      });
      setProfile(result.user);
      setStatus(`${imageLabel} saved.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Your ${imageLabel.toLowerCase()} could not be saved.`);
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>, field: "profileImageData" | "coverImageData", imageLabel: string) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus(`Choose a JPG, PNG, or WebP ${imageLabel}.`);
      return;
    }
    if (file.size > 500 * 1024) {
      setStatus(`${imageLabel[0].toUpperCase()}${imageLabel.slice(1)} must be 500 KB or smaller.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void saveProfileImage(field, reader.result, imageLabel);
      }
    };
    reader.onerror = () => setStatus(`That ${imageLabel} could not be opened. Try another image.`);
    reader.readAsDataURL(file);
  };

  const updateEducation = (index: number, key: keyof EducationEntry, value: string) => {
    setEducationDraft((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };
  const updateExperience = (index: number, key: keyof ExperienceEntry, value: string) => {
    setExperienceDraft((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch { /* The local session is cleared even if the API is offline. */ }
    navigate("/login", { replace: true, state: { signedOut: true } });
  };

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <Link className="profile-brand" to="/" aria-label="Hirevo home"><span className="profile-brand-mark"><i /><i /></span>Hirevo<span>.</span></Link>
        <div className="profile-top-actions"><span className="profile-page-label">Your profile</span><button onClick={() => void handleSignOut()}><LogOut size={15} /> Sign out</button></div>
      </header>

      <main className="profile-page-layout">
        <div className="profile-main-column">
          <div className="profile-page-heading"><div><span className="profile-eyebrow">YOUR PROFESSIONAL STORY</span><h1>Your profile</h1><p>A clear profile helps the right people find you.</p></div><button className="profile-edit-trigger" onClick={toggleEditor}><Pencil size={16} /> {isEditing ? "Close editor" : "Edit profile"}</button></div>

          <section className="profile-hero-card">
            <div className={`profile-hero-cover ${profile?.coverImageData ? "has-cover-image" : ""}`} style={profile?.coverImageData ? { backgroundImage: `linear-gradient(0deg, rgb(53 26 46 / 36%), rgb(53 26 46 / 12%)), url("${profile.coverImageData}")` } : undefined}><span className="profile-cover-orbit profile-cover-orbit-one" /><span className="profile-cover-orbit profile-cover-orbit-two" /><span className="profile-cover-star">✳</span><span className="profile-cover-word">HIREVO · {profile?.role === "recruiter" ? "TALENT PARTNER" : "YOUR NEXT CHAPTER"}</span><label className="profile-cover-upload"><Camera size={15} />{profile?.coverImageData ? "Change background" : "Add background picture"}<input accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageSelect(event, "coverImageData", "Background picture")} type="file" /></label></div>
            <div className="profile-identity">
              <div className="profile-avatar-wrap"><div className="profile-large-avatar">{profile?.profileImageData ? <img className="profile-avatar-image" src={profile.profileImageData} alt={`${profile.name}'s profile`} /> : initials(profile?.name ?? signedInUser?.name ?? "HM")}</div><label className="profile-avatar-upload" aria-label="Add or change profile picture"><Camera size={14} /><input accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageSelect(event, "profileImageData", "Profile picture")} type="file" /></label></div>
              <div className="profile-identity-actions"><span className="profile-status-pill"><span /> Part of the Hirevo community</span></div>
              <h2>{profile?.name ?? "Your name"}</h2>
              <p className="profile-headline">{profile?.headline || (profile?.role === "recruiter" ? "Recruiter · Building thoughtful teams" : "Ready for your next opportunity")}</p>
              <div className="profile-meta"><span><MapPin size={15} />{profile?.location || "Add your location"}</span><span><BriefcaseBusiness size={15} />{profile?.role === "recruiter" ? "Recruiter" : "Candidate"}</span><span>{dateLabel(profile?.createdAt)}</span></div>
              <div className="profile-hero-links"><span className="profile-email">{profile?.email ?? signedInUser?.email}</span><span className="profile-privacy"><UserRound size={14} /> Hirevo member</span></div>
            </div>
          </section>
          {status && !isEditing && <p className="profile-status-message profile-image-save-status" role="status">{status}</p>}

          {isEditing && profile && <section className="profile-section-card profile-editor-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">MAKE IT YOURS</span><h2>Edit your profile</h2></div><span className="profile-section-icon"><Pencil size={17} /></span></div>
            <form className="profile-editor-form" onSubmit={(event) => void saveProfile(event)}>
              <label>Professional headline<input name="headline" maxLength={140} defaultValue={profile.headline ?? ""} placeholder="e.g. Product designer focused on accessible experiences" /></label>
              <label>Location<input name="location" maxLength={120} defaultValue={profile.location ?? ""} placeholder="City, country or remote" /></label>
              <label>About<textarea name="about" maxLength={2000} rows={5} defaultValue={profile.about ?? ""} placeholder="Share what you do, what you care about, and what you’re looking for." /></label>
              <label>Skills <span className="profile-field-hint">Separate each skill with a comma</span><input name="skills" maxLength={900} defaultValue={profile.skills?.join(", ") ?? ""} placeholder="Research, React, Leadership" /></label>
              <div className="profile-editor-subsection">
                <div className="profile-editor-subheading"><strong>Experience</strong><button type="button" onClick={addExperience}><Plus size={14} /> Add role</button></div>
                {experienceDraft.map((item, index) => <div className="profile-editor-entry" key={`experience-${index}`}>
                  <button aria-label={`Remove experience ${index + 1}`} className="profile-remove-entry" type="button" onClick={() => setExperienceDraft((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                  <div className="profile-editor-grid"><label>Job title<input value={item.title} onChange={(event) => updateExperience(index, "title", event.target.value)} maxLength={120} placeholder="Senior designer" /></label><label>Company<input value={item.company} onChange={(event) => updateExperience(index, "company", event.target.value)} maxLength={140} placeholder="Studio or company" /></label></div>
                  <div className="profile-editor-grid"><label>Location<input value={item.location} onChange={(event) => updateExperience(index, "location", event.target.value)} maxLength={120} placeholder="City or remote" /></label><label>Years <span className="profile-field-hint">Start – end</span><div className="profile-year-inputs"><input aria-label="Experience start year" value={item.startYear} onChange={(event) => updateExperience(index, "startYear", event.target.value)} maxLength={20} placeholder="2022" /><input aria-label="Experience end year" value={item.endYear} onChange={(event) => updateExperience(index, "endYear", event.target.value)} maxLength={20} placeholder="Present" /></div></label></div>
                  <label>Description<textarea value={item.description} onChange={(event) => updateExperience(index, "description", event.target.value)} maxLength={1000} rows={3} placeholder="What did you work on or accomplish?" /></label>
                </div>)}
                {!experienceDraft.length && <p className="profile-editor-help">Add the roles and projects that shaped your experience.</p>}
              </div>
              <div className="profile-editor-subsection">
                <div className="profile-editor-subheading"><strong>Education</strong><button type="button" onClick={addEducation}><Plus size={14} /> Add education</button></div>
                {educationDraft.map((item, index) => <div className="profile-editor-entry" key={`education-${index}`}>
                  <button aria-label={`Remove education ${index + 1}`} className="profile-remove-entry" type="button" onClick={() => setEducationDraft((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                  <div className="profile-editor-grid"><label>School or institution<input value={item.institution} onChange={(event) => updateEducation(index, "institution", event.target.value)} maxLength={140} placeholder="University or institution" /></label><label>Degree<input value={item.degree} onChange={(event) => updateEducation(index, "degree", event.target.value)} maxLength={120} placeholder="Bachelor’s degree" /></label></div>
                  <div className="profile-editor-grid"><label>Field of study<input value={item.fieldOfStudy} onChange={(event) => updateEducation(index, "fieldOfStudy", event.target.value)} maxLength={120} placeholder="Computer science" /></label><label>Years <span className="profile-field-hint">Start – end</span><div className="profile-year-inputs"><input aria-label="Education start year" value={item.startYear} onChange={(event) => updateEducation(index, "startYear", event.target.value)} maxLength={20} placeholder="2018" /><input aria-label="Education end year" value={item.endYear} onChange={(event) => updateEducation(index, "endYear", event.target.value)} maxLength={20} placeholder="2022" /></div></label></div>
                </div>)}
                {!educationDraft.length && <p className="profile-editor-help">Add your school, degree, and field of study.</p>}
              </div>
              <div className="profile-editor-footer"><span>{status}</span><button disabled={isSaving} type="submit">{isSaving ? <LoaderCircle className="profile-spinner" size={16} /> : <Check size={16} />}{isSaving ? "Saving…" : "Save changes"}</button></div>
            </form>
          </section>}

          <section className="profile-section-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">A LITTLE ABOUT YOU</span><h2>About</h2></div><span className="profile-section-icon"><Sparkles size={18} /></span></div>
            {profile?.about ? <p className="profile-about-copy">{profile.about}</p> : <div className="profile-empty-prompt"><p>Tell people what you’re passionate about and the kind of work you want to do.</p><button onClick={() => setIsEditing(true)}>Add an introduction <ArrowRight size={15} /></button></div>}
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">WHERE YOU’VE MADE AN IMPACT</span><h2>Experience</h2></div><span className="profile-section-icon"><BriefcaseBusiness size={18} /></span></div>
            {profile?.experience?.length ? <div className="profile-history-list">{profile.experience.map((item, index) => <article className="profile-history-item" key={`${item.company}-${index}`}><span className="profile-history-mark"><BriefcaseBusiness size={17} /></span><div><h3>{item.title}</h3><p className="profile-history-subtitle">{item.company}{item.location ? ` · ${item.location}` : ""}</p>{(item.startYear || item.endYear) && <span className="profile-history-dates">{item.startYear || "—"} – {item.endYear || "Present"}</span>}{item.description && <p className="profile-history-description">{item.description}</p>}</div></article>)}</div> : <div className="profile-empty-prompt"><p>Show the roles, projects, or freelance work that helped shape your career.</p><button onClick={addExperience}>Add experience <ArrowRight size={15} /></button></div>}
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">WHAT YOU’VE LEARNED</span><h2>Education</h2></div><span className="profile-section-icon"><GraduationCap size={19} /></span></div>
            {profile?.education?.length ? <div className="profile-history-list">{profile.education.map((item, index) => <article className="profile-history-item" key={`${item.institution}-${index}`}><span className="profile-history-mark"><GraduationCap size={19} /></span><div><h3>{item.institution}</h3><p className="profile-history-subtitle">{item.degree}{item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}</p>{(item.startYear || item.endYear) && <span className="profile-history-dates">{item.startYear || "—"} – {item.endYear || "Present"}</span>}</div></article>)}</div> : <div className="profile-empty-prompt"><p>Add your education and areas of study to round out your profile.</p><button onClick={addEducation}>Add education <ArrowRight size={15} /></button></div>}
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">WHAT YOU BRING</span><h2>Skills & strengths</h2></div><span className="profile-section-icon"><BriefcaseBusiness size={18} /></span></div>
            {profile?.skills?.length ? <div className="profile-skill-list">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <div className="profile-empty-prompt"><p>Add a few skills so people can see where you shine.</p><button onClick={() => setIsEditing(true)}>Add your skills <ArrowRight size={15} /></button></div>}
          </section>

          <section className="profile-section-card profile-activity-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">WHAT YOU’RE THINKING ABOUT</span><h2>Recent activity</h2></div><Link className="profile-text-link" to="/">Back to your feed <ArrowRight size={15} /></Link></div>
            {isLoading ? <div className="profile-loading"><LoaderCircle className="profile-spinner" size={18} /> Loading your activity…</div> : posts.length ? <div className="profile-activity-list">{posts.map((post) => <article className="profile-activity-item" key={post._id}><div className="profile-activity-icon"><FileText size={17} /></div><div><span className="profile-activity-date">{timeLabel(post.createdAt)}</span><p>{post.text}</p>{post.imageData && <img src={post.imageData} alt="Image from your post" />}</div></article>)}</div> : <div className="profile-empty-prompt"><p>Your posts will appear here when you share something with the Hirevo community.</p><Link to="/">Create your first post <ArrowRight size={15} /></Link></div>}
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-section-card profile-progress-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">YOUR PROFILE</span><h2>Make a strong first impression</h2></div><span className="profile-section-icon"><Sparkles size={18} /></span></div>
            <div className="profile-progress-number">{completion}<span>% complete</span></div>
            <div className="profile-progress-track"><span style={{ width: `${completion}%` }} /></div>
            <p className="profile-progress-copy">A few details can help the right people discover your experience.</p>
            <ul className="profile-checklist">
              <li className="is-complete"><Check size={14} /> Name and email</li>
              <li className={profile?.headline ? "is-complete" : ""}>{profile?.headline ? <Check size={14} /> : <span className="profile-check-empty" />} Professional headline</li>
              <li className={profile?.about ? "is-complete" : ""}>{profile?.about ? <Check size={14} /> : <span className="profile-check-empty" />} About you</li>
              <li className={profile?.skills?.length ? "is-complete" : ""}>{profile?.skills?.length ? <Check size={14} /> : <span className="profile-check-empty" />} Skills and strengths</li>
              <li className={profile?.experience?.length ? "is-complete" : ""}>{profile?.experience?.length ? <Check size={14} /> : <span className="profile-check-empty" />} Experience</li>
              <li className={profile?.education?.length ? "is-complete" : ""}>{profile?.education?.length ? <Check size={14} /> : <span className="profile-check-empty" />} Education</li>
            </ul>
            <button className="profile-complete-button" onClick={() => setIsEditing(true)}>Improve your profile <ChevronRight size={16} /></button>
          </section>

          <section className="profile-section-card profile-analytics-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">YOUR HIREVO SNAPSHOT</span><h2>Analytics</h2></div><span className="profile-section-icon"><BarChart3 size={18} /></span></div>
            <div className="profile-analytics-grid">
              <div><strong>{posts.length}</strong><span>Posts shared</span></div>
              <div><strong>{postsThisMonth}</strong><span>Posts this month</span></div>
              <div><strong>{profile?.skills?.length ?? 0}</strong><span>Skills listed</span></div>
              <div><strong>{(profile?.experience?.length ?? 0) + (profile?.education?.length ?? 0)}</strong><span>Career entries</span></div>
            </div>
            <p className="profile-analytics-note">Counts are based on your profile and posts.</p>
          </section>

          <section className="profile-section-card profile-recommendations-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">GROW YOUR CIRCLE</span><h2>People you may know</h2></div><span className="profile-section-icon"><Users size={18} /></span></div>
            {suggestedPeople.length ? <div className="profile-suggested-people">{suggestedPeople.slice(0, 4).map((person) => <div className="profile-suggested-person" key={person._id}><span className="profile-person-avatar">{initials(person.name)}</span><span className="profile-person-copy"><strong>{person.name}</strong><small>{person.headline || `${person.role[0].toUpperCase()}${person.role.slice(1)} on Hirevo`}</small>{person.location && <small>{person.location}</small>}</span></div>)}</div> : <p className="profile-recommendation-empty">New people will appear here as the Hirevo community grows.</p>}
            <Link className="profile-recommendation-link" to="/#community">Explore the community <ArrowRight size={15} /></Link>
          </section>

          <section className="profile-section-card profile-recommendations-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">RECOMMENDED FOR YOUR NEXT MOVE</span><h2>You might like</h2></div><span className="profile-section-icon"><BriefcaseBusiness size={18} /></span></div>
            {recommendedJobs.length ? <div className="profile-suggested-jobs">{recommendedJobs.map((job) => <Link className="profile-suggested-job" key={job._id} to="/#opportunities"><span className="profile-job-mark">{job.company.slice(0, 1).toUpperCase()}</span><span><strong>{job.title}</strong><small>{job.company} · {job.location}</small></span><ArrowUpRight size={15} /></Link>)}</div> : <p className="profile-recommendation-empty">Add skills to your profile to get more relevant role suggestions.</p>}
            <Link className="profile-recommendation-link" to="/#opportunities">Explore open roles <ArrowRight size={15} /></Link>
          </section>

          <section className="profile-section-card profile-network-card">
            <div className="profile-section-heading"><div><span className="profile-eyebrow">YOUR NEXT CONVERSATION</span><h2>Stay connected</h2></div><span className="profile-section-icon"><Users size={18} /></span></div>
            <p>Explore the community and meet people who share your interests.</p>
            <Link to="/#community">Explore people <ArrowRight size={15} /></Link>
          </section>

        </aside>
      </main>

      <nav className="profile-bottom-nav" aria-label="Main navigation">
        <button onClick={() => navigate("/")} type="button"><span className="profile-nav-icon"><House size={19} /></span><span className="profile-nav-label">Home</span></button>
        <button onClick={() => navigate("/#community")} type="button"><span className="profile-nav-icon"><Users size={19} /></span><span className="profile-nav-label">People</span></button>
        <button onClick={() => navigate("/#opportunities")} type="button"><span className="profile-nav-icon"><BriefcaseBusiness size={19} /></span><span className="profile-nav-label">Jobs</span></button>
        <button className="is-active" aria-current="page" onClick={() => navigate("/profile")} type="button"><span className="profile-nav-icon"><UserRound size={19} /></span><span className="profile-nav-label">Profile</span></button>
      </nav>
    </div>
  );
}
