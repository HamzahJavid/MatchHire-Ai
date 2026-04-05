import { useState } from "react";
import "../styles/RecruiterPages.css";

export default function PostJob() {
  const [skills, setSkills] = useState(["React", "TypeScript"]);
  const [skillInput, setSkillInput] = useState("");

  function addSkill() {
    const skill = skillInput.trim();
    if (!skill || skills.includes(skill)) return;
    setSkills([...skills, skill]);
    setSkillInput("");
  }

  function removeSkill(skillToRemove) {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  }

  return (
    <div className="recruiter-page">
      <header className="page-header">
        <div>
          <h1>Post a New Job</h1>
          <p>Define the role and let AI find the best matches.</p>
        </div>
      </header>

      <div className="form-panel">
        <div className="form-card">
          <div className="field-group">
            <label>Job Title</label>
            <input placeholder="e.g. Senior React Developer" />
          </div>
          <div className="field-group">
            <label>Company</label>
            <input placeholder="e.g. Acme Corp" />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Location</label>
              <input placeholder="e.g. Remote" />
            </div>
            <div className="field-group">
              <label>Salary Range</label>
              <input placeholder="e.g. $80k - $120k" />
            </div>
          </div>
          <div className="field-group">
            <label>Job Description</label>
            <textarea placeholder="Describe the role, responsibilities, and requirements..." />
          </div>
        </div>

        <div className="form-card">
          <h2>Candidate Requirements</h2>
          <div className="skills-row">
            <p>Required Skills</p>
            <div className="skills-list">
              {skills.map((skill) => (
                <span key={skill} className="skill-pill">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="skill-input-row">
            <input
              value={skillInput}
              placeholder="Add a skill"
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <button type="button" className="icon-btn" onClick={addSkill}>
              +
            </button>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Min. Experience</label>
              <input placeholder="e.g. 3 years" />
            </div>
            <div className="field-group">
              <label>Education</label>
              <input placeholder="e.g. BS Computer Science" />
            </div>
          </div>

          <div className="field-group">
            <label>Preferred Universities (optional)</label>
            <input placeholder="e.g. MIT, Stanford" />
          </div>

          <div className="action-row">
            <button className="btn primary">Post Job & Start Matching</button>
            <button className="btn outline">Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
