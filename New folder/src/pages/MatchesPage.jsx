import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MatchCard from "../components/MatchCard";
import { interviewAPI, matchAPI } from "../services/api";
import "../styles/MatchesPage.css";

export default function MatchesPage({ role = "seeker" }) {
  const [matches, setMatches] = useState([]);
  const [hirerJobs, setHirerJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      setLoading(true);
      setError("");
      try {
        const response = await matchAPI.getMatches(role === "recruiter" ? "hirer" : role, role === "recruiter" ? selectedJobId : null);
        if (!active) return;
        setMatches(response.data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load matches.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMatches();
    return () => {
      active = false;
    };
  }, []);

  async function handleTakeInterview(match) {
    if (role === "recruiter") {
      navigate("/dashboard/recruiter/interviews", { state: { matchId: match._id } });
      return;
    }
    try {
      setError("");
      const response = await interviewAPI.startRealInterview(match.jobId, match._id);
      const interviewId = response?.data?.interviewId;
      if (!interviewId) throw new Error("Interview could not be started.");
      navigate(`/dashboard/seeker/interviews/${interviewId}`, {
        state: { interview: response.data.interview || null },
      });
    } catch (err) {
      async function loadHirerJobs() {
        if (role !== 'recruiter') return;
        try {
          const res = await import('../services/api').then(m => m.jobsAPI.getMyJobs());
          if (!active) return;
          setHirerJobs(res.data || []);
          if ((res.data || []).length > 0 && !selectedJobId) setSelectedJobId((res.data || [])[0]._id);
        } catch (e) {
          // ignore
        }
      }

      setError(err.message || "Unable to start interview.");
      loadHirerJobs();
    }
  }

  function handleViewInterview(match) {
    if (!match.interviewId) return;
    navigate(`/dashboard/${role}/interviews/${match.interviewId}`);
  }

  function handleGenerateInterview(match) {
    navigate("/dashboard/recruiter/interviews", { state: { matchId: match._id } });
  }

  function handleMessage(match) {
    navigate(`/dashboard/${role}/messages`, { state: { matchId: match._id } });
  }

  const isRecruiter = role === "recruiter";
  const completedMatches = matches.filter(isCompletedMatch);
  const activeMatches = matches.filter((match) => !isCompletedMatch(match));

  function getContactEmail(match) {
    return isRecruiter ? match.seeker?.email : match.hirer?.email;
  }

  function getContactName(match) {
    return isRecruiter ? match.seeker?.fullName : match.hirer?.fullName;
  }

  function formatCompletedLabel(match) {
    const interview = match.interview || {};
    const date = interview.completedAt || interview.updatedAt || interview.createdAt;
    if (!date) return "Recently completed";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return "Recently completed";
    }
  }

  return (
    <div className="matches-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="matches-header">
          <h1>Your Matches</h1>
          <p>
            Live matches from the database with messaging and interview actions.
          </p>
        </div>

        {isRecruiter && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>Filter by job:</label>
            <select value={selectedJobId || ''} onChange={(e) => setSelectedJobId(e.target.value)}>
              <option value="">All jobs</option>
              {hirerJobs.map((j) => (
                <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="swipe-error">{error}</div>}

        {completedMatches.length > 0 && (
          <section className="matches-section">
            <div className="section-header">
              <h2>Completed</h2>
              <p>Interviews that were submitted and marked complete.</p>
            </div>

            <div className="completed-grid">
              {completedMatches.map((match) => (
                <article key={match._id} className="completed-match-card">
                  <div className="completed-card-top">
                    <div className="completed-card-info">
                      <div className="avatar completed-avatar">
                        {(getContactName(match) || match.name || "C").charAt(0)}
                      </div>
                      <div>
                        <h3>{getContactName(match) || match.name || "Completed match"}</h3>
                        <p>{match.role}</p>
                        <small>{match.subtitle}</small>
                      </div>
                    </div>

                    <span className="completed-badge">Completed</span>
                  </div>

                  <div className="completed-details">
                    <div className="detail-pill">
                      <span>Match score</span>
                      <strong>{match.matchScore}%</strong>
                    </div>
                    <div className="detail-pill">
                      <span>AI score</span>
                      <strong>{match.interview?.evaluation?.score ?? "—"}</strong>
                    </div>
                    <div className="detail-pill contact-pill">
                      <span>Contact email</span>
                      <strong>{getContactEmail(match) || "Not available"}</strong>
                    </div>
                  </div>

                  <div className="completed-footer">
                    <span className="completed-meta">Finished {formatCompletedLabel(match)}</span>
                    <button className="btn outline" onClick={() => handleViewInterview(match)}>
                      View Interview
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="matches-section">
          <div className="section-header">
            <h2>Matches</h2>
            <p>Active matches with live messaging and interview actions.</p>
          </div>

          <div className="matches-list">
          {loading ? (
            <div className="match-card">Loading matches…</div>
          ) : activeMatches.length > 0 ? (
            activeMatches.map((match) => (
              <MatchCard
                key={match._id}
                data={match}
                role={role}
                onMessage={() => handleMessage(match)}
                onViewInterview={() => handleViewInterview(match)}
                onTakeInterview={() => handleTakeInterview(match)}
                onGenerateInterview={() => handleGenerateInterview(match)}
              />
            ))
          ) : (
            <div className="match-card">
              <h3>No matches yet</h3>
              <p>Keep swiping to generate matches from the database.</p>
            </div>
          )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function isCompletedMatch(match) {
  const interview = match?.interview;
  return Boolean(interview && (interview.status === "completed" || interview.evaluation?.score != null));
}
