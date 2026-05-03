import React, { useState } from "react";
import { resumeAPI } from "../services/api";

export default function ResumeUpload({ onProfileDataLoaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extractedData, setExtractedData] = useState(null);

  async function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await resumeAPI.parseResume(file);
      
      console.log("Resume parsed successfully:", response);

      const parsedData = response.data || response;

// skills/experience/education are populated objects OR objectIds
// filter out any that are plain strings (objectIds)
const skills = (parsedData.skills || [])
  .filter(s => typeof s === 'object' && s !== null && s.name)
  .map(s => s.name);

const experience = (parsedData.experience || [])
  .filter(e => typeof e === 'object' && e !== null && e.title);

const education = (parsedData.education || [])
  .filter(ed => typeof ed === 'object' && ed !== null && ed.institution);

const profileData = {
  fullName: parsedData.fullName || null,
  headline: parsedData.headline || null,
  summary: parsedData.summary || null,
  location: parsedData.location || null,
  skills,
  experience: experience.map(e => ({
    title: e.title,
    company: e.company,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    description: e.description,
  })),
  education: education.map(ed => ({
    institution: ed.institution,
    degree: ed.degree,
    fieldOfStudy: ed.fieldOfStudy,
    startYear: ed.startYear,
    endYear: ed.endYear,
    gpa: ed.gpa,
  })),
};

      setExtractedData(profileData);
      setSuccess(" Resume parsed successfully! Review the extracted information below.");
      
      // Pass the data to parent component
      if (onProfileDataLoaded) {
        onProfileDataLoaded(profileData);
      }
    } catch (err) {
      setError(err.message || "Failed to parse resume. Please try again.");
      console.error("Resume parsing error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Upload Your Resume</h2>
      
      <div style={{
        border: "2px dashed #ccc",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        marginBottom: "1rem"
      }}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={loading}
          style={{ marginBottom: "1rem" }}
        />
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Supported formats: PDF, DOCX (Max 5MB)
        </p>
      </div>

      {file && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          <p><strong>Selected file:</strong> {file.name}</p>
          <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: "1rem",
          padding: "1rem",
          backgroundColor: "#fee",
          color: "#c33",
          borderRadius: "4px"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: "1rem",
          padding: "1rem",
          backgroundColor: "#efe",
          color: "#3c3",
          borderRadius: "4px"
        }}>
          {success}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: loading || !file ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !file ? "not-allowed" : "pointer",
          fontSize: "1rem"
        }}
      >
        {loading ? "Parsing Resume..." : "Upload & Parse Resume"}
      </button>

      {extractedData && (
        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <h3>Extracted Information</h3>
          
          {extractedData.fullName && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Full Name:</label>
              <p>{extractedData.fullName}</p>
            </div>
          )}

          {extractedData.headline && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Headline:</label>
              <p>{extractedData.headline}</p>
            </div>
          )}

          {extractedData.summary && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Summary:</label>
              <p>{extractedData.summary}</p>
            </div>
          )}

          {extractedData.location && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Location:</label>
              <p>{extractedData.location}</p>
            </div>
          )}

          {extractedData.skills && extractedData.skills.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Skills ({extractedData.skills.length}):</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {extractedData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "#e7f3ff",
                      color: "#004085",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.9rem"
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extractedData.experience && extractedData.experience.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Experience ({extractedData.experience.length}):</label>
              {extractedData.experience.map((exp, idx) => (
                <div key={idx} style={{ marginTop: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid #007bff" }}>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>{exp.title}</strong> at {exp.company}
                  </p>
                  {exp.location && <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>{exp.location}</p>}
                  {exp.startDate && (
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                      {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {extractedData.education && extractedData.education.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: "bold" }}>Education ({extractedData.education.length}):</label>
              {extractedData.education.map((edu, idx) => (
                <div key={idx} style={{ marginTop: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid #28a745" }}>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>{edu.degree || "N/A"}</strong> in {edu.fieldOfStudy || "N/A"}
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    {edu.institution}
                  </p>
                  {edu.startYear && (
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                      {edu.startYear} - {edu.endYear || "Present"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
