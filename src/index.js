require("dotenv").config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ FATAL: JWT_SECRET no definido o demasiado corto. Servidor no iniciado.");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  });

  process.on("SIGINT", () => {
    console.log("🛑 Cerrando servidor...");
    server.close(() => {
      console.log("✅ Servidor cerrado correctamente");
      process.exit(0);
    });
  });
}

startServer();