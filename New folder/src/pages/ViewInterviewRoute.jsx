import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ViewInterviewPage from "./ViewInterviewPage";
import { interviewAPI } from "../services/api";

export default function ViewInterviewRoute({ role = "seeker" }) {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInterview() {
      setLoading(true);
      setError("");
      try {
        const response = role === "hirer"
          ? await interviewAPI.getInterviewAnswers(interviewId)
          : await interviewAPI.getInterview(interviewId);
        if (!active) return;
        setInterview(response.data || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load interview.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (interviewId) {
      loadInterview();
    }

    return () => {
      active = false;
    };
  }, [interviewId]);

  if (loading) {
    return <div className="content-card">Loading interview…</div>;
  }

  if (error) {
    return <div className="content-card">{error}</div>;
  }

  async function handleStartInterview() {
    if (role === "hirer") return;
    try {
      const jobId = interview?.job?._id;
      const matchId = interview?.match?._id || interview?.match;
      if (!jobId) throw new Error("Missing job for this interview.");
      const response = await interviewAPI.startRealInterview(jobId, matchId);
      const updatedInterview = response.data?.interview || interview;
      if (response.data?.interviewId && response.data.interviewId !== interviewId) {
        navigate(`/dashboard/seeker/interviews/${response.data.interviewId}`, { replace: true });
        return;
      }
      setInterview(updatedInterview);
    } catch (err) {
      setError(err.message || "Unable to start interview.");
    }
  }

  return (
    <ViewInterviewPage
      interviewId={interviewId}
      matchId={interview?.match?._id || interview?.match || null}
      interview={interview}
      onClose={() => navigate(-1)}
      onStartInterview={handleStartInterview}
      role={role}
    />
  );
}
