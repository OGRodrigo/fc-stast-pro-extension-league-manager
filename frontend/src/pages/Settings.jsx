import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
import { profileApi } from "../api/index";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const cardStyle = {
  background: "linear-gradient(180deg, rgba(13,34,43,.92), rgba(6,16,22,.92))",
  border: "1px solid var(--fifa-line)",
};

function SectionCard({ children }) {
  return (
    <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, autoComplete }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-1"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--fifa-line)",
        color: "var(--fifa-text)",
        fontFamily: "var(--font-ui)",
        focusRingColor: "rgba(36,255,122,.4)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(36,255,122,.45)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--fifa-line)"; }}
    />
  );
}

function SaveButton({ loading, children = "Guardar cambios" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
      style={{
        background: "rgba(36,255,122,0.12)",
        border: "1px solid rgba(36,255,122,0.3)",
        color: "var(--fifa-neon)",
        fontFamily: "var(--font-ui)",
        letterSpacing: "0.04em",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(36,255,122,0.18)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(36,255,122,0.12)"; }}
    >
      {loading ? "Guardando…" : children}
    </button>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "var(--fifa-line)" }} />
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--fifa-line)" }} />
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "perfil",       label: "Perfil",       Icon: IconUser },
  { id: "seguridad",    label: "Seguridad",    Icon: IconLock },
  { id: "branding",     label: "Branding",     Icon: IconSparkle },
  { id: "preferencias", label: "Preferencias", Icon: IconSliders },
];

// ── Sections ──────────────────────────────────────────────────────────────────

function PerfilSection({ admin, updateAdmin }) {
  const [name, setName]   = useState(admin?.name  ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await profileApi.updateProfile({ name, email });
      updateAdmin(data.admin);
      toast.success("Perfil actualizado correctamente.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error actualizando perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <Divider label="Información personal" />

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(36,255,122,0.15), rgba(36,255,122,0.04))",
            border: "1px solid rgba(36,255,122,0.25)",
            color: "var(--fifa-neon)",
            fontFamily: "var(--font-title)",
          }}
        >
          {(admin?.name ?? "A").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
            {admin?.name ?? "Admin"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fifa-mute)" }}>{admin?.email}</p>
          <p
            className="text-xs mt-1 rounded-lg px-2 py-0.5 inline-block"
            style={{ background: "rgba(36,255,122,0.08)", border: "1px solid rgba(36,255,122,0.2)", color: "var(--fifa-neon)" }}
          >
            Administrador
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre completo">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email.com" autoComplete="email" />
        </Field>
        <div className="pt-1">
          <SaveButton loading={loading} />
        </div>
      </form>
    </SectionCard>
  );
}

function SeguridadSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await profileApi.updatePassword({ currentPassword, newPassword });
      toast.success("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error actualizando contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <Divider label="Cambiar contraseña" />
      <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
        Usa una contraseña segura de al menos 6 caracteres. Te recomendamos combinar letras, números y símbolos.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Contraseña actual">
          <Input
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        <Field label="Nueva contraseña">
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <Input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>

        {/* Password strength indicator */}
        {newPassword.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => {
                const strength = Math.min(
                  4,
                  (newPassword.length >= 6 ? 1 : 0) +
                  (/[A-Z]/.test(newPassword) ? 1 : 0) +
                  (/[0-9]/.test(newPassword) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0)
                );
                const colors = ["#ff4d6d", "#ff9f43", "#ffd166", "#24ff7a"];
                return (
                  <div
                    key={level}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{ background: level <= strength ? colors[strength - 1] : "rgba(255,255,255,0.08)" }}
                  />
                );
              })}
            </div>
            <p className="text-xs" style={{ color: "var(--fifa-mute)" }}>
              {(() => {
                const s = Math.min(
                  4,
                  (newPassword.length >= 6 ? 1 : 0) +
                  (/[A-Z]/.test(newPassword) ? 1 : 0) +
                  (/[0-9]/.test(newPassword) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0)
                );
                return ["Muy débil", "Débil", "Media", "Fuerte"][s - 1] ?? "Muy débil";
              })()}
            </p>
          </div>
        )}

        <div className="pt-1">
          <SaveButton loading={loading}>Cambiar contraseña</SaveButton>
        </div>
      </form>
    </SectionCard>
  );
}

