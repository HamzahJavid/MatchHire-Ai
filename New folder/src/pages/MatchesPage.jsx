import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MatchCard from "../components/MatchCard";
import { interviewAPI, matchAPI } from "../services/api";
import "../styles/MatchesPage.css";

export default function MatchesPage({ role = "seeker" }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      setLoading(true);
      setError("");
      try {
        const response = await matchAPI.getMatches(role === "recruiter" ? "hirer" : role);
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
      setError(err.message || "Unable to start interview.");
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

  const seekerMatches = matches;

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

        {error && <div className="swipe-error">{error}</div>}

        <div className="matches-list">
          {loading ? (
            <div className="match-card">Loading matches…</div>
          ) : seekerMatches.length > 0 ? (
            seekerMatches.map((match) => (
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
      </motion.div>
    </div>
  );
}
