const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

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

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(409).json({
        message: "Ya existe un administrador con este email.",
      });
    }

    const admin = await Admin.create({
      name,
      email,
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

    const admin = await Admin.findOne({ email }).select("+password");

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