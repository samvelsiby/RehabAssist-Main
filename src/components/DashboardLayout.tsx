import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Users,
  BarChart3,
  Dumbbell,
  LogOut,
  Bell,
  Settings,
  ChevronDown,
  HeartPulse,
} from "lucide-react";
import { useState } from "react";

const physioLinks = [
  { to: "/dashboard", label: "Overview" },
  { to: "/patients", label: "Patients" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
];

const clientLinks = [
  { to: "/dashboard", label: "Overview" },
  { to: "/exercises", label: "My Exercises" },
  { to: "/progress", label: "Progress" },
  { to: "/plans", label: "Plans" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === "physio" ? physioLinks : clientLinks;
  const [menuOpen, setMenuOpen] = useState(false);

  // Avatar initials
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f7" }}>
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e8e8ed",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6">
          {/* Top row: logo + icons + avatar */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #00c9a7 0%, #0074e4 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <HeartPulse size={16} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", letterSpacing: "-0.3px" }}>
                RehabAssist
              </span>
            </div>

            {/* Right: notification + avatar */}
            <div className="flex items-center gap-3">
              <button
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1px solid #e8e8ed", backgroundColor: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Bell size={16} color="#6b7280" />
              </button>

              {/* Avatar dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "4px 10px 4px 4px",
                    borderRadius: 22, border: "1px solid #e8e8ed",
                    backgroundColor: "#fff", cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, #00c9a7, #0074e4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#fff",
                    }}
                  >
                    {initials}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={12} color="#9ca3af" />
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute", top: 44, right: 0,
                      backgroundColor: "#fff", borderRadius: 12,
                      border: "1px solid #e8e8ed",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      minWidth: 180, padding: "6px 0", zIndex: 100,
                    }}
                    onBlur={() => setMenuOpen(false)}
                  >
                    <div style={{ padding: "8px 16px", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{user?.name}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); navigate("/"); }}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "10px 16px", fontSize: 13, color: "#ef4444",
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nav tabs row */}
          <nav className="flex items-center gap-1 -mb-px">
            {links.map(link => {
              const isActive = location.pathname === link.to ||
                (link.to !== "/dashboard" && location.pathname.startsWith(link.to));
              return (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#00c9a7" : "#6b7280",
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid #00c9a7" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.target as HTMLElement).style.color = "#374151"; }}
                  onMouseLeave={e => { if (!isActive) (e.target as HTMLElement).style.color = "#6b7280"; }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
