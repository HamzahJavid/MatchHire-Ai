import { useState } from "react";
import { motion } from "framer-motion";
import "../styles/ViewInterview.css";

export default function ViewInterviewPage({ interviewId, onClose, interview }) {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Mock interview if not provided
  const mockInterview = interview || {
    _id: "interview_1",
    role: "Senior React Developer",
    type: "real",
    stage: "technical",
    status: "completed",
    evaluation: {
      score: 87,
      breakdown: {
        communication: 88,
        technical: 89,
        fit: 84,
      },
      comment: "Excellent technical knowledge with clear communication. Strong candidate for the role.",
      strengths: ["Deep React expertise", "Clear communication", "Good problem-solving"],
      improvements: ["Could provide more specific examples"],
    },
    questions: [
      { questionId: "q_1", text: "Tell me about your experience as a Senior React Developer." },
      { questionId: "q_2", text: "Explain the difference between useMemo and useCallback." },
      { questionId: "q_3", text: "How would you optimize a deeply nested component tree?" },
    ],
    responses: [
      {
        questionId: "q_1",
        question: "Tell me about your experience as a Senior React Developer.",
        answer: "I have 3 years of professional experience building React applications. I've led frontend teams and mentored junior developers.",
        durationSeconds: 60,
      },
      {
        questionId: "q_2",
        question: "Explain the difference between useMemo and useCallback.",
        answer: "useMemo memoizes return values, while useCallback memoizes function references. Both are used to prevent unnecessary re-renders.",
        durationSeconds: 45,
      },
      {
        questionId: "q_3",
        question: "How would you optimize a deeply nested component tree?",
        answer: "I would use memoization with React.memo, extract derived state, and consider splitting into smaller components.",
        durationSeconds: 55,
      },
    ],
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  };

  const data = interview || mockInterview;
  const isCompleted = data.status === "completed";
  const isScheduled = data.status === "scheduled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="view-interview-container"
    >
      {/* Header */}
      <div className="view-interview-header">
        <div>
          <h1>{data.role}</h1>
          <p className="interview-type">
            {data.type === "real" ? "🎯 Real Job Interview" : "🧪 Practice Interview"} • {data.stage}
          </p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Status */}
      <div className={`interview-status status-${data.status}`}>
        <span className="status-badge">{data.status.toUpperCase()}</span>
        {isCompleted && data.completedAt && (
          <span className="status-time">
            Completed {new Date(data.completedAt).toLocaleDateString()}
          </span>
        )}
        {isScheduled && data.scheduledAt && (
          <span className="status-time">
            Scheduled for {new Date(data.scheduledAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Evaluation Results (if completed) */}
      {isCompleted && data.evaluation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="evaluation-results"
        >
          <h2>Interview Results</h2>

          {/* Score Section */}
          <div className="score-section">
            <div className="main-score">
              <div className="score-circle">
                <span className="score-value">{data.evaluation.score}</span>
                <span className="score-label">Overall Score</span>
              </div>
              <div className="score-comment">
                <p>{data.evaluation.comment}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="score-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-header">
                  <span>Communication</span>
                  <span className="breakdown-score">{data.evaluation.breakdown.communication}</span>
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${data.evaluation.breakdown.communication}%` }}
                  ></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-header">
                  <span>Technical</span>
                  <span className="breakdown-score">{data.evaluation.breakdown.technical}</span>
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${data.evaluation.breakdown.technical}%` }}
                  ></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-header">
                  <span>Fit</span>
                  <span className="breakdown-score">{data.evaluation.breakdown.fit}</span>
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${data.evaluation.breakdown.fit}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="feedback-section">
            {data.evaluation.strengths && data.evaluation.strengths.length > 0 && (
              <div className="feedback-box strengths">
                <h3>✨ Strengths</h3>
                <ul>
                  {data.evaluation.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.evaluation.improvements && data.evaluation.improvements.length > 0 && (
              <div className="feedback-box improvements">
                <h3>📈 Areas for Improvement</h3>
                <ul>
                  {data.evaluation.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Questions & Responses */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="questions-section"
      >
        <h2>Questions & Responses</h2>

        <div className="questions-list">
          {data.questions && data.questions.map((question, index) => {
            const response = data.responses?.find(
              (r) => r.questionId === question.questionId
            );
            const isExpanded = expandedQuestion === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`question-item ${isExpanded ? "expanded" : ""}`}
              >
                <div
                  className="question-header"
                  onClick={() =>
                    setExpandedQuestion(isExpanded ? null : index)
                  }
                >
                  <div className="question-label">
                    <span className="question-number">Q{index + 1}</span>
                    <span className="question-text">{question.text}</span>
                  </div>
                  {response && (
                    <span className="response-badge">
                      {response.durationSeconds}s
                    </span>
                  )}
                  <span className={`expand-icon ${isExpanded ? "open" : ""}`}>
                    ▼
                  </span>
                </div>

                {isExpanded && response && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="question-content"
                  >
                    <div className="response-box">
                      <h4>Your Response:</h4>
                      <p>{response.answer}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="interview-actions">
        {isCompleted && (
          <>
            <button className="btn outline">📥 Download Report</button>
            <button className="btn primary">🔄 Retake Interview</button>
          </>
        )}
        {isScheduled && (
          <>
            <button className="btn outline">📅 Reschedule</button>
            <button className="btn primary">▶ Start Interview</button>
          </>
        )}
      </div>
    </motion.div>
  );
}
