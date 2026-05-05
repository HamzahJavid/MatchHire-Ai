// API Configuration and Service
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const PROFILE_CACHE_KEY = "profileCache_v2";

// Helper function to get the auth token from localStorage
const getAuthToken = () => localStorage.getItem("accessToken");

// Helper function to make authenticated requests
const makeRequest = async (endpoint, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
};

// Auth API Calls
export const authAPI = {
    signup: async (fullName, email, password, role) => {
        const hasSeeker = role === "seeker";
        const hasHirer = role === "recruiter";

        return makeRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                fullName,
                email,
                password,
                hasSeeker,
                hasHirer,
            }),
        });
    },

    signin: async (email, password) => {
        return makeRequest("/auth/signin", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
    },
};

// Profile API Calls
export const profileAPI = {
    getProfile: async () => {
        try {
            const cached = localStorage.getItem(PROFILE_CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Return cached value immediately to avoid refetching
                    return parsed;
                } catch (e) {
                    // fall through to refetch
                }
            }

            const data = await makeRequest("/me/profile");
            try {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            } catch (e) {
                // ignore storage errors
            }
            return data;
        } catch (err) {
            // If network fails but cache exists, return cache
            const cached = localStorage.getItem(PROFILE_CACHE_KEY);
            if (cached) return JSON.parse(cached);
            throw err;
        }
    },

    updateProfile: async (profileData) => {
        const result = await makeRequest("/me/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
        // Update cache after successful update
        try {
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(result));
        } catch (e) { }
        return result;
    },

    patchResume: async (resumeData) => {
        const result = await makeRequest("/resume", {
            method: "PATCH",
            body: JSON.stringify(resumeData),
        });
        // resume patch likely changed profile; clear cache to force next fetch
        try {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        } catch (e) { }
        return result;
    },

    // Utility to explicitly clear cached profile (useful on logout or manual refresh)
    clearCache: () => {
        try {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        } catch (e) { }
    },
};

// Resume API Calls
export const resumeAPI = {
    parseResume: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = getAuthToken();
        const headers = {};

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/resume/parse`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API Error: ${response.status}`);
        }

        return response.json();
    },
};

// Jobs API Calls
export const jobsAPI = {
    getJobs: async () => {
        return makeRequest("/jobs");
    },

    getJobById: async (jobId) => {
        return makeRequest(`/jobs/${jobId}`);
    },

    getMyJobs: async () => {
        return makeRequest("/jobs/mine");
    },

    getClosestJobs: async () => {
        return makeRequest("/jobs/closest");
    },

    getCandidates: async (jobId) => {
        return makeRequest(`/jobs/${jobId}/candidates`);
    },

    createJob: async (jobData) => {
        return makeRequest("/jobs", {
            method: "POST",
            body: JSON.stringify(jobData),
        });
    },

    updateJob: async (jobId, jobData) => {
        return makeRequest(`/jobs/${jobId}`, {
            method: "PUT",
            body: JSON.stringify(jobData),
        });
    },

    deleteJob: async (jobId) => {
        return makeRequest(`/jobs/${jobId}`, {
            method: "DELETE",
        });
    },
};

// Swipe API Calls
export const swipeAPI = {
    swipeJob: async (jobId, type) => {
        return makeRequest("/swipe/job", {
            method: "POST",
            body: JSON.stringify({ jobId, type }),
        });
    },

    swipeCandidate: async (userId, jobId, type) => {
        return makeRequest("/swipe/candidate", {
            method: "POST",
            body: JSON.stringify({ userId, jobId, type }),
        });
    },

    getMatches: async () => {
        return makeRequest("/matches");
    },
};

// Match API Calls
export const matchAPI = {
    getMatches: async (role = "seeker", jobId = null) => {
        const q = new URLSearchParams({ role });
        if (jobId) q.set('jobId', jobId);
        return makeRequest(`/matches?${q.toString()}`);
    },

    getMatchById: async (matchId) => {
        return makeRequest(`/matches/${matchId}`);
    },
};

// Message API Calls
export const messageAPI = {
    getConversations: async () => {
        return makeRequest("/messages");
    },

    getMessages: async (matchId) => {
        return makeRequest(`/messages/${matchId}`);
    },

    sendMessage: async (matchId, text, type = "text", metadata = {}) => {
        return makeRequest("/messages/send", {
            method: "POST",
            body: JSON.stringify({ matchId, text, type, metadata }),
        });
    },

    markAsRead: async (matchId) => {
        return makeRequest(`/messages/${matchId}/read`, {
            method: "PATCH",
        });
    },

    getUnreadCount: async () => {
        return makeRequest("/messages/count/unread");
    },
};

// Interview API Calls
export const interviewAPI = {
    generatePractice: async (role, roleDescription, experience, skills, level, jobId, type = "practice") => {
        return makeRequest("/interview/generate", {
            method: "POST",
            body: JSON.stringify({
                role,
                roleDescription,
                experience,
                skills,
                level,
                jobId,
                type,
            }),
        });
    },

    generateMatchInterview: async (matchId, mode = "ai", payload = {}) => {
        return makeRequest("/interview/generate-match", {
            method: "POST",
            body: JSON.stringify({
                matchId,
                mode,
                ...payload,
            }),
        });
    },

    evaluateTest: async (interviewId, qna, jobDescription = "") => {
        return makeRequest("/interview/evaluate", {
            method: "POST",
            body: JSON.stringify({
                interviewId,
                qna,
                jobDescription,
            }),
        });
    },

    saveResponses: async (interviewId, responses) => {
        return makeRequest("/interview/responses", {
            method: "POST",
            body: JSON.stringify({ interviewId, responses }),
        });
    },

    submitAnswers: async (interviewId, answers) => {
        return makeRequest("/interview/submit-answers", {
            method: "POST",
            body: JSON.stringify({ interviewId, answers }),
        });
    },

    startRealInterview: async (jobId, matchId) => {
        return makeRequest("/interview/start-real", {
            method: "POST",
            body: JSON.stringify({ jobId, matchId }),
        });
    },

    postQuestions: async (matchId, questions, stage = "screening") => {
        return makeRequest("/interview/question/post", {
            method: "POST",
            body: JSON.stringify({ matchId, questions, stage }),
        });
    },

    getInterviewAnswers: async (interviewId) => {
        return makeRequest(`/interview/answers/${interviewId}`);
    },

    getInterviewByMatch: async (matchId) => {
        return makeRequest(`/interview/match/${matchId}`);
    },

    getInterview: async (interviewId) => {
        return makeRequest(`/interview/${interviewId}`);
    },

    listInterviews: async () => {
        return makeRequest("/interview");
    },

    updateStatus: async (interviewId, status, notes) => {
        return makeRequest(`/interview/${interviewId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, notes }),
        });
    },

    getStats: async () => {
        return makeRequest("/interview/stats/overview");
    },
};

// Token Management
export const tokenAPI = {
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }
    },

    clearTokens: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },

    getAccessToken: () => localStorage.getItem("accessToken"),
    getRefreshToken: () => localStorage.getItem("refreshToken"),
};
