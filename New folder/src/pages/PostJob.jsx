import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jobsAPI } from "../services/api";
import "../styles/RecruiterPages.css";

export default function PostJob() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState({ min: 0, max: 0, currency: 'USD' });
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState(["React", "TypeScript"]);
  const [skillInput, setSkillInput] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [education, setEducation] = useState("");
  const [preferred, setPreferred] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function addSkill() {
    const skill = skillInput.trim();
    if (!skill || skills.includes(skill)) return;
    setSkills([...skills, skill]);
    setSkillInput("");
  }

  function removeSkill(skillToRemove) {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  }

  async function handlePost() {
    try {
      setSubmitting(true);
      const jobData = {
        title,
        company,
        location: location || undefined,
        salaryRange: { min: Number(salaryRange.min) || 0, max: Number(salaryRange.max) || 0, currency: salaryRange.currency },
        description,
        requiredSkills: skills.map((s) => ({ name: s, isMandatory: true })),
        minYearsOfExperience: Number(minExperience) || 0,
        educationRequirement: education,
        preferredUniversities: preferred ? preferred.split(',').map(p => p.trim()).filter(Boolean) : [],
        jobType: 'full_time',
      };

      const res = await jobsAPI.createJob(jobData);
      if (res && res.success) {
        navigate('/dashboard/recruiter');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior React Developer" />
          </div>
          <div className="field-group">
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote" />
            </div>
            <div className="field-group">
              <label>Salary Range</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={salaryRange.min} onChange={(e) => setSalaryRange({ ...salaryRange, min: e.target.value })} placeholder="Min" />
                <input value={salaryRange.max} onChange={(e) => setSalaryRange({ ...salaryRange, max: e.target.value })} placeholder="Max" />
              </div>
            </div>
          </div>
          <div className="field-group">
            <label>Job Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." />
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
              <input value={minExperience} onChange={(e) => setMinExperience(e.target.value)} placeholder="e.g. 3 years" />
            </div>
            <div className="field-group">
              <label>Education</label>
              <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. BS Computer Science" />
            </div>
          </div>

          <div className="field-group">
            <label>Preferred Universities (optional)</label>
            <input value={preferred} onChange={(e) => setPreferred(e.target.value)} placeholder="e.g. MIT, Stanford" />
          </div>

          <div className="action-row">
            <button className="btn primary" onClick={handlePost} disabled={submitting}>{submitting ? 'Posting…' : 'Post Job & Start Matching'}</button>
            <button className="btn outline">Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
