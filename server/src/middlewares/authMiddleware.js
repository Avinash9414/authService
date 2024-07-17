// const authService = require("../services/authService");

const authMiddleware = (req, res, next) => {
  if (req.session.authInfo) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
