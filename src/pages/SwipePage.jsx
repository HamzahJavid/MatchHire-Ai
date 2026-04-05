import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JobCard from "../components/JobCard";
import "../styles/SwipePage.css";

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

  function handleSwipe(direction) {
    if (currentIndex < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="swipe-page-container">
      <div className="swipe-header">
        <h1>{role === "recruiter" ? "Swipe Candidates" : "Swipe Jobs"}</h1>
        <p>
          {role === "recruiter"
            ? "Find your perfect candidate"
            : "Find your dream job"}
        </p>
      </div>

      <div className="swipe-card-wrapper">
        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key={currentCard.id}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="motion-wrapper"
            >
              <JobCard 
                data={currentCard} 
                cardIndex={currentIndex + 1} 
                totalCards={cards.length} 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="no-more-cards"
            >
              <h3>No more {role === "recruiter" ? "candidates" : "jobs"}!</h3>
              <p>Check back later or update your profile.</p>
              <button 
                className="reset-btn"
                onClick={() => setCurrentIndex(0)}
              >
                Start Over
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentCard && (
        <div className="swipe-actions">
          <button 
            className="swipe-btn reject" 
            onClick={() => handleSwipe("left")}
            aria-label="Reject"
          >
            <span className="icon">✕</span>
          </button>
          <button 
            className="swipe-btn accept" 
            onClick={() => handleSwipe("right")}
            aria-label="Accept"
          >
            <span className="icon">❤</span>
          </button>
        </div>
      )}
    </div>
  );
}
