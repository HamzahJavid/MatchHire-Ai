const mongoose = require("mongoose");

const hirerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Company info
    company: {
      name: { type: String, required: true, trim: true },
      logoUrl: { type: String },
      website: { type: String },
      industry: { type: String },
      size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },
      founded: { type: Number },
      description: { type: String },
      location: { type: String },
      linkedinUrl: { type: String },
    },

    // Hirer contact details (may differ from user account)
    contactName: { type: String },
    contactTitle: { type: String }, // e.g. "Head of Talent"

    // Denormalised dashboard stats (updated on job/match events)
    stats: {
      activeJobs: { type: Number, default: 0 },
      totalCandidates: { type: Number, default: 0 }, // seekers who swiped right on hirer's jobs
      totalMatches: { type: Number, default: 0 },
      // matchRate = totalMatches / totalCandidates  (computed on read)
    },

    isVerified: { type: Boolean, default: false }, // company verification badge
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

hirerProfileSchema.index({ user: 1 });
hirerProfileSchema.index({ "company.name": "text" });

module.exports = mongoose.model("HirerProfile", hirerProfileSchema);
