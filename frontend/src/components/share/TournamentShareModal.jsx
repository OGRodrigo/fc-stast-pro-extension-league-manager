import { useRef } from "react";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import logo from "../../assets/logo-league-manager.png";

export default function TournamentShareModal({ isOpen, onClose, tournament }) {
  const qrRef = useRef(null);

  if (!isOpen || !tournament) return null;

  const slug = tournament.publicSlug || tournament.slug;
  const shareUrl = `${window.location.origin}/public/tournaments/${slug}`;
  const shareText = `Sigue el torneo ${tournament.name} en FC Stats Pro League Manager`;
  const encodedText = encodeURIComponent(`${shareText}: ${shareUrl}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      toast.success("Link copiado para compartir");
      return;
    }

    try {
      await navigator.share({
        title: tournament.name,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // Usuario canceló
    }
  }

  async function downloadQr() {
    try {
      const svg = qrRef.current?.querySelector("svg");
      if (!svg) return;

      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 900;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 90, 90, 720, 720);

        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `fc-stats-pro-${slug}-qr.png`;
        a.click();
      };

      image.src = url;
    } catch {
      toast.error("No se pudo descargar el QR");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-[30px] border p-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,34,43,.98), rgba(6,16,22,.98))",
          borderColor: "rgba(36,255,122,.18)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.03), 0 28px 80px rgba(0,0,0,.72)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 rounded-xl border px-3 py-2 text-sm transition-all"
          style={{
            color: "var(--fifa-mute)",
            borderColor: "rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.04)",
          }}
        >
          ×
        </button>

        <div className="flex-1">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="FC Stats Pro League Manager"
              className="h-32 w-auto object-contain"
              style={{
                filter: "drop-shadow(0 0 36px rgba(36,255,122,.35))",
              }}
            />
          </div>

          <div className="mt-5 text-center">
            <p
              className="text-xs uppercase tracking-[0.32em]"
              style={{
                color: "var(--fifa-neon)",
                fontFamily: "var(--font-title)",
              }}
            >
              Compartir torneo
            </p>

            <h2
              className="mt-3 text-3xl font-black uppercase"
              style={{
                color: "var(--fifa-text)",
                fontFamily: "var(--font-title)",
              }}
            >
              {tournament.name}
            </h2>

            <p
              className="mx-auto mt-3 max-w-[420px] text-sm leading-7"
              style={{ color: "var(--fifa-mute)" }}
            >
              Comparte tabla, bracket, resultados y estadísticas públicas.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
          <div
            className="rounded-3xl p-4"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(36,255,122,.14)",
            }}
          >
            <div ref={qrRef} className="rounded-2xl bg-white p-4">
              <QRCode
                value={shareUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#061016"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>

            <p
              className="mt-3 text-center text-xs leading-5"
              style={{ color: "var(--fifa-mute)" }}
            >
              Escanea para seguir el torneo
            </p>
          </div>

          <div className="space-y-3">
            <div
              className="rounded-2xl border p-3 text-xs break-all"
              style={{
                color: "var(--fifa-mute)",
                borderColor: "rgba(255,255,255,.08)",
                backgroundColor: "rgba(255,255,255,.035)",
              }}
            >
              {shareUrl}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={nativeShare} className="btn-primary">
                Compartir
              </button>

              <button type="button" onClick={copyLink} className="btn-secondary">
                Copiar link
              </button>

              <a
                href={`https://wa.me/?text=${encodedText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center"
              >
                WhatsApp
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodedText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center"
              >
                X / Twitter
              </a>

              <button
                type="button"
                onClick={async () => {
                  await copyLink();
                  toast.success("Link copiado. Pégalo en Instagram.");
                }}
                className="btn-secondary"
              >
                Instagram
              </button>

              <button
                type="button"
                onClick={async () => {
                  await copyLink();
                  toast.success("Link copiado. Pégalo en Discord.");
                }}
                className="btn-secondary"
              >
                Discord
              </button>

              <button
                type="button"
                onClick={downloadQr}
                className="btn-secondary col-span-2"
              >
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}