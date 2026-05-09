const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta más tarde." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de autenticación. Intenta más tarde." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de recuperación. Intenta de nuevo en una hora." },
  skip: (req) => req.method !== "POST",
});

const passwordResetTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta de nuevo en una hora." },
  skip: (req) => req.method !== "POST",
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Límite de análisis de imágenes alcanzado. Espera un momento." },
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  passwordResetTokenLimiter,
  aiLimiter,
};
