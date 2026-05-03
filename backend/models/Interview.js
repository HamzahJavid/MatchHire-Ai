const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        // Reference to the job (if this is a real interview)
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },

        // Reference to the match (if interview is tied to a specific match)
        match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
        },

        // Reference to the seeker taking the interview
        seeker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        seekerProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SeekerProfile",
            required: true,
        },

        // Interview type
        type: {
            type: String,
            enum: ["practice", "real"],
            default: "practice",
        },

        // Interview stage/category
        stage: {
            type: String,
            enum: ["screening", "technical", "behavioral", "cultural_fit", "practice"],
            default: "practice",
        },

        // Role being interviewed for
        role: { type: String },
        roleDescription: { type: String },

        // Context about the candidate at time of interview
        candidateContext: {
            experience: { type: String },
            skills: [{ type: String }],
            level: { type: String }, // junior, mid, senior, etc.
        },

        // Questions generated for the interview
        questions: [
            {
                questionId: { type: String }, // unique id for tracking
                text: { type: String, required: true },
                order: { type: Number },
            },
        ],

        // Question-Answer pairs collected during interview
        responses: [
            {
                questionId: { type: String },
                question: { type: String },
                answer: { type: String },
                recordedAt: { type: Date, default: Date.now },
                durationSeconds: { type: Number }, // time taken to answer
                audioUrl: { type: String }, // if video/audio was recorded
            },
        ],

        // AI Evaluation Results
        evaluation: {
            score: { type: Number, min: 0, max: 100 }, // overall score
            assessedAt: { type: Date },
            breakdown: {
                communication: { type: Number, min: 0, max: 100 },
                technical: { type: Number, min: 0, max: 100 },
                fit: { type: Number, min: 0, max: 100 },
            },
            comment: { type: String }, // AI-generated feedback
            strengths: [{ type: String }],
            improvements: [{ type: String }],
        },

        // Interview status
        status: {
            type: String,
            enum: ["scheduled", "in_progress", "completed", "cancelled", "expired"],
            default: "scheduled",
        },

        // Timestamps
        scheduledAt: { type: Date },
        startedAt: { type: Date },
        completedAt: { type: Date },
        expiresAt: { type: Date },

        // Additional metadata
        notes: { type: String }, // notes by hirer or automated notes
        isPublic: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// Indexes for common queries
interviewSchema.index({ seeker: 1, createdAt: -1 });
interviewSchema.index({ job: 1, seeker: 1 });
interviewSchema.index({ match: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ type: 1, seeker: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
