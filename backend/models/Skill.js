const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    seekerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SeekerProfile', required: true },
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
    yearsOfExp: { type: Number },
    source: { type: String, enum: ['cv_parsed', 'manual'], default: 'cv_parsed' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Skill', skillSchema);
