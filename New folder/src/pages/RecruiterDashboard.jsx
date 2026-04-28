import React from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

const stats = [
  { label: "Active Jobs", value: "4", icon: Briefcase, color: "#ffd1c0" },
  { label: "Total Candidates", value: "128", icon: Users, color: "#ccede8" },
  { label: "Matches", value: "23", icon: MessageSquare, color: "#ffd1c0" },
  { label: "Match Rate", value: "72%", icon: TrendingUp, color: "#ccede8" },
];

const recentJobs = [
  {
    title: "Senior React Developer",
    applicants: 34,
    matches: 8,
    status: "Active",
  },
  { title: "UX Designer", applicants: 21, matches: 5, status: "Active" },
  { title: "Data Engineer", applicants: 18, matches: 3, status: "Paused" },
];

export default function RecruiterDashboard() {
  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-subtitle">
            Welcome back! Here's your hiring overview.
          </p>
        </div>
        <Link
          to="/dashboard/recruiter/post-job"
          className="btn-primary btn-primary-small"
        >
          <Plus size={15} /> Post New Job
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

      {/* Job postings */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Your Job Postings</h2>
          <button className="btn-ghost-small">View All</button>
        </div>
        <div className="job-list">
          {recentJobs.map((job) => (
            <div key={job.title} className="job-row">
              <div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-meta">
                  {job.applicants} applicants · {job.matches} matches
                </p>
              </div>
              <div className="job-row-right">
                <span
                  className={`status-badge ${job.status === "Active" ? "status-active" : "status-paused"}`}
                >
                  {job.status}
                </span>
                <ArrowRight size={16} className="job-arrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
