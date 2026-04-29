const mongoose = require("mongoose");

// Using separate collections for experience, education and skills.
// These will be referenced by ObjectId in the seeker profile.

// ── AI Readiness ───────────────────────────────────────────────────────────────
// Tag derived from CV parse quality + skills coverage
const aiReadinessSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      enum: ["not_assessed", "low", "moderate", "high", "ai_native"],
      default: "not_assessed",
    },
    score: { type: Number, min: 0, max: 100, default: 0 },
    assessedAt: { type: Date },
    breakdown: {
      cvParseConfidence: { type: Number, min: 0, max: 100 }, // % of CV fields parsed successfully
      skillsMatched: { type: Number, min: 0, max: 100 }, // % of detected skills recognised
      profileCompleteness: { type: Number, min: 0, max: 100 },
    },
  },
  { _id: false },
);

// ── Main Schema ────────────────────────────────────────────────────────────────
const seekerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // CV document
    cv: {
      fileUrl: { type: String }, // stored path / cloud URL
      fileName: { type: String },
      uploadedAt: { type: Date },
      parseStatus: {
        type: String,
        enum: ["pending", "parsing", "success", "failed", "manual"],
        default: "pending",
      },
      parsedAt: { type: Date },
    },

    // Core profile (can be CV-parsed or manually filled)
    headline: { type: String, trim: true }, // e.g. "Senior React Developer"
    summary: { type: String },
    location: { type: String },
    portfolioUrl: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },

    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    experience: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }],
    education: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Education' }],

    // Computed fields
    totalYearsOfExperience: { type: Number, default: 0 },
    highestEducationLevel: {
      type: String,
      enum: ["high_school", "diploma", "bachelors", "masters", "phd", "other"],
    },

    // Profile strength (0-100), computed server-side
    profileStrength: { type: Number, min: 0, max: 100, default: null },

    // AI readiness
    aiReadiness: { type: aiReadinessSchema, default: () => ({}) },

    // Swipe & match counters (denormalised for fast dashboard reads)
    stats: {
      totalSwipes: { type: Number, default: 0 },
      rightSwipes: { type: Number, default: 0 }, // seeker liked a job
      leftSwipes: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
    },
    // list of job ids the seeker has swiped on (denormalised)
    jobsSwiped: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    // Job preferences
    preferences: {
      jobTypes: [
        {
          type: String,
          enum: ["full_time", "part_time", "contract", "internship", "remote"],
        },
      ],
      expectedSalaryMin: { type: Number },
      expectedSalaryMax: { type: Number },
      currency: { type: String, default: "USD" },
      preferredLocations: [{ type: String }],
      openToRelocation: { type: Boolean, default: false },
    },

    isPublic: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Index for geolocation / location-based queries
seekerProfileSchema.index({ user: 1 });
seekerProfileSchema.index({ profileStrength: -1 });

module.exports = mongoose.model("SeekerProfile", seekerProfileSchema);
