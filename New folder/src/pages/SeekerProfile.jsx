import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { resumeAPI, profileAPI } from "../services/api";
import "../styles/SeekerProfile.css";

export default function SeekerProfile() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Profile cards (saved resumes)
  const [profileCards, setProfileCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Load existing profile data on component mount
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setLoadError("");
        const response = await profileAPI.getProfile();
        
        if (!active) return;
        
        const data = response.data || response;
        const profile = data.profile || {};
        const user = data.user || {};
        
        // Pre-populate form with existing data
        setFullName(user.fullName || "");
        setTitle(profile.headline || "");
        setBio(profile.summary || "");
        setLocation(profile.location || "");
        setGithubUrl(profile.githubUrl || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setPortfolioUrl(profile.portfolioUrl || "");
        
        // Handle skills - they come as objects with name property
        if (profile.skills && Array.isArray(profile.skills)) {
          const skillNames = profile.skills.map(s => 
            typeof s === 'object' && s.name ? s.name : s
          ).filter(Boolean);
          setSkills(skillNames);
        }
      } catch (err) {
        if (active) {
          setLoadError(err.message || "Failed to load profile");
          console.error("Error loading profile:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(selectedFile.type)) {
      setUploadError("Please upload a PDF or DOCX file");
      return;
    }

    setFile(selectedFile);
    setUploadError("");
  }

  async function handleUpload() {
    if (!file) {
      setUploadError("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const response = await resumeAPI.parseResume(file);

      const parsedData = response.data || response;

// Auto-fill the form with parsed data
setFullName(parsedData.fullName || "");
setTitle(parsedData.headline || parsedData.title || "");
setBio(parsedData.summary || parsedData.bio || "");
setLocation(parsedData.location || "");
setSkills(
  (parsedData.skills || []).map(s => 
    typeof s === 'object' && s !== null ? s.name : s
  ).filter(Boolean)
);

      // Clear cache so profile endpoint fetches fresh data
      profileAPI.clearCache();

      // Reset file input
      setFile(null);
      
      console.log("Resume auto-filled form with parsed data");
    } catch (err) {
      setUploadError(err.message || "Failed to parse resume");
      console.error("Resume parsing error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleAddSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }

  function handleRemoveSkill(skillToRemove) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  async function handleSaveProfile() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const profileData = {
        fullName: fullName || undefined,
        title,
        bio,
        location,
        skills,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      };

      await profileAPI.updateProfile(profileData);
      
      // Clear cache to ensure next load gets fresh data
      profileAPI.clearCache();

      // Create a profile card for this saved resume/profile
      const newCard = {
        id: Date.now(),
        fullName,
        title,
        location,
        skills,
        savedAt: new Date().toLocaleDateString(),
      };

      setProfileCards([newCard, ...profileCards]);
      
      setSaveSuccess("✅ Profile saved successfully!");

      // Clear form for next resume
      setTimeout(() => {
        setFullName("");
        setTitle("");
        setBio("");
        setLocation("");
        setSkills([]);
        setGithubUrl("");
        setLinkedinUrl("");
        setPortfolioUrl("");
        setSaveSuccess("");
      }, 2000);
    } catch (err) {
      setSaveError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

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

      {loadError && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px" }}>
          {loadError}
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#eef", color: "#33c", borderRadius: "4px" }}>
          Loading your profile...
        </div>
      )}

      {/* Resume Upload - Matching the design */}
      <section className="upload-section">
        <div className="upload-icon-wrapper">
          <span className="upload-icon">📤</span>
        </div>
        <h3>Upload Your Resume</h3>
        <p>Our AI will parse your resume and auto-fill your profile</p>
        
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ marginRight: "0.5rem" }}
          />
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading || !file}
            style={{ opacity: uploading || !file ? 0.6 : 1 }}
          >
            <span>📄</span> {uploading ? "Parsing..." : "Upload & Parse"}
          </button>
        </div>

        {file && (
          <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
            <strong>Selected:</strong> {file.name}
          </div>
        )}

        {uploadError && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px" }}>
            {uploadError}
          </div>
        )}

        <div className="file-info">PDF, DOCX up to 5MB</div>
      </section>

      {/* Personal Information */}
      <section className="profile-form-section">
        <h3>Personal Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            placeholder="e.g. Full Stack Developer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            className="form-textarea"
            placeholder="Tell recruiters about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            className="form-input"
            placeholder="City, Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </section>

      {/* Skills */}
      <section className="profile-form-section">
        <h3>Skills</h3>
        <div className="skills-input-group" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Add a skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
          />
          <button
            onClick={handleAddSkill}
            style={{
              marginLeft: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Add
          </button>
        </div>
        <div className="skills-container">
          {skills.map((s, i) => (
            <span
              key={i}
              className="skill-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                backgroundColor: "#e7f3ff",
                color: "#004085",
                borderRadius: "4px",
                marginRight: "0.5rem",
                marginBottom: "0.5rem"
              }}
            >
              {s}
              <button
                onClick={() => handleRemoveSkill(s)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#004085",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="profile-form-section">
        <h3>Links</h3>
        <div className="form-group">
          <label className="form-label">GitHub URL</label>
          <input
            className="form-input"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">LinkedIn URL</label>
          <input
            className="form-input"
            placeholder="https://linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Portfolio URL</label>
          <input
            className="form-input"
            placeholder="https://..."
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>
      </section>

      {/* Messages */}
      {saveError && (
        <div style={{
          margin: "1rem 0",
          padding: "1rem",
          backgroundColor: "#fee",
          color: "#c33",
          borderRadius: "4px"
        }}>
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div style={{
          margin: "1rem 0",
          padding: "1rem",
          backgroundColor: "#efe",
          color: "#3c3",
          borderRadius: "4px"
        }}>
          {saveSuccess}
        </div>
      )}

      <div className="form-actions">
        <button
          className="save-btn"
          onClick={handleSaveProfile}
          disabled={saving || (!fullName && !title && !skills.length)}
          style={{ opacity: saving || (!fullName && !title && !skills.length) ? 0.6 : 1 }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* Saved Profile Cards */}
      {profileCards.length > 0 && (
        <section className="profile-form-section">
          <h3>📦 Saved Profiles ({profileCards.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {profileCards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#f0f8ff",
                  border: "1px solid #007bff",
                  borderRadius: "8px"
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{card.fullName || "Profile"}</h4>
                  {card.title && (
                    <p style={{ margin: "0 0 0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                      {card.title}
                    </p>
                  )}
                  {card.location && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.9rem" }}>
                      📍 {card.location}
                    </p>
                  )}
                </div>
                {card.skills.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: "bold" }}>
                      Skills ({card.skills.length}):
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {card.skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: "#007bff",
                            color: "white",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "3px",
                            fontSize: "0.75rem"
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {card.skills.length > 5 && (
                        <span style={{ fontSize: "0.75rem", color: "#666" }}>
                          +{card.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.8rem", color: "#999" }}>
                  Saved: {card.savedAt}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
