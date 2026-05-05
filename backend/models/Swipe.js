const mongoose = require("mongoose");


const swipeSchema = new mongoose.Schema(
  {
    swipeType: {
      type: String,
      enum: ["seeker_on_job", "hirer_on_seeker"],
      required: true,
    },

    swipedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },

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

    matchScore: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true },
);

swipeSchema.index(
  { swipeType: 1, swipedBy: 1, job: 1 },
  {
    unique: true,
    partialFilterExpression: {
      swipeType: 'seeker_on_job',
      job: { $type: 'objectId' },
    },
  },
);
swipeSchema.index(
  { swipeType: 1, swipedBy: 1, seekerProfile: 1, job: 1 },
  {
    unique: true,
    partialFilterExpression: {
      swipeType: 'hirer_on_seeker',
      seekerProfile: { $type: 'objectId' },
      job: { $type: 'objectId' },
    },
  },
);
swipeSchema.index({ job: 1, direction: 1 });

module.exports = mongoose.model("Swipe", swipeSchema);
