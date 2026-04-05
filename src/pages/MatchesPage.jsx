import { useState } from "react";
import { motion } from "framer-motion";

const recruiterMatches = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior React Developer",
    matchScore: 94,
    aiScore: 88,
    status: "Interview Pending",
  },
  {
    id: 2,
    name: "James Park",
    role: "Full Stack Engineer",
    matchScore: 89,
    aiScore: null,
    status: "Matched",
  },
  {
    id: 3,
    name: "Maya Johnson",
    role: "Frontend Developer",
    matchScore: 82,
    aiScore: 72,
    status: "Interview Done",
  },
];

const seekerMatches = [
  {
    id: 1,
    name: "TechFlow Inc.",
    role: "Senior React Developer",
    matchScore: 94,
    aiScore: 88,
    status: "Interview Scheduled",
  },
  {
    id: 2,
    name: "DataPulse",
    role: "Frontend Engineer",
    matchScore: 89,
    aiScore: null,
    status: "Matched",
  },
];

export default function MatchesPage({ role = "seeker" }) {
  const matches = role === "recruiter" ? recruiterMatches : seekerMatches;

  return (
    <div className="matches-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="matches-header">
          <h1>Your Matches</h1>
          <p>
            {role === "recruiter"
              ? "Candidates who matched with your job postings."
              : "Companies that matched with your profile."}
          </p>
        </div>

        {/* List */}
        <div className="matches-list">
          {matches.map((match) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="match-card"
            >
              <div className="match-top">
                <div className="match-info">
                  <div className="avatar">{match.name.charAt(0)}</div>

                  <div>
                    <h3>{match.name}</h3>
                    <p>{match.role}</p>
                  </div>
                </div>

                <div className="match-stats">
                  <div>
                    <span className="score">{match.matchScore}%</span>
                    <p>Match</p>
                  </div>

                  {match.aiScore && (
                    <div>
                      <span className="score ai">{match.aiScore}</span>
                      <p>AI Score</p>
                    </div>
                  )}

                  <span className={`status ${getStatusClass(match.status)}`}>
                    {match.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="match-actions">
                <button className="btn">💬 Message</button>

                {match.aiScore === null && (
                  <button className="btn primary">🎥 Start AI Interview</button>
                )}

                {match.status.includes("Interview") &&
                  match.status !== "Matched" && (
                    <button className="btn outline">
                      📅 Schedule Final Round
                    </button>
                  )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* Helper */
function getStatusClass(status) {
  if (status === "Matched") return "matched";
  if (status.includes("Interview")) return "interview";
  return "default";
}
