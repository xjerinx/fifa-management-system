import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api/axios";

export default function Layout() {
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
    <div className="flex min-h-screen bg-[#090d16] text-slate-200 antialiased font-body">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 h-14 bg-[#090d16]/95 backdrop-blur-md z-30 flex items-center justify-between px-6 border-b border-[#151b29]">
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
            <div className="flex items-center gap-2 bg-[#111622] px-3 py-1.5 rounded-lg border border-[#1b2234] w-full max-w-sm focus-within:border-emerald-500/50 transition-colors">
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
              <kbd className="hidden md:inline-block text-[10px] bg-[#1a2233] text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Right: Live Feed Indicator, Notifications & Profile */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Live Feed Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#1b2234]">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-white tracking-wide">C. DEL PIERO</span>
                <span className="text-[10px] text-slate-400">Lead Commissioner</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-[1520px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}