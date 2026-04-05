import { useState } from "react";
import { motion } from "framer-motion";

const mockMessages = [
  {
    sender: "ai",
    text: "Welcome! I'm your AI interviewer. Can you explain useMemo vs useCallback in React?",
  },
  {
    sender: "user",
    text: "useMemo memoizes values, useCallback memoizes functions.",
  },
  {
    sender: "ai",
    text: "Good! When would you prefer useMemo over useCallback?",
  },
];

export default function AIPractice({ role = "seeker" }) {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);

  function handleSend() {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Nice answer. How would you optimize deeply nested state?",
        },
      ]);
    }, 1200);
  }

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

        {/* ===== SEEKER MODE ===== */}
        {role === "seeker" && !started ? (
          <div className="ai-start-card">
            <h2>Ready to Practice?</h2>
            <p>Start a mock interview and improve your technical skills.</p>

            <div className="ai-stats">
              <div>
                <h3>78</h3>
                <p>Score</p>
              </div>
              <div>
                <h3>12</h3>
                <p>Sessions</p>
              </div>
              <div>
                <h3>+8</h3>
                <p>Growth</p>
              </div>
            </div>

            <button className="btn primary" onClick={() => setStarted(true)}>
              ▶ Start Practice
            </button>
          </div>
        ) : role === "seeker" ? (
          /* ===== CHAT ===== */
          <div className="chat-box">
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`chat-row ${
                    msg.sender === "user" ? "user" : "ai"
                  }`}
                >
                  <div className="chat-bubble">{msg.text}</div>
                </motion.div>
              ))}
            </div>

            <div className="chat-input">
              <input
                value={input}
                placeholder="Type your answer..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend}>➤</button>
            </div>
          </div>
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
