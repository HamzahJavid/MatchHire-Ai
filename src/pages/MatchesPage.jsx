import { motion } from "framer-motion";
import MatchCard from "../components/MatchCard";
import "../styles/MatchesPage.css";

const recruiterMatches = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior React Developer",
    matchScore: 94,
    aiScore: 88,
    status: "Interview Pending",
  },
  {
    id: 2,
    name: "James Park",
    role: "Full Stack Engineer",
    matchScore: 89,
    aiScore: null,
    status: "Matched",
  },
  {
    id: 3,
    name: "Maya Johnson",
    role: "Frontend Developer",
    matchScore: 82,
    aiScore: 72,
    status: "Interview Done",
  },
];

const seekerMatches = [
  {
    id: 1,
    name: "TechFlow Inc.",
    role: "Senior React Developer",
    matchScore: 94,
    aiScore: 88,
    status: "Interview Scheduled",
  },
  {
    id: 2,
    name: "DataPulse",
    role: "Frontend Engineer",
    matchScore: 89,
    aiScore: null,
    status: "Matched",
  },
];

export default function MatchesPage({ role = "seeker" }) {
  const matches = role === "recruiter" ? recruiterMatches : seekerMatches;

  return (
    <div className="matches-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="matches-header">
          <h1>Your Matches</h1>
          <p>
            {role === "recruiter"
              ? "Candidates who matched with your job postings."
              : "Companies that matched with your profile."}
          </p>
        </div>

        {/* List */}
        <div className="matches-list">
          {matches.map((match) => (
            <MatchCard key={match.id} data={match} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
