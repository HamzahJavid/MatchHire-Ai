import { useState } from "react";
import { motion } from "framer-motion";
import "../styles/SeekerProfile.css";

export default function SeekerProfile() {
  const [skills, setSkills] = useState([
    "React",
    "JavaScript",
    "Node.js",
    "Python",
    "AWS",
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-page"
    >
      <header className="profile-header">
        <h1>My Profile</h1>
        <p>Keep your profile updated for better matches.</p>
      </header>

      {/* Resume Upload - Matching the design */}
      <section className="upload-section">
        <div className="upload-icon-wrapper">
          <span className="upload-icon">📤</span>
        </div>
        <h3>Upload Your Resume</h3>
        <p>Our AI will parse your resume and auto-fill your profile</p>
        <button className="upload-btn">
          <span>📄</span> Choose File
        </button>
        <div className="file-info">PDF, DOCX up to 5MB</div>
      </section>

      {/* Personal Information */}
      <section className="profile-form-section">
        <h3>Personal Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" placeholder="First Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" placeholder="Last Name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="e.g. Full Stack Developer" />
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea 
            className="form-textarea" 
            placeholder="Tell recruiters about yourself..." 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" placeholder="City, Country" />
        </div>
      </section>

      {/* Skills */}
      <section className="profile-form-section">
        <h3>Skills</h3>
        <div className="skills-container">
          {skills.map((s, i) => (
            <span key={i} className="skill-tag">
              {s}
            </span>
          ))}
          <button className="add-skill-btn">+ Add Skill</button>
        </div>
      </section>

      {/* Links */}
      <section className="profile-form-section">
        <h3>Links</h3>
        <div className="form-group">
          <label className="form-label">GitHub URL</label>
          <input className="form-input" placeholder="https://github.com/..." />
        </div>
        <div className="form-group">
          <label className="form-label">LinkedIn URL</label>
          <input className="form-input" placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="form-group">
          <label className="form-label">Portfolio URL</label>
          <input className="form-input" placeholder="https://..." />
        </div>
      </section>

      <div className="form-actions">
        <button className="save-btn">Save Profile</button>
      </div>
    </motion.div>
  );
}
