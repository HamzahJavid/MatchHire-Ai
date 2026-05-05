import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { interviewAPI } from "../services/api";
import "../styles/ViewInterview.css";

export default function ViewInterviewPage({ interviewId, matchId, onClose, interview, role = "seeker" }) {
  const [data, setData] = useState(interview);
  const [loading, setLoading] = useState(!interview);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [newQuestions, setNewQuestions] = useState([""]);
  const [postingQuestions, setPostingQuestions] = useState(false);

  // Load interview if not provided
  useEffect(() => {
    if (!data && interviewId && role === "seeker") {
      loadInterview();
    } else if (!data && matchId && role === "hirer") {
      loadInterviewByMatch();
    }
  }, [interviewId, matchId, role]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const result = await interviewAPI.getInterview(interviewId);
      setData(result.data);
    } catch (err) {
      setError(err.message || "Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewByMatch = async () => {
    try {
      setLoading(true);
      const result = await interviewAPI.getInterviewByMatch(matchId);
      setData(result.data);
    } catch (err) {
      setError(err.message || "Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const submitAnswers = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const answersList = (data.questions || []).map((q) => ({
        questionId: q.questionId,
        question: q.text,
        answer: answers[q.questionId] || "",
      }));

      if (answersList.some((a) => !a.answer.trim())) {
        setError("Please answer all questions");
        return;
      }

      await interviewAPI.submitAnswers(interviewId, answersList);

      // Reload interview to show updated status
      await loadInterview();
      setAnswers({});
    } catch (err) {
      setError(err.message || "Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  const postInterviewQuestions = async () => {
    try {
      setPostingQuestions(true);
      setError(null);

      const questions = newQuestions.filter((q) => q.trim());
      if (questions.length === 0) {
        setError("Please add at least one question");
        return;
      }

      await interviewAPI.postQuestions(matchId, questions, "screening");

      // Reload interview to show posted questions
      await loadInterviewByMatch();
      setNewQuestions([""]);
    } catch (err) {
      setError(err.message || "Failed to post questions");
    } finally {
      setPostingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="view-interview-container">
        <div style={{ textAlign: "center", padding: "40px" }}>⏳ Loading interview...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="view-interview-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}>
          Interview not found
        </div>
      </div>
    );
  }

  const isCompleted = data.status === "completed";
  const isScheduled = data.status === "scheduled";
  const isPending = data.status === "scheduled" || !data.responses?.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="view-interview-page"
    >
      {/* Header */}
      <div className="interview-page-header">
        <div>
          <h1>{data.role || "Interview"}</h1>
          <p className="interview-meta">
            {data.type === "real" ? "🎯 Real Interview" : "🧪 Practice"} • {data.stage}
          </p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "#fee", color: "#c00", padding: "12px 16px", borderRadius: "8px", margin: "0 0 20px 0" }}>
          {error}
        </div>
      )}

      {/* ===== SEEKER VIEW ===== */}
      {role === "seeker" && (
        <>
          {/* Status Badge */}
          <div className={`interview-status-badge status-${data.status}`}>
            <span>{data.status.toUpperCase()}</span>
          </div>

          {/* Questions to Answer */}
          {!isCompleted && data.questions?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seeker-interview-section">
              <h2>Interview Questions</h2>
              <p className="section-subtitle">Answer all questions below. Take your time.</p>

              <div className="questions-grid">
                {data.questions.map((question, index) => (
                  <motion.div
                    key={question.questionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="interview-question-card"
                  >
                    <div className="question-header">
                      <span className="question-badge">Q{index + 1}</span>
                      <h3>{question.text}</h3>
                    </div>

                    <textarea
                      placeholder="Type your answer here..."
                      value={answers[question.questionId] || ""}
                      onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
                      className="answer-textarea"
                      rows="6"
                    />

                    <div className="char-count">
                      {(answers[question.questionId] || "").length} characters
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="interview-actions">
                <button className="btn outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={submitAnswers}
                  disabled={submitting || !Object.values(answers).some((a) => a?.trim())}
                >
                  {submitting ? "⏳ Submitting..." : "✓ Submit Answers"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Submitted Answers View */}
          {isCompleted && data.responses?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="submitted-answers-section">
              <h2>Your Answers</h2>

              <div className="submitted-qa-list">
                {data.questions?.map((question, index) => {
                  const response = data.responses?.find((r) => r.questionId === question.questionId);
                  const isExp = expandedQuestion === index;

                  return (
                    <motion.div
                      key={question.questionId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`qa-item ${isExp ? "expanded" : ""}`}
                    >
                      <div
                        className="qa-header"
                        onClick={() => setExpandedQuestion(isExp ? null : index)}
                      >
                        <div>
                          <span className="qa-number">Q{index + 1}</span>
                          <span className="qa-question">{question.text}</span>
                        </div>
                        <span className="expand-arrow">{isExp ? "▲" : "▼"}</span>
                      </div>

                      {isExp && response && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="qa-body">
                          <div className="qa-answer">
                            <strong>Your Answer:</strong>
                            <p>{response.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ===== HIRER VIEW ===== */}
      {role === "hirer" && (
        <>
          {/* Candidate Info */}
          {data.seeker && (
            <div className="candidate-info">
              <div>
                <h3>{data.seeker.fullName}</h3>
                <p>{data.seekerProfile?.headline || "Job seeker"}</p>
              </div>
              <div className="candidate-meta">
                <span>{data.seeker.email}</span>
              </div>
            </div>
          )}

          {/* Questions Sent / Awaiting Answers */}
          {!data.responses?.length && data.questions?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hirer-section">
              <h2>Questions Sent</h2>
              <p className="section-subtitle">The candidate will see these questions and submit answers here.</p>

              <div className="hirer-qa-list">
                {data.questions.map((question, index) => (
                  <div key={question.questionId || index} className="hirer-qa-item">
                    <div className="hirer-qa-header" style={{ cursor: "default" }}>
                      <div>
                        <span className="qa-num">Q{index + 1}</span>
                        <span className="qa-q">{question.text}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hirer-actions" style={{ marginTop: 20 }}>
                <button className="btn outline" onClick={onClose}>Back</button>
              </div>
            </motion.div>
          )}

          {/* View Answers Section */}
          {data.responses?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hirer-section">
              <h2>Candidate Answers</h2>

              <div className="hirer-qa-list">
                {data.questions?.map((question, index) => {
                  const response = data.responses?.find((r) => r.questionId === question.questionId);
                  const isExp = expandedQuestion === index;

                  return (
                    <motion.div
                      key={question.questionId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hirer-qa-item ${isExp ? "expanded" : ""}`}
                    >
                      <div
                        className="hirer-qa-header"
                        onClick={() => setExpandedQuestion(isExp ? null : index)}
                      >
                        <div>
                          <span className="qa-num">Q{index + 1}</span>
                          <span className="qa-q">{question.text}</span>
                        </div>
                        <span className="arrow">{isExp ? "▲" : "▼"}</span>
                      </div>

                      {isExp && response && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="hirer-qa-body">
                          <div className="hirer-answer">
                            <strong>Candidate's Answer:</strong>
                            <p>{response.answer}</p>
                            {response.recordedAt && (
                              <small>Answered {new Date(response.recordedAt).toLocaleString()}</small>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Status Info */}
          <div className="interview-status-info">
            <span className={`status-badge status-${data.status}`}>{data.status.toUpperCase()}</span>
            {isCompleted && data.completedAt && (
              <span className="status-time">Submitted on {new Date(data.completedAt).toLocaleDateString()}</span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
