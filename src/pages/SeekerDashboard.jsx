import React from "react";
import { Link } from "react-router-dom";
import {
  Repeat,
  Target,
  Brain,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

const stats = [
  { label: "Profile Strength", value: "85%", icon: Target, color: "#ffd1c0" },
  { label: "Jobs Swiped", value: "42", icon: Repeat, color: "#ccede8" },
  { label: "Matches", value: "7", icon: MessageSquare, color: "#ffd1c0" },
  { label: "AI Readiness", value: "78%", icon: Brain, color: "#ccede8" },
];

const recommendedJobs = [
  {
    title: "Frontend Developer",
    company: "TechFlow",
    match: 94,
    location: "Remote",
  },
  {
    title: "React Engineer",
    company: "DataPulse",
    match: 89,
    location: "New York",
  },
  {
    title: "Full Stack Developer",
    company: "Horizon",
    match: 82,
    location: "London",
  },
];

export default function SeekerDashboard() {
  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-subtitle">Your job matching overview.</p>
        </div>
        <Link
          to="/dashboard/seeker/swipe"
          className="btn-primary btn-primary-small"
        >
          <Repeat size={15} /> Start Swiping
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ background: stat.color }}>
              <stat.icon size={18} />
            </div>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recommended Jobs */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Top Matches for You</h2>
          <Link to="/dashboard/seeker/swipe" className="btn-ghost-small">
            View All
          </Link>
        </div>
        <div className="job-list">
          {recommendedJobs.map((job) => (
            <div key={job.title} className="job-row">
              <div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-meta">
                  {job.company} · {job.location}
                </p>
              </div>
              <div className="job-row-right">
                <span className="match-badge">{job.match}%</span>
                <ArrowUpRight size={16} className="job-arrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
