import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/SeekerProfile.css";

const PARSER_URL = "http://localhost:4000";

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ status, message }) {
  const styles = {
    idle: { background: "transparent" },
    uploading: {
      background: "#EFF6FF",
      color: "#1D4ED8",
      border: "1px solid #BFDBFE",
    },
    parsing: {
      background: "#FFF7ED",
      color: "#C2410C",
      border: "1px solid #FED7AA",
    },
    done: {
      background: "#F0FDF4",
      color: "#15803D",
      border: "1px solid #BBF7D0",
    },
    error: {
      background: "#FEF2F2",
      color: "#B91C1C",
      border: "1px solid #FECACA",
    },
  };
  if (status === "idle") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        ...styles[status],
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {(status === "uploading" || status === "parsing") && (
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      {message}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SeekerProfile() {
  const fileRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    bio: "",
    location: "",
    github: "",
    linkedin: "",
    portfolio: "",
  });
  const [skills, setSkills] = useState([
    "React",
    "JavaScript",
    "Node.js",
    "Python",
    "AWS",
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // Upload / parse state
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | parsing | done | error
  const [statusMsg, setStatusMsg] = useState("");
  const [parsed, setParsed] = useState(null);

  // ── Field helper ────────────────────────────────────────────────────────────
  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── File selection ──────────────────────────────────────────────────────────
  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus("idle");
      setParsed(null);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setStatus("idle");
      setParsed(null);
    }
  }

  // ── Parse ───────────────────────────────────────────────────────────────────
  async function handleParse() {
    if (!file) return;

    setStatus("uploading");
    setStatusMsg("Uploading resume…");
    setParsed(null);

    try {
      const body = new FormData();
      body.append("file", file);

      setStatus("parsing");
      setStatusMsg("Extracting text and running NLP analysis…");

      const res = await fetch(`${PARSER_URL}/api/resume/parse`, {
        method: "POST",
        body,
      });
      const json = await res.json();

      if (!res.ok || !json.success)
        throw new Error(json.error || "Parsing failed");

      const d = json.data;
      setParsed(d);

      // ── Auto-fill form ──────────────────────────────────────────────────────
      setForm((prev) => ({
        firstName: d.firstName || prev.firstName,
        lastName: d.lastName || prev.lastName,
        title: d.title || prev.title,
        bio: d.bio || prev.bio,
        location: d.location || prev.location,
        github: d.github || prev.github,
        linkedin: d.linkedin || prev.linkedin,
        portfolio: d.portfolio || prev.portfolio,
      }));

      if (d.skills?.length) {
        setSkills((prev) => {
          const merged = [...new Set([...prev, ...d.skills])];
          return merged.slice(0, 20);
        });
      }

      setStatus("done");
      setStatusMsg(
        `Profile auto-filled from "${file.name}" — ${d.skills?.length || 0} skills detected.`,
      );
    } catch (err) {
      setStatus("error");
      setStatusMsg(err.message || "Something went wrong.");
    }
  }

  // ── Skills ──────────────────────────────────────────────────────────────────
  function removeSkill(i) {
    setSkills((s) => s.filter((_, idx) => idx !== i));
  }
  function addSkill() {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setNewSkill("");
    setAddingSkill(false);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  function handleSave() {
    console.log("Saving profile:", {
      ...form,
      skills,
      experience: parsed?.experience,
      education: parsed?.education,
    });
    alert("Profile saved! (Hook up your API here.)");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Spin keyframe injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-page"
      >
        <header className="profile-header">
          <h1>My Profile</h1>
          <p>Keep your profile updated for better matches.</p>
        </header>

        {/* ── Upload section ────────────────────────────────────────────────── */}
        <section className="upload-section">
          <div
            className="upload-icon-wrapper"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="upload-icon">{file ? "📄" : "📤"}</span>
          </div>
          <h3>Upload Your Resume</h3>
          <p>
            {file
              ? `Selected: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`
              : "Our NLP engine will parse your resume and auto-fill your profile"}
          </p>

          <AnimatePresence>
            <StatusBadge status={status} message={statusMsg} />
          </AnimatePresence>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="upload-btn"
              onClick={() => fileRef.current?.click()}
            >
              <span>📄</span> {file ? "Change File" : "Choose File"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
            {file && status !== "uploading" && status !== "parsing" && (
              <button
                className="upload-btn"
                style={{ background: "#185FA5", color: "#fff", border: "none" }}
                onClick={handleParse}
              >
                ✨ Parse Resume
              </button>
            )}
          </div>

          <div className="file-info">PDF, DOCX up to 5 MB</div>
        </section>

        {/* ── Parsed extra data panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {parsed &&
            (parsed.experience?.length > 0 || parsed.education?.length > 0) && (
              <motion.section
                key="parsed-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="profile-form-section"
                style={{ overflow: "hidden" }}
              >
                <h3>Parsed Data Preview</h3>

                {parsed.experience?.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      Experience
                    </p>
                    {parsed.experience.map((exp, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: 10,
                          padding: "10px 12px",
                          background: "#F9FAFB",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <strong>{exp.title}</strong>
                        {exp.company && (
                          <span style={{ color: "#6B7280" }}>
                            {" "}
                            @ {exp.company}
                          </span>
                        )}
                        {exp.duration && (
                          <span style={{ color: "#9CA3AF", marginLeft: 6 }}>
                            · {exp.duration}
                          </span>
                        )}
                        {exp.bullets?.length > 0 && (
                          <ul
                            style={{
                              marginTop: 4,
                              paddingLeft: 16,
                              color: "#374151",
                            }}
                          >
                            {exp.bullets.slice(0, 2).map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {parsed.education?.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 8,
                        marginTop: 12,
                      }}
                    >
                      Education
                    </p>
                    {parsed.education.map((edu, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: 8,
                          padding: "10px 12px",
                          background: "#F9FAFB",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <strong>{edu.degree}</strong>
                        {edu.institution && (
                          <span style={{ color: "#6B7280" }}>
                            {" "}
                            · {edu.institution}
                          </span>
                        )}
                        {edu.year && (
                          <span style={{ color: "#9CA3AF", marginLeft: 6 }}>
                            {edu.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </motion.section>
            )}
        </AnimatePresence>

        {/* ── Personal information ──────────────────────────────────────────── */}
        <section className="profile-form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                placeholder="First Name"
                value={form.firstName}
                onChange={set("firstName")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                placeholder="Last Name"
                value={form.lastName}
                onChange={set("lastName")}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              placeholder="e.g. Full Stack Developer"
              value={form.title}
              onChange={set("title")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              className="form-textarea"
              placeholder="Tell recruiters about yourself…"
              value={form.bio}
              onChange={set("bio")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="form-input"
              placeholder="City, Country"
              value={form.location}
              onChange={set("location")}
            />
          </div>
        </section>

        {/* ── Skills ───────────────────────────────────────────────────────── */}
        <section className="profile-form-section">
          <h3>Skills</h3>
          <div className="skills-container">
            {skills.map((s, i) => (
              <span
                key={i}
                className="skill-tag"
                style={{ cursor: "pointer" }}
                title="Click to remove"
                onClick={() => removeSkill(i)}
              >
                {s} ×
              </span>
            ))}
            {addingSkill ? (
              <span style={{ display: "inline-flex", gap: 4 }}>
                <input
                  autoFocus
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSkill();
                    if (e.key === "Escape") setAddingSkill(false);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    fontSize: 13,
                    width: 120,
                  }}
                  placeholder="Skill name…"
                />
                <button className="add-skill-btn" onClick={addSkill}>
                  Add
                </button>
              </span>
            ) : (
              <button
                className="add-skill-btn"
                onClick={() => setAddingSkill(true)}
              >
                + Add Skill
              </button>
            )}
          </div>
        </section>

        {/* ── Links ─────────────────────────────────────────────────────────── */}
        <section className="profile-form-section">
          <h3>Links</h3>
          <div className="form-group">
            <label className="form-label">GitHub URL</label>
            <input
              className="form-input"
              placeholder="https://github.com/…"
              value={form.github}
              onChange={set("github")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input
              className="form-input"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin}
              onChange={set("linkedin")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Portfolio URL</label>
            <input
              className="form-input"
              placeholder="https://…"
              value={form.portfolio}
              onChange={set("portfolio")}
            />
          </div>
        </section>

        <div className="form-actions">
          <button className="save-btn" onClick={handleSave}>
            Save Profile
          </button>
        </div>
      </motion.div>
    </>
  );
}
