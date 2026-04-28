const SeekerProfile = require('../models/SeekerProfile');
const User = require('../models/User');

function normalizeSkillName(s) {
  return String(s).trim();
}

exports.updatePersonal = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      title, // maps to headline
      bio, // maps to summary
      location,
      skills,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
    } = req.body;

    // Basic validations
    if (firstName && String(firstName).trim().length < 1)
      return res.status(400).json({ success: false, error: 'firstName too short' });
    if (lastName && String(lastName).trim().length < 1)
      return res.status(400).json({ success: false, error: 'lastName too short' });
    if (title && String(title).trim().length < 2)
      return res.status(400).json({ success: false, error: 'title too short' });

    // update User name fields if present
    if (firstName || lastName) {
      const user = await User.findById(userId);
      if (firstName) user.firstName = String(firstName).trim();
      if (lastName) user.lastName = String(lastName).trim();
      await user.save();
    }

    let profile = await SeekerProfile.findOne({ user: userId });
    if (!profile) {
      profile = await SeekerProfile.create({ user: userId });
    }

    if (title) profile.headline = String(title).trim();
    if (bio) profile.summary = String(bio).trim();
    if (location) profile.location = String(location).trim();
    if (typeof githubUrl !== 'undefined') profile.githubUrl = githubUrl || null;
    if (typeof linkedinUrl !== 'undefined') profile.linkedinUrl = linkedinUrl || null;
    if (typeof portfolioUrl !== 'undefined') profile.portfolioUrl = portfolioUrl || null;

    // Handle skills: accept array of strings
    if (skills) {
      if (!Array.isArray(skills))
        return res.status(400).json({ success: false, error: 'skills must be an array of skill names' });

      const existingNames = new Set(
        (profile.skills || [])
          .map((s) => String(s.name || s).trim().toLowerCase())
          .filter(Boolean),
      );

      const toAdd = [];
      for (const raw of skills) {
        const name = normalizeSkillName(raw);
        if (!name) continue;
        const key = name.toLowerCase();
        if (existingNames.has(key)) continue;
        existingNames.add(key);
        toAdd.push({ name, source: 'manual' });
      }

      if (toAdd.length) {
        profile.skills = (profile.skills || []).concat(toAdd);
      }
    }

    await profile.save();

    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
