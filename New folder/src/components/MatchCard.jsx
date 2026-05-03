import { motion } from "framer-motion";

export default function MatchCard({ data, role = "seeker" }) {
  const statusClass = getStatusClass(data.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="match-card"
    >
      <div className="match-top">
        <div className="match-info">
          <div className="avatar">{data.name.charAt(0)}</div>
          <div>
            <h3>{data.name}</h3>
            <p>{data.role}</p>
          </div>
        </div>

        <div className="match-stats">
          <div className="stat-block">
            <span className="score">{data.matchScore}%</span>
            <p>Match</p>
          </div>

          {data.aiScore != null && (
            <div className="stat-block">
              <span className="score ai">{data.aiScore}</span>
              <p>AI Score</p>
            </div>
          )}

          <span className={`status ${statusClass}`}>{data.status}</span>
        </div>
      </div>

      <div className="match-actions">
        <button className="btn">Message</button>

        {role === "recruiter" ? (
          data.aiScore === null ? (
            <button className="btn primary">Start AI Interview</button>
          ) : data.status.includes("Interview") && data.status !== "Matched" ? (
            <button className="btn outline">Schedule Final Round</button>
          ) : null
        ) : (
          data.aiScore === null ? (
            <button className="btn primary">Take AI Interview</button>
          ) : data.status.includes("Interview") && data.status !== "Matched" ? (
            <button className="btn outline">View Interview</button>
          ) : null
        )}
      </div>
    </motion.div>
  );
}

function getStatusClass(status) {
  if (status === "Matched") return "matched";
  if (status.includes("Interview")) return "interview";
  return "default";
}
