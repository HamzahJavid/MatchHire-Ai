const mongoose = require("mongoose");

/**
 * A Swipe document is created whenever:
 *   - A seeker swipes LEFT or RIGHT on a Job          (swipeType: "seeker_on_job")
 *   - A hirer swipes LEFT or RIGHT on a SeekerProfile (swipeType: "hirer_on_seeker")
 *
 * A Match is created separately when both sides have RIGHT-swiped on each other.
 */
const swipeSchema = new mongoose.Schema(
  {
    swipeType: {
      type: String,
      enum: ["seeker_on_job", "hirer_on_seeker"],
      required: true,
    },

    // The user who performed the swipe
    swipedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── seeker_on_job fields ──────────────────────────────────────────────────
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },

    // ── hirer_on_seeker fields ────────────────────────────────────────────────
    seekerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeekerProfile",
    },
    hirerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HirerProfile",
    },

    direction: {
      type: String,
      enum: ["left", "right"],
      required: true,
    },

    // AI-generated compatibility score shown at time of swipe (0-100)
    matchScore: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true },
);

// Prevent duplicate swipes: one swipe per (swipedBy, job) and (swipedBy, seekerProfile)
swipeSchema.index({ swipedBy: 1, job: 1 }, { unique: true, sparse: true });
swipeSchema.index(
  { swipedBy: 1, seekerProfile: 1, hirerProfile: 1 },
  { unique: true, sparse: true },
);
swipeSchema.index({ job: 1, direction: 1 });

module.exports = mongoose.model("Swipe", swipeSchema);
