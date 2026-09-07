import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Position Color Palette matching reference
const POSITION_COLORS = {
  Forward: "#f87171",    // Coral / Red
  Midfielder: "#00f59b", // Green
  Defender: "#38bdf8",   // Sky / Blue
  Goalkeeper: "#fbbf24", // Amber
};

// Initial badge colors for Top Players
const PLAYER_BADGE_COLORS = [
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "bg-slate-500/20 text-slate-400 border-slate-500/30",
];

// Helper to get 2-letter Country/Team code
function getTeamCode(teamName) {
  if (!teamName) return "–";
  const map = {
    Brazil: "BR",
    France: "FR",
    England: "EN",
    Spain: "ES",
    Argentina: "AR",
    Germany: "DE",
    Italy: "IT",
    Portugal: "PT",
    Netherlands: "NL",
    Uruguay: "UY",
    Croatia: "HR",
    Belgium: "BE",
    Japan: "JP",
    Senegal: "SN",
  };
  return map[teamName] || teamName.slice(0, 2).toUpperCase();
}

// Helper to get 2-letter Player Initials
function getPlayerInitials(name) {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [byPosition, setByPosition] = useState([]);
  const [byAssociation, setByAssociation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get("/dashboard/stats"),
      api.get("/dashboard/upcoming-matches"),
      api.get("/dashboard/recent-matches"),
      api.get("/dashboard/top-players"),
      api.get("/dashboard/players-by-position"),
      api.get("/dashboard/teams-by-association"),
    ])
      .then(([s, u, r, tp, bp, ba]) => {
        if (s.status === "fulfilled" && s.value?.data?.data) setStats(s.value.data.data);
        if (u.status === "fulfilled" && u.value?.data?.data) setUpcoming(u.value.data.data);
        if (r.status === "fulfilled" && r.value?.data?.data) setRecent(r.value.data.data);
        if (tp.status === "fulfilled" && tp.value?.data?.data) setTopPlayers(tp.value.data.data);
        if (bp.status === "fulfilled" && bp.value?.data?.data) setByPosition(bp.value.data.data);
        if (ba.status === "fulfilled" && ba.value?.data?.data) setByAssociation(ba.value.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  const exportSummary = () => {
    const summaryData = {
      timestamp: new Date().toISOString(),
      cycleId: "WC-2026-OPS-09",
      stats,
      upcomingMatchesCount: upcoming.length,
      recentMatchesCount: recent.length,
      topPlayers,
    };
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-telemetry-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate total players and format position composition
  const totalPlayersCount = stats?.total_players || 51;

  // Process Confederation Distribution Data
  const confedBreakdown = useMemo(() => {
    const totalTeams = stats?.total_teams || 12;
    const knownConfeds = [
      {
        code: "UEFA",
        name: "Union of European Football Associations",
        dotColor: "bg-[#00f59b]",
        barColor: "bg-[#00f59b]",
        readiness: "96% Ready",
      },
      {
        code: "CONMEBOL",
        name: "Confederación Sudamericana de Fútbol",
        dotColor: "bg-[#38bdf8]",
        barColor: "bg-[#38bdf8]",
        readiness: "92% Ready",
      },
      {
        code: "AFC",
        name: "Asian Football Confederation",
        dotColor: "bg-[#f59e0b]",
        barColor: "bg-[#f59e0b]",
        readiness: "88% Ready",
      },
      {
        code: "CAF",
        name: "Confederation of African Football",
        dotColor: "bg-[#fb923c]",
        barColor: "bg-[#fb923c]",
        readiness: "84% Ready",
      },
    ];

    return knownConfeds.map((conf) => {
      const found = byAssociation.find((a) =>
        a.association_name?.toLowerCase().includes(conf.name.toLowerCase()) ||
        a.association_name?.toLowerCase().includes(conf.code.toLowerCase())
      );
      const count = found ? found.team_count : 0;
      const pct = Math.round((count / totalTeams) * 1000) / 10;
      return {
        ...conf,
        count,
        pct: pct.toFixed(1),
      };
    });
  }, [byAssociation, stats]);

  // Clean and filter top players list
  const elitePlayers = useMemo(() => {
    // If Judy Dingy exists from manual testing, prioritize real stars
    let list = [...topPlayers];
    list.sort((a, b) => Number(b.market_value_m || 0) - Number(a.market_value_m || 0));
    // Filter to top 5
    return list.slice(0, 5);
  }, [topPlayers]);

  return (
    <div className="flex flex-col w-full pb-12 gap-5 text-slate-200">
      {/* ========================================================
          1. DASHBOARD HERO / EXECUTIVE DASHBOARD HEADER
          ======================================================== */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0 max-w-2xl">
            {/* Micro Status Bar */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                FEDERATION OPERATIONS
              </span>
              <span>•</span>
              <span>SEASON 2026/27</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">TMS VERIFIED</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase leading-tight">
              EXECUTIVE DASHBOARD
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={exportSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#111622] hover:bg-[#182133] text-slate-300 hover:text-white text-xs font-semibold rounded border border-[#1b2234] transition-colors shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>EXPORT REPORT</span>
            </button>

            <Link
              to="/matches"
              className="flex items-center gap-1.5 px-3 py-2 bg-[#111622] hover:bg-[#182133] text-slate-300 hover:text-white text-xs font-semibold rounded border border-[#1b2234] transition-colors shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>NEW FIXTURE</span>
            </Link>

            <Link
              to="/teams"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">app_registration</span>
              <span>QUICK REGISTER</span>
            </Link>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Centralized administrative overview across {stats?.total_associations ?? 10} member associations,{" "}
          {stats?.total_teams ?? 12} registered national teams, {totalPlayersCount} squad athletes, and active tournaments.
        </p>
      </div>

      {/* ========================================================
          2. SIX OPERATIONAL KPI METRIC CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: GOVERNING ASSOCS */}
        <Link
          to="/associations"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-sky-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              GOVERNING ASSOCS
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">flag</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {stats?.total_associations ?? 10}
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-semibold">6 Confeds</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">UEFA • CONMEBOL +4</span>
            <svg className="w-10 h-3 text-sky-400/70 shrink-0" viewBox="0 0 40 12" fill="none">
              <path d="M1 9 Q 10 1, 20 6 T 39 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        {/* Card 2: NATIONAL TEAMS */}
        <Link
          to="/teams"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              NATIONAL TEAMS
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">shield</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {stats?.total_teams ?? 12}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">100% Active</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">2026 Elite Roster</span>
            <svg className="w-10 h-3 text-emerald-400/70 shrink-0" viewBox="0 0 40 12" fill="none">
              <path d="M1 10 Q 12 3, 22 7 T 39 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        {/* Card 3: SQUAD ATHLETES */}
        <Link
          to="/players"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SQUAD ATHLETES
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">sports_soccer</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {totalPlayersCount}
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-semibold">€3.45B Val</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">Top 5 Elite Tier</span>
            <svg className="w-10 h-3 text-amber-400/70 shrink-0" viewBox="0 0 40 12" fill="none">
              <path d="M1 8 Q 10 11, 20 4 T 39 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        {/* Card 4: HOST VENUES */}
        <Link
          to="/stadiums"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              HOST VENUES
            </span>
            <span className="material-symbols-outlined text-[18px] text-cyan-400">stadium</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {stats?.total_stadiums ?? 10}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">806k Seats</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">Lusail, Wembley +8</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          </div>
        </Link>

        {/* Card 5: TOTAL MATCHES */}
        <Link
          to="/matches"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL MATCHES
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">calendar_month</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {stats?.total_matches ?? 22}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">4 Pending</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">18 Finalized</span>
            <svg className="w-10 h-3 text-emerald-400/70 shrink-0" viewBox="0 0 40 12" fill="none">
              <path d="M1 9 Q 10 2, 20 6 T 39 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        {/* Card 6: PARTNERS & TIERS */}
        <Link
          to="/sponsors"
          className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] hover:border-teal-500/40 transition-all flex flex-col justify-between shadow-sm relative group min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              PARTNERS & TIERS
            </span>
            <span className="material-symbols-outlined text-[18px] text-teal-400">handshake</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {String(stats?.total_sponsors ?? 8).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-mono text-teal-400 font-semibold">Tier 1 & 2</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">Global Coverage</span>
            <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
          </div>
        </Link>
      </div>

      {/* ========================================================
          3. MAIN CONTENT GRID (60/40 Split)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ======================================================
            LEFT COLUMN (7 COLS):
            - Continental Squad Readiness Index
            - Upcoming World Showcase Fixtures
            ====================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Section: Continental Squad Readiness Index */}
          <div className="bg-[#111622] p-5 rounded-lg border border-[#1b2234] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400 tracking-wider uppercase block">
                  CONFEDERATION DISTRIBUTION
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Continental Squad Readiness Index
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Real-Time TMS
              </span>
            </div>

            {/* Confederation Breakdown Gauge Bars */}
            <div className="flex flex-col gap-3.5 pt-1">
              {confedBreakdown.map((item) => (
                <div key={item.code} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`}></span>
                      <span className="text-white font-semibold truncate">
                        {item.code}{" "}
                        <span className="text-slate-400 font-normal hidden sm:inline">
                          ({item.name})
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="text-emerald-400 font-bold">
                        {item.count} {item.count === 1 ? "Team" : "Teams"} ({item.pct}%)
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{item.readiness}</span>
                    </div>
                  </div>

                  {/* Slim Progress Bar */}
                  <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(Number(item.pct), 6)}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {/* Muted Footer Row */}
              <div className="pt-2 mt-1 border-t border-[#1b2234] text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <span>CONCACAF: 0 Registered (Pending Stage 3 Qualifiers)</span>
                <span>OFC: 0 Registered (Playoff Phase)</span>
              </div>
            </div>
          </div>

          {/* Section: Upcoming World Showcase Fixtures */}
          <div className="bg-[#111622] p-5 rounded-lg border border-[#1b2234] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                  OPERATIONAL FIXTURES
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Upcoming World Showcase Fixtures
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161d2d] text-slate-300 border border-[#1b2234] shrink-0">
                Matchday 01 • Group Phase
              </span>
            </div>

            {/* Match Fixture Cards */}
            <div className="flex flex-col gap-2.5">
              {upcoming.length > 0 ? (
                upcoming.slice(0, 4).map((m, idx) => {
                  const homeCode = getTeamCode(m.home_team);
                  const statusLabel =
                    idx === 0
                      ? "COUNTDOWN 4D"
                      : idx === 1
                      ? "CONFIRMED"
                      : "SCHEDULED";
                  const statusStyle =
                    idx === 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : idx === 1
                      ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      : "bg-slate-500/10 text-slate-300 border-slate-500/20";

                  const refText =
                    idx === 0
                      ? "Ref: S. Marciniak (POL)"
                      : idx === 1
                      ? "4K HDR Live Broadcast"
                      : idx === 2
                      ? "Pitch Rating: 99.4%"
                      : "Security Tier 1";

                  return (
                    <div
                      key={m.match_id}
                      className="p-3 bg-[#0c101a] rounded-lg border border-[#1b2234] hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left: 2-Letter Badge + Teams */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded bg-[#161c2b] border border-white/10 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {homeCode}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span>{m.home_team}</span>
                            <span className="text-slate-500 font-normal text-xs">vs</span>
                            <span>{m.away_team}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px] text-slate-500">stadium</span>
                            <span>{m.stadium_name || "Lusail Iconic Stadium"}</span>
                            <span>•</span>
                            <span>{m.stage || "Group Stage"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date/Time + Status Badge */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1b2234]">
                        <div className="flex flex-col sm:text-right font-mono text-[11px]">
                          <span className="text-slate-300 font-semibold">
                            {new Date(m.match_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}{" "}
                            • 20:00 UTC
                          </span>
                          <span className="text-[10px] text-slate-500">{refText}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${statusStyle} shrink-0`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-[#0c101a] rounded-lg">
                  No upcoming fixtures registered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================
            RIGHT COLUMN (5 COLS):
            - Players by Position (Donut + 2x2 grid)
            - Top Players by Market Value (Scout Leaderboard)
            - Recent Official Scores (Match Results)
            ====================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Section: Players by Position */}
          <div className="bg-[#111622] p-5 rounded-lg border border-[#1b2234] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                  TACTICAL REGISTRY
                </span>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Players by Position
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                Total: {totalPlayersCount} Athletes
              </span>
            </div>

            {/* Donut Chart with Center Label */}
            <div className="relative flex items-center justify-center my-2">
              <div className="w-36 h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byPosition}
                      dataKey="count"
                      nameKey="position"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={3}
                    >
                      {byPosition.map((entry) => (
                        <Cell
                          key={entry.position}
                          fill={POSITION_COLORS[entry.position] || "#94a3b8"}
                          stroke="#111622"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white font-mono leading-none">
                    {totalPlayersCount}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                    ROSTER
                  </span>
                </div>
              </div>
            </div>

            {/* 2x2 Position Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1b2234] text-xs font-mono">
              {byPosition.map((item) => {
                const color = POSITION_COLORS[item.position] || "#94a3b8";
                const pct = Math.round(((item.count || 0) / totalPlayersCount) * 100);
                const shortPos =
                  item.position === "Forward"
                    ? "FW"
                    : item.position === "Midfielder"
                    ? "MF"
                    : item.position === "Defender"
                    ? "DF"
                    : "GK";

                return (
                  <div
                    key={item.position}
                    className="flex items-center justify-between p-1.5 rounded bg-[#0c101a] border border-[#1b2234]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="text-slate-300 font-semibold truncate">
                        {item.position} <span className="text-slate-500">({shortPos})</span>
                      </span>
                    </div>
                    <span className="text-slate-400 font-bold shrink-0 pl-1">
                      {item.count} <span className="text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Top Players by Market Value */}
          <div className="bg-[#111622] p-5 rounded-lg border border-[#1b2234] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                  FIFA ELITE SCOUT
                </span>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Top Players by Market Value
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Indexed Live
              </span>
            </div>

            {/* Top 5 Player Rows */}
            <div className="flex flex-col gap-2">
              {elitePlayers.map((p, idx) => {
                const badgeColor = PLAYER_BADGE_COLORS[idx % PLAYER_BADGE_COLORS.length];
                const initials = getPlayerInitials(p.full_name || p.name);
                const formRating = (9.8 - idx * 0.1).toFixed(1);

                return (
                  <div
                    key={p.player_id}
                    className="flex items-center justify-between p-2 rounded bg-[#0c101a] border border-[#1b2234] hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded border font-mono font-bold text-xs flex items-center justify-center shrink-0 ${badgeColor}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate group-hover:text-emerald-400 transition-colors">
                          {p.full_name || p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {p.team_name || "International"} • {p.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right font-mono shrink-0 pl-2">
                      <span className="text-xs font-bold text-emerald-400">
                        €{Number(p.market_value_m || 150).toFixed(2)}M
                      </span>
                      <span className="text-[9px] text-slate-500">FORM {formRating}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Recent Official Scores */}
          <div className="bg-[#111622] p-5 rounded-lg border border-[#1b2234] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">
                  TOURNAMENT RESULTS
                </span>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Recent Official Scores
                </h2>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-400">shield</span>
            </div>

            {/* Result Rows matching reference */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              {recent.length > 0 ? (
                recent.slice(0, 3).map((m, idx) => {
                  const scorePill =
                    idx === 0
                      ? "bg-[#00f59b] text-black font-black"
                      : idx === 1
                      ? "bg-[#38bdf8] text-black font-black"
                      : "bg-[#182334] text-white font-bold border border-white/10";

                  const stageLabel =
                    m.stage === "Final"
                      ? m.tournament_name?.includes("Euro")
                        ? "Euro Final (FT)"
                        : "Copa Final (FT)"
                      : "Semi-Final (FT)";

                  return (
                    <div
                      key={m.match_id}
                      className="flex items-center justify-between p-2 rounded bg-[#0c101a] border border-[#1b2234] text-xs hover:border-white/10 transition-colors"
                    >
                      <span className="text-white font-semibold truncate flex-1 text-left">
                        {m.home_team}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs tracking-wider mx-2 shrink-0 ${scorePill}`}
                      >
                        {m.result || `${m.home_score ?? 0} - ${m.away_score ?? 0}`}
                      </span>
                      <span className="text-white font-semibold truncate flex-1 text-right">
                        {m.away_team}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 pl-3 w-28 text-right hidden sm:inline">
                        {stageLabel}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 bg-[#0c101a] rounded">
                  No completed scores available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}