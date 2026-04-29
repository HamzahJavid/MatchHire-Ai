module.exports = {
  requireSeeker: (req, res, next) => {
    if (!req.user || !req.user.hasSeeker) {
      return res.status(403).json({ success: false, error: 'Access denied: seeker account required' });
    }
    next();
  },

  requireHirer: (req, res, next) => {
    if (!req.user || !req.user.hasHirer) {
      return res.status(403).json({ success: false, error: 'Access denied: hirer account required' });
    }
    next();
  },
};
