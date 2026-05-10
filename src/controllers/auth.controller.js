const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Admin = require("../models/Admin");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function signToken(adminId) {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function adminResponse(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    branding: admin.branding ?? { leagueName: "", primaryColor: "#24ff7a" },
  };
}

/**
 * POST /auth/register
 * Crea el administrador principal del sistema.
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nombre, email y contraseña son obligatorios.",
      });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "El email no es válido." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    // Only one admin allowed — block registration if one already exists
    const existing = await Admin.countDocuments();
    if (existing > 0) {
      return res.status(403).json({ message: "El registro está deshabilitado." });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(admin._id);

    return res.status(201).json({
      message: "Administrador creado correctamente.",
      token,
      admin: adminResponse(admin),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creando administrador.",
    });
  }
};

/**
 * POST /auth/login
 * Login del administrador.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios.",
      });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!admin) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    const token = signToken(admin._id);

    return res.json({
      message: "Login correcto.",
      token,
      admin: adminResponse(admin),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error iniciando sesión.",
    });
  }
};

/**
 * GET /auth/me
 * Devuelve el administrador autenticado.
 */
exports.me = async (req, res) => {
  return res.json({
    admin: adminResponse(req.admin),
  });
};

/**
 * PATCH /auth/profile
 * Actualiza nombre y/o email del administrador.
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "Debes proporcionar al menos un campo a actualizar." });
    }

    const updates = {};

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "El nombre debe tener al menos 2 caracteres." });
      }
      updates.name = name.trim();
    }

    if (email) {
      const existing = await Admin.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.admin._id },
      });
      if (existing) {
        return res.status(409).json({ message: "Ya existe una cuenta con ese email." });
      }
      updates.email = email.toLowerCase().trim();
    }

    const admin = await Admin.findByIdAndUpdate(req.admin._id, updates, { new: true });
    return res.json({ message: "Perfil actualizado correctamente.", admin: adminResponse(admin) });
  } catch {
    return res.status(500).json({ message: "Error actualizando perfil." });
  }
};

/**
 * PATCH /auth/password
 * Cambia la contraseña del administrador.
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "La contraseña actual y la nueva son obligatorias." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres." });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "La contraseña actual no es correcta." });
    }

    admin.password = newPassword;
    await admin.save();

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch {
    return res.status(500).json({ message: "Error actualizando contraseña." });
  }
};

/**
 * POST /auth/forgot-password
 * Genera token de reset y envía email (si SMTP configurado).
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "El email es obligatorio." });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.json({
        message: "Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    admin.resetPasswordToken = hash;
    admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    if (process.env.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: `"FC Stats Pro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: admin.email,
          subject: "Recuperación de contraseña — FC Stats Pro",
          html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0a1f2e;">
  <div style="background:linear-gradient(135deg,#0a1f2e 0%,#051116 100%);padding:40px 20px;">
    <div style="max-width:520px;margin:0 auto;background:linear-gradient(180deg,rgba(13,34,43,0.88),rgba(6,16,22,0.94));border:1px solid rgba(36,255,122,0.18);border-radius:20px;padding:48px 40px;box-shadow:0 24px 70px rgba(0,0,0,0.55);">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="margin:0;color:#24ff7a;font-size:24px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">FC Stats Pro</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">League Manager Platform</p>
      </div>

      <div style="border-top:1px solid rgba(36,255,122,0.12);border-bottom:1px solid rgba(36,255,122,0.12);padding:32px 0;margin-bottom:32px;">
        <h2 style="margin:0 0 16px;color:#fff;font-size:18px;font-weight:600;letter-spacing:0.02em;">Recupera tu acceso</h2>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.78);font-size:14px;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este mensaje de forma segura.</p>
        <p style="margin:12px 0 0;color:rgba(255,255,255,0.6);font-size:12px;line-height:1.6;">El enlace de recuperación es válido por <strong style="color:rgba(36,255,122,0.9);">1 hora</strong>.</p>
      </div>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resetUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#24ff7a 0%,#1dd65a 100%);color:#04110b;border:none;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.05em;text-transform:uppercase;box-shadow:0 8px 24px rgba(36,255,122,0.25);transition:all 0.3s ease;">Restablecer contraseña</a>
      </div>

      <div style="background:rgba(36,255,122,0.06);border:1px solid rgba(36,255,122,0.15);border-radius:12px;padding:16px;margin-bottom:32px;">
        <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;line-height:1.8;letter-spacing:0.05em;text-transform:uppercase;">Si tienes problemas para hacer clic en el botón, copia y pega este enlace:</p>
        <p style="margin:8px 0 0;color:#24ff7a;font-size:11px;word-break:break-all;line-height:1.6;font-family:'Courier New',monospace;">${resetUrl}</p>
      </div>

      <div style="border-top:1px solid rgba(36,255,122,0.12);padding-top:24px;text-align:center;">
        <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;">Si no solicitaste este cambio, tu contraseña permanecerá protegida.</p>
        <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">© 2026 FC Stats Pro. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        });

      } catch (emailErr) {
        console.error("[ForgotPassword] Error enviando email:", emailErr.message);
      }
    } else {
      console.log(`\n[ForgotPassword] SMTP no configurado. URL de reset (solo dev):\n${resetUrl}\n`);
    }

    const isDev = process.env.NODE_ENV !== "production";
    return res.json({
      message: "Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.",
      ...(isDev && { devResetUrl: resetUrl }),
    });
  } catch (error) {
    console.error("[ForgotPassword]", error);
    return res.status(500).json({ message: "Error procesando la solicitud." });
  }
};

/**
 * POST /auth/reset-password/:token
 * Valida el token y actualiza la contraseña.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!admin) {
      return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado." });
    }

    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    return res.json({ message: "Contraseña restablecida correctamente. Ahora puedes iniciar sesión." });
  } catch (error) {
    console.error("[ResetPassword]", error);
    return res.status(500).json({ message: "Error restableciendo contraseña." });
  }
};

/**
 * PATCH /auth/branding
 * Actualiza el branding personalizado del administrador.
 */
exports.updateBranding = async (req, res) => {
  try {
    const { leagueName, primaryColor } = req.body;
    const $set = {};

    if (leagueName !== undefined) {
      const trimmed = String(leagueName).trim().slice(0, 100);
      $set["branding.leagueName"] = trimmed;
    }

    if (primaryColor !== undefined) {
      if (!HEX_COLOR_RE.test(primaryColor)) {
        return res.status(400).json({ message: "El color debe ser un hex válido (#rrggbb)." });
      }
      $set["branding.primaryColor"] = primaryColor;
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: "Debes proporcionar al menos un campo de branding." });
    }

    const admin = await Admin.findByIdAndUpdate(req.admin._id, { $set }, { new: true });
    return res.json({ message: "Branding actualizado correctamente.", admin: adminResponse(admin) });
  } catch {
    return res.status(500).json({ message: "Error actualizando branding." });
  }
};