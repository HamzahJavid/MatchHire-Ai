const mongoose = require("mongoose");

/**
 * A Match is created when:
 *   1. A seeker swipes RIGHT on a Job
 *   2. The hirer subsequently swipes RIGHT on that seeker for the same Job
 *      (or vice-versa — whichever side completes last triggers match creation)
 */
const matchSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
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
      required: true,
    },
    hirerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HirerProfile",
      required: true,
    },

    // References to both swipes that triggered the match
    seekerSwipe: { type: mongoose.Schema.Types.ObjectId, ref: "Swipe" },
    hirerSwipe: { type: mongoose.Schema.Types.ObjectId, ref: "Swipe" },

    // AI compatibility score at time of match
    compatibilityScore: { type: Number, min: 0, max: 100 },

    status: {
      type: String,
      enum: [
        "active", // match exists, no further action
        "interviewing", // hirer moved to interview stage
        "offered", // offer extended
        "hired", // candidate hired
        "rejected", // either side rejected post-match
        "withdrawn", // seeker withdrew
      ],
      default: "active",
    },

    // Conversation / messaging thread ID (if you add a chat feature later)
    threadId: { type: String },

    // Timeline of status changes
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    matchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Guarantee one match per (seeker, job) pair
matchSchema.index({ seeker: 1, job: 1 }, { unique: true });
matchSchema.index({ hirer: 1, status: 1 });
matchSchema.index({ seeker: 1, status: 1 });
matchSchema.index({ job: 1 });

module.exports = mongoose.model("Match", matchSchema);
