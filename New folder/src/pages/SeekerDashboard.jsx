import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Brain,
  FileText,
  MessageSquare,
  Repeat,
  Target,
} from "lucide-react";
import { profileAPI } from "../services/api";

function formatMatchScore(score) {
  return `${Math.max(0, Math.min(100, Number(score || 0)))}%`;
}

function getInitials(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
}

function safeLink(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

export default function SeekerDashboard({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    user: currentUser || null,
    profile: null,
    topMatches: [],
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const response = await profileAPI.getProfile();
        if (!active) return;

        const data = response.data || response;
        setDashboard({
          user: data.user || currentUser || null,
          profile: data.profile || null,
          topMatches: data.topMatches || data.topJobs || [],
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load your dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const profile = dashboard.profile || {};
  const userName = dashboard.user?.fullName || currentUser?.fullName || "there";
  const initials = getInitials(userName);
  const strength = Number(profile.profileStrength || 0);
  const totalMatches = Number(profile.totalMatches || 0);
  const jobsSwiped = Array.isArray(profile.jobsSwiped) ? profile.jobsSwiped.length : 0;
  const aiScore = Number(profile.aiReadiness?.score || 0);
  const cv = profile.cv || {};
  const profileLinks = [
    { label: "GitHub", url: safeLink(profile.githubUrl) },
    { label: "LinkedIn", url: safeLink(profile.linkedinUrl) },
    { label: "Portfolio", url: safeLink(profile.portfolioUrl) },
  ].filter((item) => item.url);
  const greeting = `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${userName}`;

  const stats = [
    { label: "Profile Strength", value: formatMatchScore(strength), icon: Target, color: "#ffd1c0" },
    { label: "Jobs Swiped", value: String(jobsSwiped), icon: Repeat, color: "#ccede8" },
    { label: "Matches", value: String(totalMatches), icon: MessageSquare, color: "#ffd1c0" },
    { label: "AI Readiness", value: formatMatchScore(aiScore), icon: Brain, color: "#ccede8" },
  ];

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">{greeting}</h1>
          <p className="dash-page-subtitle">
            Your live matching summary is pulled from the database.
          </p>
        </div>
        <Link to="/dashboard/seeker/swipe" className="btn-primary btn-primary-small">
          <Repeat size={15} /> Start Swiping
        </Link>
      </div>

      {/* Profile summary card */}
      <div className="profile-summary">
        <div className="profile-left">
          <div className="avatar-large">{initials}</div>
          <div className="profile-meta">
            <h2 className="profile-name">{userName}</h2>
            {profile.headline && <p className="profile-title">{profile.headline}</p>}
            {profile.location && <p className="profile-location">{profile.location}</p>}
            {profile.summary && <p className="profile-summary-text">{profile.summary}</p>}
          </div>
        </div>
        <div className="profile-right">
          {profileLinks.length > 0 && (
            <div className="profile-links">
              {profileLinks.map(({ label, url }) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" className="profile-link-chip">
                  <span>{label}</span>
                </a>
              ))}
            </div>
          )}

          <div className="profile-file-card">
            <div className="profile-file-icon">
              <FileText size={18} />
            </div>
            <div className="profile-file-meta">
              <p className="profile-file-title">Resume</p>
              <p className="profile-file-name">{cv.fileName || "No resume uploaded yet"}</p>
              <p className="profile-file-subtitle">
                {cv.uploadedAt ? `Uploaded ${formatDate(cv.uploadedAt)}` : "Upload a resume to populate this section"}
              </p>
            </div>
            {cv.parseStatus && <span className={`profile-file-status status-${String(cv.parseStatus).toLowerCase()}`}>{cv.parseStatus}</span>}
          </div>

          <div className="profile-skills">
            {(profile.skills || []).slice(0, 8).map((s) => (
              <span key={s._id || s.name} className="skill-pill">{typeof s === 'object' ? s.name : s}</span>
            ))}
            {(profile.skills || []).length === 0 && <small className="muted">No skills listed yet</small>}
          </div>
          <div className="profile-actions">
            <Link to="/dashboard/seeker/profile" className="btn-outline">Edit Profile</Link>
            <Link to="/dashboard/seeker/resume" className="btn-ghost">Update Resume</Link>
          </div>
        </div>
      </div>

      {error && <div className="swipe-error">{error}</div>}

      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ background: stat.color }}>
              <stat.icon size={18} />
            </div>
            <p className="stat-value">{loading ? "…" : stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Top Matches for You</h2>
          <Link to="/dashboard/seeker/matches" className="btn-ghost-small">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="job-list">
            <div className="job-row">Loading your matches…</div>
          </div>
        ) : dashboard.topMatches.length > 0 ? (
          <div className="job-list">
            {dashboard.topMatches.map((job) => (
              <Link
                key={job.jobId}
                to="/dashboard/seeker/swipe"
                className="job-row"
                style={{ textDecoration: "none" }}
              >
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-meta">
                    {job.company} · {job.location || "Location not specified"}
                  </p>
                </div>
                <div className="job-row-right">
                  <span className="match-badge">{job.similarity ?? 0}%</span>
                  <ArrowUpRight size={16} className="job-arrow" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="job-list">
            <div className="job-row">
              <div>
                <h3 className="job-title">No matches yet</h3>
                <p className="job-meta">
                  Update your profile and start swiping to generate live matches.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
