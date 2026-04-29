const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    seekerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SeekerProfile', required: true },
    institution: { type: String, required: true },
    degree: { type: String },
    fieldOfStudy: { type: String },
    startYear: { type: Number },
    endYear: { type: Number },
    gpa: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Education', educationSchema);
