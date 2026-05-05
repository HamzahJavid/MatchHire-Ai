const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },

        match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
        },

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

        hirer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        hirerProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HirerProfile",
        },

        type: {
            type: String,
            enum: ["practice", "real"],
            default: "practice",
        },

        stage: {
            type: String,
            enum: ["screening", "technical", "behavioral", "cultural_fit", "practice"],
            default: "practice",
        },


        role: { type: String },
        roleDescription: { type: String },

        candidateContext: {
            experience: { type: String },
            skills: [{ type: String }],
            level: { type: String }, // junior, mid, senior, etc.
        },
        candidateName: { type: String },
        candidateLinks: [{ type: String }],

        questions: [
            {
                questionId: { type: String }, // unique id for tracking
                text: { type: String, required: true },
                order: { type: Number },
            },
        ],


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
