import { useState } from "react";
import "../styles/RecruiterPages.css";

const sessions = [
  {
    id: 1,
    candidate: "Sarah Chen",
    role: "Senior React Developer",
    status: "Completed",
    score: 88,
  },
  {
    id: 2,
    candidate: "James Park",
    role: "Full Stack Engineer",
    status: "Scheduled",
    score: 0,
  },
  {
    id: 3,
    candidate: "Maya Johnson",
    role: "Frontend Developer",
    status: "In Progress",
    score: 74,
  },
];

export default function AIInterview() {
  const [activeSession, setActiveSession] = useState(null);

  return (
    <div className="recruiter-page">
      <header className="page-header">
        <div>
          <h1>AI Interview Center</h1>
          <p>Monitor candidate interviews and review readiness scores.</p>
        </div>
      </header>

      <div className="interview-panel">
        <div className="interview-card">
          <div className="interview-summary">
            <div>
              <p className="summary-label">Next Interview</p>
              <h2>AI Screening Session</h2>
              <p className="summary-text">
                Start a new AI interview or review recent candidate performance.
              </p>
            </div>
            <button className="btn primary">Start New Interview</button>
          </div>

          <div className="interview-metrics">
            <div>
              <p className="metric-label">Average Score</p>
              <h3>82</h3>
            </div>
            <div>
              <p className="metric-label">Completed</p>
              <h3>14</h3>
            </div>
            <div>
              <p className="metric-label">Improvement</p>
              <h3>+12%</h3>
            </div>
          </div>
        </div>

        <div className="interview-card interview-sessions">
          <div className="section-header">
            <h2>Recent Interview Sessions</h2>
            <button className="btn outline">View All</button>
          </div>
          <div className="session-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-row">
                <div>
                  <p className="session-name">{session.candidate}</p>
                  <p className="session-role">{session.role}</p>
                </div>
                <div className="session-meta">
                  <span className={`session-status status-${session.status.toLowerCase().replace(/ /g, "-")}`}>
                    {session.status}
                  </span>
                  <span className="session-score">
                    {session.score ? `${session.score}%` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
