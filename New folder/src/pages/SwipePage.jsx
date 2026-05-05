import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JobCard from "../components/JobCard";
import "../styles/SwipePage.css";
import { jobsAPI, swipeAPI } from "../services/api";

export default function SwipePage({ role = "seeker" }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [hirerJobs, setHirerJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setError("");
    setMessage("");
    if (role === "recruiter") {
      loadHirerJobs();
    } else {
      loadJobCards();
    }
  }, [role]);

  useEffect(() => {
    if (role === "recruiter" && selectedJobId) {
      loadCandidateCards(selectedJobId);
    }
  }, [role, selectedJobId]);

  async function loadJobCards() {
    setLoading(true);
    setError("");
    try {
      const response = await jobsAPI.getClosestJobs();
      const items = response.data || [];
      const mapped = items.map((job) => ({
        id: job.jobId,
        title: job.title,
        subtitle: job.company || "",
        location: job.location || "",
        matchScore: job.similarity || 0,
        description: job.description || "",
        skills: (job.requiredSkills || []).map((skill) =>
          typeof skill === "string" ? skill : skill?.name || "",
        ).filter(Boolean),
        jobId: job.jobId,
      }));
      setCards(mapped);
    } catch (err) {
      setError(err.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
      setCurrentIndex(0);
    }
  }

  async function loadHirerJobs() {
    setJobLoading(true);
    setError("");
    try {
      const response = await jobsAPI.getMyJobs();
      const items = response.data || [];
      setHirerJobs(items);
      if (items.length > 0) {
        setSelectedJobId(items[0]._id);
      } else {
        setSelectedJobId(null);
        setCards([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load your jobs.");
    } finally {
      setJobLoading(false);
    }
  }

  async function loadCandidateCards(jobId) {
    setLoading(true);
    setError("");
    try {
      const response = await jobsAPI.getCandidates(jobId);
      const items = response.data || [];
      const mapped = items.map((candidate, index) => ({
        id: candidate.profileId || index,
        title: candidate.candidateName || "Candidate",
        subtitle: candidate.role || "",
        location: candidate.location || "",
        matchScore: candidate.similarity || 0,
        description: candidate.description || "",
        skills: candidate.skills || [],
        profileId: candidate.profileId,
        jobId,
      }));
      setCards(mapped);
    } catch (err) {
      setError(err.message || "Failed to load candidates.");
    } finally {
      setLoading(false);
      setCurrentIndex(0);
    }
  }

  async function handleSwipe(type) {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;
    setError("");
    setMessage("");

    try {
      if (role === "seeker") {
        const response = await swipeAPI.swipeJob(currentCard.jobId, type);
        if (type === "right" && response?.data?.match) {
          setMessage(`It's a match with ${response.data.match.job ? response.data.match.job.title : currentCard.title}!`);
        }
      } else {
        if (!selectedJobId) throw new Error("No job selected for candidate matching.");
        await swipeAPI.swipeCandidate(currentCard.profileId, selectedJobId, type);
      }
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Swipe action failed.");
    }
  }

  const currentCard = cards[currentIndex];
  const noCards = !loading && cards.length === 0;

  return (
    <div className="swipe-page-container">
      <div className="swipe-header">
        <h1>{role === "recruiter" ? "Swipe Candidates" : "Swipe Jobs"}</h1>
        <p>
          {role === "recruiter"
            ? "Swipe candidate profiles for your jobs"
            : "Swipe through jobs tailored to your profile"}
        </p>
      </div>

      {role === "recruiter" && (
        <div className="job-selector">
          <label htmlFor="job-select">Select a job:</label>
          <select
            id="job-select"
            value={selectedJobId || ""}
            onChange={(e) => setSelectedJobId(e.target.value)}
            disabled={jobLoading}
          >
            {hirerJobs.length === 0 ? (
              <option value="">No active jobs found</option>
            ) : (
              hirerJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} — {job.company}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {error && (
        <div className="swipe-error">{error}</div>
      )}

      {message && !error && (
        <div className="swipe-error" style={{ borderColor: "#d0f0d0", color: "#1f7a1f" }}>
          {message}
        </div>
      )}

      <div className="swipe-card-wrapper">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              className="loading-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Loading cards...
            </motion.div>
          ) : currentCard ? (
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
