import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { notificationsAPI } from "@/lib/api";
import {
  Bell, X,
  LayoutDashboard, HeartPulse, MessageSquare, Activity,
  FileText, GitCompareArrows, Stethoscope, Brain,
  User, LogOut
} from "lucide-react";

export function ReducedMotionToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("mt-reduced-motion") === "on";
    const system = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initial = stored || system;
    setOn(initial);
    document.documentElement.dataset.reducedMotion = initial ? "on" : "off";
  }, []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    document.documentElement.dataset.reducedMotion = next ? "on" : "off";
    localStorage.setItem("mt-reduced-motion", next ? "on" : "off");
    window.dispatchEvent(new Event("mt:reduced-motion"));
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Enable animations" : "Reduce motion"}
      title={on ? "Motion reduced — click to re-enable" : "Reduce motion"}
      className="hidden md:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-2 rounded-full border border-line hover:bg-green-soft transition-colors"
    >
      <span className={`relative w-8 h-4 rounded-full transition-colors ${on ? "bg-green" : "bg-line"}`}>
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
      {on ? "Motion off" : "Motion"}
    </button>
  );
}

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("mt-theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : system;
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mt-theme", next ? "dark" : "light");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-line hover:bg-green-soft transition-colors text-base"
    >
      <span
        className="transition-transform duration-500"
        style={{ transform: dark ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        {dark ? "☀︎" : "☾"}
      </span>
    </button>
  );
}

function NavLinks({ user }) {
  return (
    <nav className="hidden md:flex items-center gap-8 text-sm">
      <Link to="/" className="a-underline">Home</Link>
      <Link to="/services" className="a-underline">Services</Link>
      <Link to="/dashboard" className="a-underline">Dashboard</Link>
      <Link to="/twin" className="a-underline">Twin</Link>
      <Link to="/about" className="a-underline">About</Link>
      <Link to="/contact" className="a-underline">Contact</Link>
    </nav>
  );
}

/* ── Notification Bell ──────────────────────────────────────────── */

function NotificationBell({ align = "right" }) {
  const { notifications, unreadCount, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleMarkAllRead() {
    markAllRead();
    try { await notificationsAPI.markAllRead(); } catch { /* best-effort */ }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-line hover:bg-green-soft transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-12 w-80 max-h-96 overflow-y-auto bg-white dark:bg-ink border border-line rounded-2xl shadow-xl z-50`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-sm font-bold">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] uppercase tracking-widest text-green font-bold hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-ink/50 text-sm">No notifications yet.</div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <div
                key={n._id}
                className={`px-4 py-3 border-b border-line/50 last:border-0 text-sm ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      n.severity === 'critical' ? 'bg-red-500' :
                      n.severity === 'warning' ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-xs">{n.title}</p>
                    {n.message && <p className="text-ink/60 text-xs mt-0.5">{n.message}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/85 border-b border-line">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
        <Link to="/" className="flex items-center a-hover-tilt">
          <Logo />
        </Link>
        <NavLinks user={user} />
        <div className="flex items-center gap-3">
          <ReducedMotionToggle />
          <DarkModeToggle />
          {user && <NotificationBell />}
          {user ? (
            <>
              <Link to="/profile" className="a-underline text-sm font-semibold hidden md:inline">
                {user.first_name || user.username}
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate({ to: "/" }); }}
                className="a-button !bg-red-500 hover:!bg-red-600 !border-red-500"
              >
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Logout">Logout</span>
                </span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="a-button a-button--ghost hidden md:inline-flex">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Log in">Log in</span>
                </span>
              </Link>
              <Link to="/register" className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Get started →">Get started →</span>
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink dark:bg-bg text-white py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="mb-4">
            <Logo inverted />
          </div>
          <p className="text-sm text-white/60">Your living digital health twin. Est. 2026.</p>
        </div>
        <div>
          <p className="uppercase tracking-widest text-xs text-white/50 mb-3">Product</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/dashboard" className="a-underline">Dashboard</Link></li>
            <li><Link to="/twin" className="a-underline">Digital Twin</Link></li>
            <li><Link to="/chatbot" className="a-underline">AI Chatbot</Link></li>
            <li><Link to="/whatif" className="a-underline">What-If Simulator</Link></li>
          </ul>
        </div>
        <div>
          <p className="uppercase tracking-widest text-xs text-white/50 mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="a-underline">About</Link></li>
            <li><Link to="/services" className="a-underline">Services</Link></li>
            <li><Link to="/contact" className="a-underline">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="uppercase tracking-widest text-xs text-white/50 mb-3">Contact</p>
          <p className="text-sm">
            1-800-MEDITWIN
            <br />
            care@meditwin.example
          </p>
        </div>
      </div>
      <p className="max-w-7xl mx-auto mt-12 text-xs text-white/40">
        © {new Date().getFullYear()} Medi Twin. All rights reserved.
      </p>
    </footer>
  );
}

export function Layout({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-ink flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/**
 * AppShell — used by authenticated pages. Sidebar on the left, content on the right.
 * Collapsed by default (icons only), expands on hover to show labels.
 * Active route is highlighted with brand green.
 */
let _sidebarExpanded = false;

export function AppShell({ children, active }) {
  const { user, logout, loading } = useAuth();
  const [expanded, setExpanded] = useState(_sidebarExpanded);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    function setVar() {
      const isDesktop = window.innerWidth >= 768;
      document.documentElement.style.setProperty(
        "--sidebar-w",
        isDesktop ? (expanded ? "256px" : "64px") : "0px"
      );
    }
    setVar();
    window.addEventListener("resize", setVar);
    return () => {
      window.removeEventListener("resize", setVar);
      document.documentElement.style.removeProperty("--sidebar-w");
    };
  }, [expanded]);

  const linkMeta = {
    "/dashboard":  { label: "Dashboard",       icon: LayoutDashboard },
    "/twin":       { label: "My Health Twin",   icon: HeartPulse },
    "/chatbot":    { label: "AI Chatbot",       icon: MessageSquare },
    "/lifestyle":  { label: "Lifestyle",        icon: Activity },
    "/reports":    { label: "Reports",          icon: FileText },
    "/whatif":     { label: "What-If",          icon: GitCompareArrows },
    "/doctor":     { label: "Doctor Panel",     icon: Stethoscope },
    "/admin/ml":   { label: "ML Dashboard",     icon: Brain },
  };

  const links = [
    { to: "/dashboard" },
    { to: "/twin" },
    { to: "/chatbot" },
    { to: "/lifestyle" },
    { to: "/reports" },
    { to: "/whatif" },
  ];
  if (user?.is_doctor) links.push({ to: "/doctor" });
  if (user?.is_admin_user) links.push({ to: "/admin/ml" });

  const initials = ((user?.first_name || user?.username || "U")[0] || "U").toUpperCase();
  const fullName = (user?.first_name || "") + (user?.last_name ? " " + user.last_name : "") || user?.username;
  const role = user?.is_admin_user ? "Admin" : user?.is_doctor ? "Doctor" : "Patient";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center opacity-50 animate-pulse">
          <HeartPulse size={48} className="text-green mb-4" />
          <p className="text-sm uppercase tracking-widest font-semibold text-green">Loading MediTwin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Do not render AppShell if not authenticated (redirect handles it)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-ink flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        onMouseEnter={() => { _sidebarExpanded = true; setExpanded(true); }}
        onMouseLeave={() => { _sidebarExpanded = false; setExpanded(false); }}
        className={`md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col hidden
          border-r border-line bg-green-soft/40
          transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${expanded ? "w-64" : "w-16"}`}
      >
        {/* User avatar */}
        <div className="border-b border-line pb-3 mb-2">
          <div className="flex items-center justify-center mt-3">
            <Link
              to="/profile"
              className={`flex items-center gap-3 rounded-xl transition-colors hover:bg-white/60 ${
                expanded ? "ticket p-3 mx-3 w-full" : "p-1"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green text-white grid place-items-center font-bold shrink-0 text-sm">
                {initials}
              </div>
              {expanded && (
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold truncate">{fullName}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green truncate">{role}</p>
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {links.map((l) => {
            const meta = linkMeta[l.to];
            const Icon = meta.icon;
            const isActive = active === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                title={expanded ? undefined : meta.label}
                className={`flex items-center gap-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  expanded ? "px-3 py-2" : "justify-center p-2"
                } ${
                  isActive
                    ? "bg-green text-white shadow-sm"
                    : "text-ink/70 hover:bg-green-soft hover:text-ink"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {expanded && <span className="truncate">{meta.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className={`border-t border-line p-2 ${expanded ? "" : "flex flex-col items-center"}`}>
          <Link
            to="/profile"
            title={expanded ? undefined : "Profile"}
            className={`flex items-center gap-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              expanded ? "px-3 py-2 w-full" : "justify-center p-2"
            } ${
              active === "/profile"
                ? "bg-green text-white"
                : "text-ink/70 hover:bg-green-soft hover:text-ink"
            }`}
          >
            <User size={20} className="shrink-0" />
            {expanded && <span>Profile</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? "md:ml-64" : "md:ml-16"}`}>
        <Header />
        {children}
      </div>
    </div>
  );
}
