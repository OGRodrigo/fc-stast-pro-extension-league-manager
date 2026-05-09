const express = require("express");
const {
  register,
  login,
  me,
  updateProfile,
  updatePassword,
  updateBranding,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");
const { passwordResetLimiter, passwordResetTokenLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetTokenLimiter, resetPassword);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, updatePassword);
router.patch("/branding", protect, updateBranding);

module.exports = router;