import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../services/api";
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

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      setLoadingJobs(true);
      setError("");
      try {
        const response = await jobsAPI.getMyJobs();
        if (!active) return;
        const list = response.data || [];
        setJobs(list);
        setSelectedJob(list[0] || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load your job postings.");
      } finally {
        if (active) setLoadingJobs(false);
      }
    }

    loadJobs();
    return () => {
      active = false;
    };
  }, []);

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
        {error && <div className="swipe-error">{error}</div>}
        <div className="job-list">
          {loadingJobs ? (
            <div className="job-row">Loading jobs…</div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job._id}
                className={`job-row ${selectedJob?._id === job._id ? "active" : ""}`}
                onClick={() => setSelectedJob(job)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-meta">
                    {job.stats?.totalCandidates || 0} candidates · {job.stats?.totalMatches || 0} matches
                  </p>
                </div>
                <div className="job-row-right">
                  <span
                    className={`status-badge ${job.status === "active" ? "status-active" : "status-paused"}`}
                  >
                    {job.status}
                  </span>
                  <ArrowRight size={16} className="job-arrow" />
                </div>
              </div>
            ))
          ) : (
            <div className="job-row">No jobs posted yet.</div>
          )}
        </div>

        {selectedJob && (
          <div className="job-description-panel" style={{ marginTop: 24, padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <h3 className="job-title" style={{ marginBottom: 8 }}>{selectedJob.title}</h3>
            <p className="job-meta" style={{ marginBottom: 16 }}>
              {selectedJob.company} · {selectedJob.location?.city || "Remote"}
            </p>
            <p style={{ lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" }}>{selectedJob.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
