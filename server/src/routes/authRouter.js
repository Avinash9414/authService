const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/signin", authController.getAuthCodeUrl);
router.post("/redirect", authController.acquireTokenByCode);
router.get("/signout", authMiddleware, authController.logout);

module.exports = router;
