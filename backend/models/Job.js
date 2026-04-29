const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    hirer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HirerProfile",
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Core details ──────────────────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true }, // denormalised for display
    description: { type: String, required: true },

    // ── Location ──────────────────────────────────────────────────────────────
    location: {
      city: { type: String },
      country: { type: String },
      isRemote: { type: Boolean, default: false },
      // Range in km from city centre for on-site/hybrid roles
      rangeKm: { type: Number },
    },

    jobType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "remote"],
      default: "full_time",
    },

    // ── Compensation ──────────────────────────────────────────────────────────
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
      period: {
        type: String,
        enum: ["hourly", "monthly", "annual"],
        default: "annual",
      },
      isVisible: { type: Boolean, default: true },
    },

    // ── Requirements ──────────────────────────────────────────────────────────
    minExperienceYears: { type: Number, required: true, default: 0 },

    educationRequirement: { type: String, default: "Not specified" },

    preferredUniversities: [{ type: String }], // e.g. ["LUMS", "NUST", "IBA"]

    requiredSkills: [
      {
        name: { type: String, required: true },
        isMandatory: { type: Boolean, default: true },
        minYears: { type: Number, default: 0 },
      },
    ],

    preferredSkills: [{ type: String }], // nice-to-have

    postedAt: { type: Date, default: Date.now },

    // ── PDF source (hirer uploads a JD PDF to auto-fill form) ─────────────────
    sourcePdf: {
      fileUrl: { type: String },
      fileName: { type: String },
      uploadedAt: { type: Date },
      parseStatus: {
        type: String,
        enum: ["pending", "parsing", "success", "failed", "manual"],
        default: "pending",
      },
    },

    // ── Status & lifecycle ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed", "expired"],
      default: "draft",
    },
    publishedAt: { type: Date },
    expiresAt: { type: Date },

    // ── Denormalised counters (updated on swipe / match events) ───────────────
    stats: {
      totalCandidates: { type: Number, default: 0 }, // seekers who swiped right
      totalMatches: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

jobSchema.index({ hirer: 1, status: 1 });
jobSchema.index({ status: 1, "location.country": 1 });
jobSchema.index({ "requiredSkills.name": 1 });
jobSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Job", jobSchema);
