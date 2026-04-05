import React from "react";

export default function PracticeCard({ title, description, stats, buttonText, onAction }) {
  return (
    <section className="practice-card">
      <div className="practice-icon">🧠</div>
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="practice-stats">
        {stats.map((item, index) => (
          <div key={index} className="practice-stat-card">
            <span className="practice-stat-value">{item.value}</span>
            <span className="practice-stat-label">{item.label}</span>
          </div>
        ))}
      </div>

      <button className="practice-action-btn" onClick={onAction}>
        {buttonText}
      </button>
    </section>
  );
}
