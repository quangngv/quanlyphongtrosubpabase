import { LogOut, ShieldCheck, Sparkles, Home, TrendingUp, History } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: '/lookup', label: 'Trang chủ', icon: Home },
    { path: '/statistics', label: 'Thống kê', icon: TrendingUp },
    { path: '/history', label: 'Lịch sử', icon: History },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100, backdropFilter: "blur(8px)" }}>
        {/* Top bar - Logo and user info */}
        <div className="container" style={{ padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link to="/lookup" style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background:
                  "linear-gradient(140deg, rgba(108,242,194,0.18), rgba(109,167,255,0.14))",
                display: "grid",
                placeItems: "center",
                flexShrink: 0
              }}
            >
              <Sparkles size={20} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontWeight: 800, letterSpacing: "0.02em", fontSize: "clamp(14px, 4vw, 18px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Nhà Trọ Client</div>
              <div style={{ color: "var(--muted)", fontSize: "clamp(11px, 3vw, 13px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Tra cứu thông tin phòng</div>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div className="badge-soft hide-on-mobile" style={{ fontSize: 13 }}>
              <ShieldCheck size={14} color="var(--accent)" />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{user?.property ?? "Chưa đăng nhập"}</span>
            </div>
            <button className="button-secondary" onClick={handleLogout} style={{ fontSize: 13, padding: "8px 12px" }}>
              <LogOut size={16} />
              <span className="hide-on-small-mobile">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Bottom navigation bar */}
        <div style={{ borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.5)" }}>
          <div className="container" style={{ padding: "8px 8px" }}>
            <nav style={{ display: "flex", gap: 6 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={isActive ? 'nav-item-active' : 'nav-item'}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "10px 8px",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="container main-area">{children}</main>

      <style>{`
        .nav-item {
          background: transparent;
          color: var(--muted);
        }
        .nav-item:hover {
          background: rgba(47, 125, 244, 0.08);
          color: var(--accent-2);
        }
        .nav-item-active {
          background: linear-gradient(120deg, rgba(47, 191, 143, 0.15), rgba(47, 125, 244, 0.15));
          color: var(--accent-2);
        }
        .hide-on-mobile {
          display: inline-flex;
        }
        .hide-on-small-mobile {
          display: inline;
        }
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
        @media (max-width: 400px) {
          .hide-on-small-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
