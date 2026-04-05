import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mockCandidates = [
  {
    id: 1,
    title: "Sarah Chen",
    subtitle: "Senior React Developer · 5 yrs",
    location: "San Francisco",
    matchScore: 94,
    skills: ["React", "TypeScript", "GraphQL"],
    description:
      "Passionate frontend engineer with experience at startups and enterprise.",
  },
  {
    id: 2,
    title: "James Park",
    subtitle: "Full Stack Engineer · 4 yrs",
    location: "Remote",
    matchScore: 89,
    skills: ["React", "Node.js", "PostgreSQL"],
    description:
      "Product-minded engineer who loves building user-facing features.",
  },
  {
    id: 3,
    title: "Maya Johnson",
    subtitle: "Frontend Developer · 3 yrs",
    location: "New York",
    matchScore: 82,
    skills: ["React", "Tailwind", "Next.js"],
    description: "Creative developer with a background in design and UX.",
  },
];

const mockJobs = [
  {
    id: 1,
    title: "Senior React Developer",
    subtitle: "TechFlow Inc.",
    location: "Remote",
    matchScore: 94,
    skills: ["React", "TypeScript", "AWS"],
    description:
      "Build next-gen trading platform. Competitive salary + equity.",
  },
  {
    id: 2,
    title: "Frontend Engineer",
    subtitle: "DataPulse",
    location: "New York",
    matchScore: 89,
    skills: ["React", "GraphQL", "Testing"],
    description: "Join our analytics team building beautiful dashboards.",
  },
  {
    id: 3,
    title: "Full Stack Developer",
    subtitle: "Horizon Labs",
    location: "London",
    matchScore: 82,
    skills: ["React", "Node.js", "MongoDB"],
    description:
      "Early stage startup looking for a versatile founding engineer.",
  },
];

export default function SwipePage({ role = "seeker" }) {
  const cards = role === "recruiter" ? mockCandidates : mockJobs;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);

  function handleSwipe(direction) {
    setSwipeDirection(direction);
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 400);
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="swipe-container">
      <div className="swipe-header">
        <h1>{role === "recruiter" ? "Swipe Candidates" : "Swipe Jobs"}</h1>
        <p>
          {role === "recruiter"
            ? "Find your perfect candidate"
            : "Find your dream job"}
        </p>
      </div>

      <div className="swipe-card-wrapper">
        <AnimatePresence>
          {currentCard ? (
            <motion.div
              key={currentCard.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={
                swipeDirection === "right"
                  ? { x: 300, rotate: 12, opacity: 0 }
                  : swipeDirection === "left"
                    ? { x: -300, rotate: -12, opacity: 0 }
                    : { scale: 1, opacity: 1, x: 0, rotate: 0 }
              }
              transition={{ duration: 0.4 }}
              className="swipe-card"
            >
              {/* Header */}
              <div className="card-header">
                <div>
                  <h2>{currentCard.title}</h2>
                  <p>{currentCard.subtitle}</p>
                </div>
                <div className="match-score">{currentCard.matchScore}%</div>
              </div>

              {/* Location */}
              <p className="location">{currentCard.location}</p>

              {/* Description */}
              <p className="description">{currentCard.description}</p>

              {/* Skills */}
              <div className="skills">
                {currentCard.skills.map((skill) => (
                  <span key={skill} className="skill">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="card-count">
                Card {currentIndex + 1} of {cards.length}
              </div>
            </motion.div>
          ) : (
            <div className="swipe-card empty">
              <h3>All caught up!</h3>
              <p>Check back later for new matches.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      {currentCard && (
        <div className="swipe-actions">
          <button className="btn reject" onClick={() => handleSwipe("left")}>
            ✕
          </button>

          <button className="btn accept" onClick={() => handleSwipe("right")}>
            ❤️
          </button>
        </div>
      )}
    </div>
  );
}
