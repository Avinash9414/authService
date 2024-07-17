const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const acquireTokenSilent = require("../middlewares/acquireTokenSilent");

const router = express.Router();

router.get(
  "/profile",
  [authMiddleware, acquireTokenSilent],
  authController.getUserProfile
);
router.post(
  "/invite",
  [authMiddleware, acquireTokenSilent],
  authController.invite
);
router.post(
  "/authorize",
  [authMiddleware, acquireTokenSilent],
  authController.authorize
);

module.exports = router;
