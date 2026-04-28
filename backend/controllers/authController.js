const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'please_change_refresh_secret';

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const safeUser = user.toSafeObject ? user.toSafeObject() : { id: user._id, email: user.email };

    const accessToken = signToken({ sub: user._id }, JWT_SECRET, '15m');
    const refreshToken = signToken({ sub: user._id }, JWT_REFRESH_SECRET, '7d');

    res.json({ success: true, data: { accessToken, refreshToken, user: safeUser } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(pw) {
  // min 8 chars, uppercase, lowercase, number, special
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

exports.signUp = async (req, res) => {
  try {
    const { fullName, email, password, hasSeeker, hasHirer } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3)
      return res.status(400).json({ success: false, error: 'Full name must be at least 3 characters' });

    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, error: 'Valid email is required' });

    if (!password || !isStrongPassword(password))
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters and include upper, lower, number and special character' });

    const seeker = !!(hasSeeker === true || hasSeeker === 'true' || hasSeeker === 1 || hasSeeker === '1');
    const hirer = !!(hasHirer === true || hasHirer === 'true' || hasHirer === 1 || hasHirer === '1');

    if ((seeker && hirer) || (!seeker && !hirer))
      return res.status(400).json({ success: false, error: 'Must send exactly one of hasSeeker or hasHirer as true' });

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.join(' ') || '';

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      hasSeeker: seeker,
      hasHirer: hirer,
    });

    await user.save();

    const safeUser = user.toSafeObject ? user.toSafeObject() : { id: user._id, email: user.email };

    const accessToken = signToken({ sub: user._id }, JWT_SECRET, '15m');
    const refreshToken = signToken({ sub: user._id }, JWT_REFRESH_SECRET, '7d');

    res.status(201).json({ success: true, data: { accessToken, refreshToken, user: safeUser } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
