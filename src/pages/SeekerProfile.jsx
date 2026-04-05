import { useState } from "react";
import { motion } from "framer-motion";

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
      className="content-card"
      style={{ maxWidth: "800px" }}
    >
      <h1>My Profile</h1>
      <p>Keep your profile updated for better matches.</p>

      {/* Resume Upload */}
      <div className="card">
        <h3>Upload Resume</h3>
        <button className="btn">Choose File</button>
      </div>

      {/* Form */}
      <div className="card">
        <h3>Personal Information</h3>

        <div className="grid">
          <input placeholder="First Name" />
          <input placeholder="Last Name" />
        </div>

        <input placeholder="Title (Full Stack Developer)" />
        <textarea placeholder="Tell recruiters about yourself..." />
        <input placeholder="Location" />
      </div>

      {/* Skills */}
      <div className="card">
        <h3>Skills</h3>
        <div className="skills">
          {skills.map((s, i) => (
            <span key={i} className="skill-tag">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <h3>Links</h3>
        <input placeholder="GitHub URL" />
        <input placeholder="LinkedIn URL" />
        <input placeholder="Portfolio URL" />
      </div>

      <button className="btn primary">Save Profile</button>
    </motion.div>
  );
}
