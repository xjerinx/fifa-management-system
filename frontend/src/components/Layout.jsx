import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "./ErrorBoundary";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState("checking");
  const [retrying, setRetrying] = useState(false);
  const [search, setSearch] = useState("");

  const checkHealth = async () => {
    setRetrying(true);
    try {
      const res = await api.get('/health');
      if (res.data?.success) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch {
      setBackendStatus('disconnected');
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#060a14] text-slate-200 antialiased font-body">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 h-14 bg-[#060a14]/95 backdrop-blur-md z-30 flex items-center justify-between px-6 border-b border-[#131d30]">
          {/* Left: Search Input */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <img
              alt="FIFA Operations"
              className="h-6 w-6 object-contain shrink-0 hidden sm:inline-block"
              src="/assets/fifa-ops-crest.png"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="flex items-center gap-2 bg-[#0b1222] px-3 py-1.5 rounded-lg border border-[#17233c] w-full max-w-sm focus-within:border-cyan-400/60 transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[16px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities, rules, matches..."
                className="bg-transparent text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none w-full"
                type="text"
              />
              <kbd className="hidden md:inline-block text-[10px] bg-[#141f36] text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Right: Live Feed Indicator, Notifications & Profile */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Live Feed Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>LIVE FEED 2026/27 ACTIVE</span>
            </div>

            {/* Offline Alert if Backend Down */}
            {backendStatus === "disconnected" && (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>Offline</span>
                <button
                  onClick={checkHealth}
                  disabled={retrying}
                  className="hover:text-white ml-0.5"
                  title="Retry"
                >
                  <span className={`material-symbols-outlined text-[13px] ${retrying ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                </button>
              </div>
            )}

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded-lg relative"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#17233c]">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "CD"}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-white tracking-wide">
                  {user?.name || "C. DEL PIERO"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {user?.title || "Lead Commissioner"}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                title="Sign Out to Portal"
                className="ml-1 p-1 text-slate-400 hover:text-rose-400 transition-colors rounded hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-[1520px] w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}