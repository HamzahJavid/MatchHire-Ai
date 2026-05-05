import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PracticeCard from "../components/PracticeCard";
import { interviewAPI, profileAPI } from "../services/api";
import "../styles/AIPractice.css";

export default function AIPractice({ role = "seeker" }) {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [evalResults, setEvalResults] = useState(null);
  const [showResults, setShowResults] = useState(false);


  // Load profile on mount
  useEffect(() => {
    if (role === "seeker") {
      loadProfile();
    }
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const startPractice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate questions based on profile
      const result = await interviewAPI.generatePractice(
        profile?.headline?.split(" - ")[0] || "General",
        profile?.bio || "",
        profile?.totalYearsOfExperience?.toString() || "0",
        profile?.skills?.map((s) => s.name) || [],
        "mid",
        null,
        "practice"
      );

      setInterviewId(result.data.interviewId);
      setQuestions(result.data.questions);
      setAnswers(new Array(result.data.questions.length).fill(""));
      setCurrentQuestionIndex(0);
      setStarted(true);
    } catch (err) {
      setError(err.message || "Failed to generate practice questions");
      console.error("Error starting practice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);
      setCurrentAnswer("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered, time to evaluate
        submitForEvaluation(newAnswers);
      }
    }
  };

  const submitForEvaluation = async (finalAnswers) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare Q&A pairs
      const qna = questions.map((q, idx) => ({
        questionId: q.questionId,
        question: q.text,
        answer: finalAnswers[idx] || "",
      }));

      // Evaluate
      const result = await interviewAPI.evaluateTest(interviewId, qna, "");

      setEvalResults(result.data.aiResult);
      setShowResults(true);
    } catch (err) {
      setError(err.message || "Failed to evaluate interview");
      console.error("Error evaluating:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer || "(Skipped)";
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitForEvaluation(newAnswers);
    }
  };

  const resetPractice = () => {
    setStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setInterviewId(null);
    setQuestions([]);
    setEvalResults(null);
    setShowResults(false);
    setError(null);
  };

  return (
    <div className="ai-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="ai-header">
          <h1>
            {role === "seeker" ? "AI Practice Interview" : "AI Interview Setup"}
          </h1>
          <p>
            {role === "seeker"
              ? "Practice and improve your readiness."
              : "Configure AI screening for candidates."}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-banner"
            style={{
              padding: "12px 16px",
              margin: "0 0 20px 0",
              background: "#fee",
              color: "#c00",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </motion.div>
        )}

        {/* ===== SEEKER MODE - STARTUP ===== */}
        {role === "seeker" && !started && !showResults ? (
          <PracticeCard
            title="Ready to Practice?"
            description="Our AI will conduct a mock technical interview based on your profile and skills. You'll receive a detailed feedback report and an updated readiness score."
            stats={[
              { value: profile?.aiReadiness?.score || "—", label: "Current Score" },
              { value: profile?.interviews?.length || "0", label: "Sessions" },
              { value: "+8%", label: "Potential Improvement" },
            ]}
            buttonText={loading ? "⏳ Generating..." : "▶ Start Practice Session"}
            onAction={startPractice}
            disabled={loading}
          />
        ) : role === "seeker" && started && !showResults ? (
          /* ===== SEEKER MODE - INTERVIEW ===== */
          <div className="interview-container">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="interview-card"
            >
              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question */}
              <div className="question-section">
                <h2>{questions[currentQuestionIndex]?.text}</h2>
                <p className="question-hint">
                  Take your time to provide a thoughtful answer. Speak naturally as you would in a real interview.
                </p>
              </div>

              {/* Answer Input */}
              <div className="answer-section">
                <textarea
                  value={currentAnswer}
                  placeholder="Type your answer here..."
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleNextQuestion();
                    }
                  }}
                  className="answer-input"
                />
                <p className="input-hint">Press Ctrl+Enter to move to next question</p>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn outline"
                  onClick={handleSkipQuestion}
                  disabled={loading}
                >
                  Skip Question
                </button>
                <button
                  className="btn primary"
                  onClick={handleNextQuestion}
                  disabled={loading || !currentAnswer.trim()}
                >
                  {loading ? "⏳ Processing..." : currentQuestionIndex === questions.length - 1 ? "Submit & Evaluate" : "Next Question"}
                </button>
              </div>
            </motion.div>
          </div>
        ) : role === "seeker" && showResults ? (
          /* ===== SEEKER MODE - RESULTS ===== */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="results-container"
          >
            <div className="results-card">
              <div className="results-header">
                <h1>Interview Results</h1>
                <p>Your AI Readiness Assessment</p>
              </div>

              <div className="score-display">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="score-circle"
                >
                  <div className="score-number">{evalResults?.score || "—"}</div>
                  <div className="score-label">Overall Score</div>
                </motion.div>
              </div>

              {evalResults?.breakdown && (
                <div className="breakdown-section">
                  <h2>Score Breakdown</h2>
                  <div className="breakdown-grid">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Communication</span>
                      <span className="breakdown-value">{evalResults.breakdown.communication || "—"}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Technical</span>
                      <span className="breakdown-value">{evalResults.breakdown.technical || "—"}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Fit</span>
                      <span className="breakdown-value">{evalResults.breakdown.fit || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {evalResults?.comment && (
                <div className="feedback-section">
                  <h2>AI Feedback</h2>
                  <p>{evalResults.comment}</p>
                </div>
              )}

              <div className="action-buttons">
                <button className="btn outline" onClick={resetPractice}>
                  Back to Dashboard
                </button>
                <button className="btn primary" onClick={startPractice}>
                  Practice Again
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ===== RECRUITER MODE ===== */
          <div className="ai-config">
            <div className="config-card">
              <h2>Screening Questions</h2>

              {[
                "Explain your approach to state management.",
                "Describe a challenging bug you fixed.",
                "How do you handle code reviews?",
              ].map((q, i) => (
                <div key={i} className="question">
                  <span>Q{i + 1}</span>
                  <p>{q}</p>
                </div>
              ))}

              <button className="btn">+ Add Question</button>
            </div>

            <div className="config-card">
              <h2>Evaluation Criteria</h2>

              <div className="criteria">
                <div>
                  <h3>40%</h3>
                  <p>Technical</p>
                </div>
                <div>
                  <h3>35%</h3>
                  <p>Communication</p>
                </div>
                <div>
                  <h3>25%</h3>
                  <p>Problem Solving</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
