import { useParams, useNavigate } from "react-router-dom";

export default function ImportMatchImage() {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg">
      <button
        onClick={() => navigate(`/tournaments/${tournamentId}`)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-5"
      >
        <BackIcon />
        Volver al torneo
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Importar partido por imagen</h1>
          <p className="page-subtitle">Módulo de integración IA</p>
        </div>
      </div>

      <div className="card p-12 text-center space-y-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border"
          style={{
            backgroundColor: "rgba(234,179,8,0.08)",
            borderColor: "rgba(234,179,8,0.2)",
          }}
        >
          <SparklesIcon />
        </div>

        <div>
          <h2 className="text-white font-semibold text-base">
            Módulo IA pendiente de integración
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Este módulo permitirá analizar capturas de pantalla o fotos de resultados
            para extraer automáticamente los datos del partido usando inteligencia artificial.
          </p>
        </div>

        <div className="space-y-2 text-left max-w-xs mx-auto">
          {[
            "Subir imagen del resultado",
            "Extracción automática de marcador",
            "Detección de clubes y estadísticas",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <div
          className="inline-flex items-center gap-2 text-xs text-yellow-400 px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: "rgba(234,179,8,0.06)",
            borderColor: "rgba(234,179,8,0.2)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Próximamente disponible
        </div>

        <button
          onClick={() => navigate(`/tournaments/${tournamentId}`)}
          className="btn-secondary mx-auto"
        >
          Volver al torneo
        </button>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}
