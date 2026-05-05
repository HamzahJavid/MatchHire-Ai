import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { interviewAPI, matchAPI } from "../services/api";
import "../styles/RecruiterPages.css";

export default function AIInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMatchId = location.state?.matchId || null;

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatchId);
  const [mode, setMode] = useState("ai");
  const [questionCount, setQuestionCount] = useState(6);
  const [manualQuestions, setManualQuestions] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdInterview, setCreatedInterview] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      setLoading(true);
      setError("");
      try {
        const response = await matchAPI.getMatches("hirer");
        if (!active) return;
        const list = response.data || [];
        setMatches(list);
        if (!selectedMatchId && list.length > 0) {
          setSelectedMatchId(list[0]._id);
        }
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

  const selectedMatch = useMemo(
    () => matches.find((match) => String(match._id) === String(selectedMatchId)) || null,
    [matches, selectedMatchId],
  );

  function updateManualQuestion(index, value) {
    setManualQuestions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleCreateInterview() {
    if (!selectedMatchId) {
      setError("Select a match first.");
      return;
    }

    const questions = manualQuestions.filter((q) => q.trim());
    if (mode === "manual" && questions.length === 0) {
      setError("Add at least one manual question.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload =
        mode === "ai"
          ? {
              questionCount,
              stage: "screening",
            }
          : {
              stage: "screening",
              questions,
            };

      const response = await interviewAPI.generateMatchInterview(selectedMatchId, mode, payload);
      const interview = response.data?.interview || null;
      setCreatedInterview(interview);
      setSuccess(
        mode === "ai"
          ? "AI interview generated and sent to the seeker."
          : "Manual interview posted and sent to the seeker.",
      );

      // Refresh matches so the interview action appears in the card
      const refreshed = await matchAPI.getMatches("hirer");
      setMatches(refreshed.data || []);
    } catch (err) {
      setError(err.message || "Failed to create interview.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenInterview() {
    if (!createdInterview?._id) return;
    navigate(`/dashboard/recruiter/interviews/${createdInterview._id}`);
  }

  return (
    <div className="recruiter-page">
      <header className="page-header">
        <div>
          <h1>Interview Center</h1>
          <p>
            Generate AI interview questions from the matched seeker profile or enter questions manually.
          </p>
        </div>
      </header>

      {error && <div className="swipe-error">{error}</div>}
      {success && <div className="swipe-success">{success}</div>}

      <div className="interview-panel" style={{ alignItems: "start" }}>
        <div className="interview-card" style={{ gridColumn: "1 / -1" }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <h2>Choose Match</h2>
          </div>

          <div className="session-list" style={{ marginBottom: 24 }}>
            {loading ? (
              <div className="session-row">Loading matches…</div>
            ) : matches.length > 0 ? (
              matches.map((match) => (
                <div
                  key={match._id}
                  className={`session-row ${String(selectedMatchId) === String(match._id) ? "active" : ""}`}
                  onClick={() => setSelectedMatchId(match._id)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <p className="session-name">{match.name || match.seeker?.fullName || "Candidate"}</p>
                    <p className="session-role">{match.role || match.job?.title || "Matched role"}</p>
                    <p className="session-role" style={{ maxWidth: 760, marginTop: 6 }}>
                      {match.job?.description || match.subtitle || "No description available."}
                    </p>
                  </div>
                  <div className="session-meta">
                    <span className="session-status status-scheduled">
                      {match.interviewId ? "Interview Ready" : "No Interview Yet"}
                    </span>
                    <span className="session-score">{match.matchScore || 0}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="session-row">No matches available.</div>
            )}
          </div>
        </div>

        <div className="interview-card">
          <div className="section-header">
            <h2>Interview Mode</h2>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <button
              className={`btn ${mode === "ai" ? "primary" : "outline"}`}
              onClick={() => setMode("ai")}
            >
              AI Interview
            </button>
            <button
              className={`btn ${mode === "manual" ? "primary" : "outline"}`}
              onClick={() => setMode("manual")}
            >
              Manual Questions
            </button>
          </div>

          {mode === "ai" ? (
            <div>
              <p className="summary-text" style={{ marginBottom: 16 }}>
                GPT will review the matched seeker profile and job description, then generate tailored interview questions.
              </p>
              <label className="metric-label">Number of questions</label>
              <input
                type="number"
                min="3"
                max="12"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 16,
                }}
              />
            </div>
          ) : (
            <div>
              <p className="summary-text" style={{ marginBottom: 16 }}>
                Enter the exact questions you want the seeker to answer.
              </p>
              {manualQuestions.map((question, index) => (
                <div key={index} style={{ marginBottom: 14 }}>
                  <label className="metric-label">Question {index + 1}</label>
                  <textarea
                    value={question}
                    onChange={(e) => updateManualQuestion(index, e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      resize: "vertical",
                    }}
                  />
                </div>
              ))}

              <button className="btn outline" onClick={() => setManualQuestions([...manualQuestions, ""]) }>
                + Add Question
              </button>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button className="btn primary" onClick={handleCreateInterview} disabled={submitting}>
              {submitting ? "Processing…" : mode === "ai" ? "Generate AI Interview" : "Post Manual Interview"}
            </button>
          </div>
        </div>

        <div className="interview-card interview-sessions">
          <div className="section-header">
            <h2>Selected Match Preview</h2>
          </div>

          {selectedMatch ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <p className="summary-label">Candidate</p>
                <h3>{selectedMatch.seeker?.fullName || selectedMatch.name || "Candidate"}</h3>
                <p className="summary-text">{selectedMatch.seekerProfile?.headline || selectedMatch.subtitle || "No headline available."}</p>
              </div>

              <div>
                <p className="summary-label">Job</p>
                <h3>{selectedMatch.job?.title || selectedMatch.role || "Matched role"}</h3>
                <p className="summary-text" style={{ whiteSpace: "pre-wrap" }}>
                  {selectedMatch.job?.description || "No description available."}
                </p>
              </div>

              {createdInterview && (
                <div style={{ marginTop: 10 }}>
                  <p className="summary-label">Latest Interview</p>
                  <p className="summary-text">Interview saved to database and shared with the seeker.</p>
                  <button className="btn outline" onClick={handleOpenInterview}>
                    View Candidate Answers
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="summary-text">Pick a match to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}
