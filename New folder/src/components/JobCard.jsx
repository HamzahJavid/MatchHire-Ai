import React from "react";
import { motion } from "framer-motion";

export default function JobCard({ data, cardIndex, totalCards }) {
  if (!data) return null;

  return (
    <div className="swipe-card">
      <div className="card-top">
        <div className="card-info">
          <h2 className="card-title">{data.title}</h2>
          <p className="card-subtitle">{data.subtitle}</p>
        </div>
        <div className="match-badge">
          {data.matchScore}%
        </div>
      </div>

      <div className="card-location">
        <span className="location-icon"></span>
        <span>{data.location}</span>
      </div>

      <div className="card-description">
        {data.description}
      </div>

      <div className="card-footer">
        <div className="card-tags">
          {data.skills?.map((skill, index) => (
            <span key={index} className="card-tag">
              {skill}
            </span>
          ))}
        </div>
        <div className="card-counter">
          Card {cardIndex} of {totalCards}
        </div>
      </div>
    </div>
  );
}
