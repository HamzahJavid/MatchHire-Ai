import { motion } from "framer-motion";

export default function MatchCard({
  data,
  role = "seeker",
  onMessage,
  onViewInterview,
  onTakeInterview,
  onGenerateInterview,
}) {
  const statusClass = getStatusClass(data.status);
  const showInterview = Boolean(data.interviewId);
  const isRecruiter = role === "recruiter";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="match-card"
    >
      <div className="match-top">
        <div className="match-info">
          <div className="avatar">{(data.name || "M").charAt(0)}</div>
          <div>
            <h3>{data.name}</h3>
            <p>{data.role}</p>
            {data.subtitle && <small>{data.subtitle}</small>}
          </div>
        </div>

        <div className="match-stats">
          <div className="stat-block">
            <span className="score">{data.matchScore}%</span>
            <p>Match</p>
          </div>

          {(data.aiScore != null || data.interview?.evaluation?.score != null) && (
            <div className="stat-block">
            <span className="score ai">{data.aiScore ?? data.interview?.evaluation?.score}</span>
              <p>AI Score</p>
            </div>
          )}

          <span className={`status ${statusClass}`}>{data.status}</span>
        </div>
      </div>

      <div className="match-actions">
        <button className="btn" onClick={onMessage}>Message</button>

        {isRecruiter ? (
          showInterview ? (
            <button className="btn outline" onClick={onViewInterview}>
              View Interview
            </button>
          ) : (
            <button className="btn primary" onClick={onGenerateInterview}>
              Generate Interview
            </button>
          )
        ) : showInterview ? (
          <button className="btn outline" onClick={onViewInterview}>
            View Interview
          </button>
        ) : (
          <button className="btn primary" onClick={onTakeInterview}>
            Take Interview
          </button>
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
