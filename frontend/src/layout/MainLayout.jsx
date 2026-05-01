import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/logo-league-manager.png";

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition";
const linkIdle =
  "text-[var(--fifa-mute)] hover:text-[var(--fifa-text)] hover:bg-white/5";
const linkActive =
  "text-[var(--fifa-text)] bg-white/5 ring-1 ring-[var(--fifa-neon)]/20 shadow-glow";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    to: "/tournaments",
    label: "Torneos",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
  },
  {
    to: "/clubs",
    label: "Clubes",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
];

export default function MainLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-fifa-radial">
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{
          borderColor: "rgba(36,255,122,0.15)",
          backgroundColor: "rgba(4,8,14,0.72)",
          boxShadow: "0 1px 0 0 rgba(36,255,122,0.08), 0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          {/* Logo + branding */}
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={logo}
              alt="FC Stats Pro League Manager"
              className="h-28 w-auto object-contain sm:h-36"
              style={{ filter: "drop-shadow(0 0 22px rgba(36,255,122,0.28))" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="hidden sm:flex flex-col leading-none gap-0.5">
              <span
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.28em",
                  color: "var(--fifa-mute)",
                  textTransform: "uppercase",
                }}
              >
                FC Stats Pro
              </span>
              <span
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "1.5rem",
                  letterSpacing: "0.12em",
                  color: "var(--fifa-neon)",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                League Manager
              </span>
            </div>
          </div>

          {/* Admin info + logout */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="hidden sm:flex flex-col items-end"
              style={{ color: "var(--fifa-mute)" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--fifa-text)",
                }}
              >
                {admin?.name ?? "Admin"}
              </span>
              <span style={{ fontSize: "0.7rem" }}>{admin?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 font-semibold ring-1 transition"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "var(--fifa-text)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.05em",
                boxShadow: "0 0 0 1px var(--fifa-line)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(36,255,122,.35), 0 0 14px rgba(36,255,122,.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px var(--fifa-line)";
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── Content grid ── */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 xl:col-span-2">
          <div
            className="overflow-hidden rounded-2xl shadow-glow"
            style={{
              background: "linear-gradient(180deg, rgba(13,34,43,.92), rgba(6,16,22,.92))",
              border: "1px solid var(--fifa-line)",
            }}
          >
            <div
              className="border-b px-4 py-4"
              style={{ borderColor: "rgba(255,255,255,0.10)" }}
            >
              <div
                className="text-xs font-bold tracking-widest"
                style={{
                  fontFamily: "var(--font-title)",
                  color: "var(--fifa-mute)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Navegación
              </div>
            </div>

            <div className="px-3 py-3">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkIdle}`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 min-w-0 md:col-span-9 xl:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