function BrandingSection({ admin, updateAdmin }) {
  const [leagueName, setLeagueName]     = useState(admin?.branding?.leagueName   ?? "");
  const [primaryColor, setPrimaryColor] = useState(admin?.branding?.primaryColor ?? "#24ff7a");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await profileApi.updateBranding({ leagueName, primaryColor });
      updateAdmin(data.admin);
      toast.success("Branding actualizado correctamente.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error actualizando branding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <Divider label="Identidad de la liga" />
      <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
        Personaliza el nombre y color de acento de tu liga. Estos datos se muestran en las páginas públicas de torneos.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre de la liga">
          <Input
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="Ej: Liga Premier FC Stats"
          />
        </Field>

        <Field label="Color de acento">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-xl border-0 bg-transparent p-0.5"
              style={{ border: "1px solid var(--fifa-line)" }}
            />
            <div
              className="flex-1 rounded-xl px-4 py-3 text-sm font-mono"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--fifa-line)",
                color: "var(--fifa-text)",
              }}
            >
              {primaryColor}
            </div>
          </div>
        </Field>

        {/* Live preview */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--fifa-line)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)" }}>
            Preview
          </p>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${primaryColor}22`, border: `1px solid ${primaryColor}44`, color: primaryColor }}
            >
              L
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
              {leagueName || "Nombre de la liga"}
            </span>
          </div>
          <div
            className="h-0.5 w-12 rounded-full"
            style={{ background: primaryColor }}
          />
        </div>

        <div className="pt-1">
          <SaveButton loading={loading} />
        </div>
      </form>
    </SectionCard>
  );
}

function PreferenciasSection() {
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("lm_notif") !== "false"
  );

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("lm_notif", String(next));
    toast.success(next ? "Notificaciones activadas." : "Notificaciones desactivadas.");
  }

  return (
    <SectionCard>
      <Divider label="Preferencias del sistema" />

      <div className="space-y-3">
        {/* Notificaciones */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--fifa-line)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
              Notificaciones toast
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fifa-mute)" }}>
              Mensajes de confirmación al guardar cambios
            </p>
          </div>
          <button
            onClick={toggleNotifications}
            className="relative h-6 w-11 rounded-full transition-all shrink-0"
            style={{ background: notifications ? "rgba(36,255,122,0.25)" : "rgba(255,255,255,0.08)" }}
            aria-label="Toggle notificaciones"
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
              style={{
                left: notifications ? "calc(100% - 1.375rem)" : "0.125rem",
                background: notifications ? "#24ff7a" : "rgba(255,255,255,0.3)",
                boxShadow: notifications ? "0 0 8px rgba(36,255,122,0.4)" : "none",
              }}
            />
          </button>
        </div>

        {/* Idioma */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--fifa-line)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
              Idioma de la interfaz
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fifa-mute)" }}>
              El sistema opera en español por defecto
            </p>
          </div>
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--fifa-line)", color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}
          >
            Español
          </div>
        </div>

        {/* Versión */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--fifa-line)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
              Versión de la aplicación
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fifa-mute)" }}>
              FC Stats Pro League Manager
            </p>
          </div>
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "rgba(36,255,122,0.06)", border: "1px solid rgba(36,255,122,0.18)", color: "var(--fifa-neon)", fontFamily: "var(--font-ui)" }}
          >
            v1.0
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { admin, updateAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-title)", color: "var(--fifa-text)", letterSpacing: "-0.01em" }}
        >
          Configuración
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fifa-mute)" }}>
          Gestiona tu perfil, seguridad y personalización del sistema.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? "rgba(36,255,122,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "rgba(36,255,122,0.28)" : "rgba(255,255,255,0.07)"}`,
                color: active ? "var(--fifa-neon)" : "var(--fifa-mute)",
                fontFamily: "var(--font-ui)",
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {activeTab === "perfil"       && <PerfilSection       admin={admin} updateAdmin={updateAdmin} />}
        {activeTab === "seguridad"    && <SeguridadSection    />}
        {activeTab === "branding"     && <BrandingSection     admin={admin} updateAdmin={updateAdmin} />}
        {activeTab === "preferencias" && <PreferenciasSection />}
      </motion.div>
    </div>
  );
}
