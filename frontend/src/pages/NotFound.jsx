import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
      <p
        className="text-7xl font-bold tabular-nums"
        style={{ fontFamily: "var(--font-title)", color: "var(--fifa-neon)", opacity: 0.25 }}
      >
        404
      </p>

      <div>
        <h1 className="text-xl font-bold text-white">Página no encontrada</h1>
        <p className="text-sm text-gray-500 mt-1">
          La ruta que buscas no existe.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Volver atrás
        </button>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
