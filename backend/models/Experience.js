const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    seekerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SeekerProfile', required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Experience', experienceSchema);
