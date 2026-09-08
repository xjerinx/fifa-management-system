import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Home");
  const [showInfoModal, setShowInfoModal] = useState(null); // 'About' | 'Features' | null

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-white overflow-x-hidden flex flex-col justify-between select-none">
      {/* Background Graphic & Stadium Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Background Image: Stadium pitch with floodlights & match ball */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-right transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('/assets/hero-football-stadium.jpg')`,
            backgroundPosition: "75% center",
          }}
        />

        {/* Cinematic dark gradients & blue vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040711] via-[#050a18]/90 to-transparent w-full md:w-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040711] via-[#040711]/40 to-[#040711]/80" />
        
        {/* Stadium cyan floodlight ambient glow */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-sky-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-24 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
        
        {/* Subtle Pitch Geometry Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-screen"
          style={{
            backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── TOP NAVIGATION ── */}
      <header className="relative z-20 w-full max-w-[1720px] mx-auto px-6 sm:px-12 pt-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="font-headline font-black text-2xl tracking-[0.2em] text-white group-hover:text-cyan-400 transition-colors">
              FIFA
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              Global Platform
            </span>
          </Link>
        </div>

        {/* Minimal Nav Items */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-[#090e1c]/80 backdrop-blur-md border border-[#1b263b]/80 rounded-full px-4 py-1.5 shadow-xl">
          {["Home", "About", "Features"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setActiveTab(item);
                if (item !== "Home") setShowInfoModal(item);
              }}
              className={`px-3.5 py-1 text-xs font-medium tracking-wide transition-all rounded-full relative ${
                activeTab === item
                  ? "text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item}
              {activeTab === item && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
              )}
            </button>
          ))}
        </nav>

        {/* Right Slogan */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider text-slate-400">
            Football Unites Us
          </span>
          <span className="w-6 h-[1px] bg-cyan-400/60" />
        </div>
      </header>

      {/* ── HERO CONTENT AREA ── */}
      <main className="relative z-10 w-full max-w-[1720px] mx-auto px-6 sm:px-12 py-10 md:py-14 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          {/* Sub-tag Category line */}
          <div className="flex items-center gap-3 text-cyan-400 text-xs font-mono font-bold tracking-[0.3em] uppercase">
            <span>PLAY</span>
            <span className="text-slate-600">/</span>
            <span>MANAGE</span>
            <span className="text-slate-600">/</span>
            <span>CONNECT</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.03] tracking-tight uppercase">
            <span className="text-white block">THE FUTURE OF</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 drop-shadow-[0_0_35px_rgba(56,189,248,0.25)] block">
              FOOTBALL MANAGEMENT
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            One connected platform for football organizations, teams, players, coaches, matches, tournaments and fans — all in one place.
          </p>

          {/* User Type Cards Section */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* 1. FAN / CONSUMER CARD */}
            <div
              onClick={() => navigate("/login?role=fan")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/login?role=fan")}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-[#0e1628]/90 to-[#070b16]/95 border border-cyan-500/30 p-5 cursor-pointer transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] hover:-translate-y-1"
            >
              {/* Card top icon + tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-cyan-400/80 uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  FAN ACCESS
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="font-headline font-bold text-lg text-white group-hover:text-cyan-300 transition-colors mb-1 uppercase tracking-wide">
                CONSUMER
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-5 group-hover:text-slate-300">
                Explore matches, tickets and football experiences.
              </p>

              {/* Button / Action */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 group-hover:text-white uppercase transition-colors">
                  ENTER AS FAN
                </span>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1 shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* 2. ORGANIZATION CARD */}
            <div
              onClick={() => navigate("/login?role=org")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/login?role=org")}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-[#0e1628]/90 to-[#070b16]/95 border border-sky-500/30 p-5 cursor-pointer transition-all duration-300 hover:border-sky-400 hover:shadow-[0_0_30px_rgba(14,165,233,0.25)] hover:-translate-y-1"
            >
              {/* Card top icon + tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <span className="material-symbols-outlined text-[22px]">shield</span>
                </div>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-sky-400/80 uppercase px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40">
                  OPERATIONS HUB
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="font-headline font-bold text-lg text-white group-hover:text-sky-300 transition-colors mb-1 uppercase tracking-wide">
                ORGANIZATION
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-5 group-hover:text-slate-300">
                Manage teams, players, coaches, matches and tournaments.
              </p>

              {/* Button / Action */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs font-bold font-mono tracking-wider text-sky-400 group-hover:text-white uppercase transition-colors">
                  ENTER ORGANIZATION
                </span>
                <div className="w-8 h-8 rounded-full bg-sky-400 text-black flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1 shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER TICKER / SLIDER CONTROLS ── */}
      <footer className="relative z-20 w-full max-w-[1720px] mx-auto px-6 sm:px-12 py-5 border-t border-[#121929] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="w-8 h-[2px] bg-cyan-400" />
          <span className="tracking-[0.25em] text-slate-300 font-bold uppercase text-[11px]">
            MORE THAN A GAME
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            OFFICIAL PITCH COMMAND v2.6
          </span>
        </div>

        {/* Carousel indicator & arrow navigation mimic */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">01</span>
            <span className="w-10 h-[2px] bg-cyan-400 rounded-full" />
            <span className="text-slate-600">02</span>
            <span className="w-4 h-[1px] bg-slate-700" />
            <span className="text-slate-600">03</span>
            <span className="w-4 h-[1px] bg-slate-700" />
            <span className="text-slate-600">04</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous Slide"
              onClick={() => {}}
              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
            <button
              aria-label="Next Slide"
              onClick={() => {}}
              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ── MINIMAL ABOUT / FEATURES MODAL ── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0c1220] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-headline font-black tracking-widest text-cyan-400">FIFA</span>
                <span className="text-slate-500">/</span>
                <span className="font-bold text-white uppercase text-sm">{showInfoModal}</span>
              </div>
              <button
                onClick={() => setShowInfoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-slate-300 leading-relaxed font-body">
              {showInfoModal === "About" ? (
                <>
                  <p>
                    The FIFA Football Management System provides comprehensive governance and operational oversight across 16 continental member associations, national federations, stadiums, and global tournaments.
                  </p>
                  <p className="text-xs text-slate-400">
                    Engineered with real-time match operations, team rosters, disciplinary tracking, match events timeline, commercial sponsor management, and fan discovery portals.
                  </p>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#141b2c] border border-white/5">
                    <span className="font-bold text-cyan-400 block mb-1">Fan Experience</span>
                    <span>Live match schedules, stadium details, and instant digital ticket booking.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2c] border border-white/5">
                    <span className="font-bold text-sky-400 block mb-1">Federation Hub</span>
                    <span>Executive dashboards, roster management, squad readiness, and sponsor contracts.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2c] border border-white/5">
                    <span className="font-bold text-emerald-400 block mb-1">Real-time Fixtures</span>
                    <span>Automated match day rosters, referee assignments, and countdown schedules.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2c] border border-white/5">
                    <span className="font-bold text-amber-400 block mb-1">TMS Integration</span>
                    <span>Transfer matching and contract registry with 99.98% synchronized uptime.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowInfoModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-400 text-black font-semibold text-xs hover:bg-cyan-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
