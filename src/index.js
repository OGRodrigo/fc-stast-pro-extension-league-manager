require("dotenv").config();

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