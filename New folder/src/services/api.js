// API Configuration and Service
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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
        return makeRequest("/me/profile");
    },

    updateProfile: async (profileData) => {
        return makeRequest("/me/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    },

    patchResume: async (resumeData) => {
        return makeRequest("/resume", {
            method: "PATCH",
            body: JSON.stringify(resumeData),
        });
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
        return makeRequest("/swipe/matches");
    },
};

// Interview API Calls
export const interviewAPI = {
    startInterview: async (jobId) => {
        return makeRequest("/interview/start", {
            method: "POST",
            body: JSON.stringify({ jobId }),
        });
    },

    submitAnswer: async (interviewId, questionIndex, answer) => {
        return makeRequest("/interview/submit", {
            method: "POST",
            body: JSON.stringify({ interviewId, questionIndex, answer }),
        });
    },

    getInterviewResult: async (interviewId) => {
        return makeRequest(`/interview/${interviewId}`);
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
