import React, { useState } from "react";
import ResumeUpload from "../components/ResumeUpload";
import { profileAPI } from "../services/api";
import "../styles/SeekerProfile.css";

export default function UploadResumePage() {
  const [profileData, setProfileData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  async function handleProfileDataLoaded(data) {
    setProfileData(data);
    setSaveError("");
    setSaveSuccess("");
  }

  async function handleSaveProfile() {
    if (!profileData) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      // Prepare the profile update data
      const updateData = {
        fullName: profileData.fullName || undefined,
        title: profileData.headline,
        bio: profileData.summary,
        location: profileData.location,
        skills: profileData.skills || [],
      };

      // Save to database
      await profileAPI.updateProfile(updateData);
      
      setSaveSuccess("✅ Profile saved successfully! Your resume information has been added to your profile.");
      setProfileData(null);
    } catch (err) {
      setSaveError(err.message || "Failed to save profile. Please try again.");
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Build Your Profile</h1>

        <ResumeUpload onProfileDataLoaded={handleProfileDataLoaded} />

        {profileData && (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            {saveError && (
              <div style={{
                marginBottom: "1rem",
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
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "#efe",
                color: "#3c3",
                borderRadius: "4px"
              }}>
                {saveSuccess}
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: saving ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "1rem",
                marginTop: "1rem"
              }}
            >
              {saving ? "Saving Profile..." : "Save Profile to Database"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
