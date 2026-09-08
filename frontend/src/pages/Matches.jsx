import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { useBulkSelection } from "../hooks/useBulkSelection";
import BulkActionBar from "../components/BulkActionBar";
import BulkDeleteConfirmModal from "../components/BulkDeleteConfirmModal";

const emptyForm = {
  tournament_id: "",
  stadium_id: "",
  home_team_id: "",
  away_team_id: "",
  match_date: "",
  match_time: "",
  stage: "Group Stage",
  result: "",
};

const TEAM_META = {
  Brazil: { code: "BRA", rank: "#1", confed: "CONMEBOL", coach: "Dorival Júnior" },
  Argentina: { code: "ARG", rank: "#2", confed: "CONMEBOL", coach: "Lionel Scaloni" },
  France: { code: "FRA", rank: "#3", confed: "UEFA", coach: "Didier Deschamps" },
  England: { code: "ENG", rank: "#4", confed: "UEFA", coach: "Thomas Tuchel" },
  Spain: { code: "ESP", rank: "#5", confed: "UEFA", coach: "Luis de la Fuente" },
  Portugal: { code: "POR", rank: "#6", confed: "UEFA", coach: "Roberto Martínez" },
  Netherlands: { code: "NED", rank: "#7", confed: "UEFA", coach: "Ronald Koeman" },
  Germany: { code: "GER", rank: "#9", confed: "UEFA", coach: "Julian Nagelsmann" },
  Italy: { code: "ITA", rank: "#10", confed: "UEFA", coach: "Luciano Spalletti" },
  Uruguay: { code: "URU", rank: "#11", confed: "CONMEBOL", coach: "Marcelo Bielsa" },
  Japan: { code: "JPN", rank: "#15", confed: "AFC", coach: "Hajime Moriyasu" },
  Senegal: { code: "SEN", rank: "#17", confed: "CAF", coach: "Aliou Cissé" },
};

function getTeamCode(name) {
  if (!name) return "---";
  if (TEAM_META[name]?.code) return TEAM_META[name].code;
  return name.slice(0, 3).toUpperCase();
}

function parseScore(result) {
  if (!result) return null;
  const m = result.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const isPens = result.toLowerCase().includes("pen");
  const isAet = result.toLowerCase().includes("aet");
  return { home: m[1], away: m[2], raw: result, isPens, isAet };
}

function getStatus(dateStr, result) {
  if (result)
    return {
      label: "Final",
      badgeColor: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  const now = new Date();
  const d = new Date(dateStr);
  if (d < now)
    return {
      label: "Awaiting Result",
      badgeColor: "bg-amber-950/60 text-amber-400 border border-amber-500/30",
      dotColor: "bg-amber-400",
    };
  return {
    label: "Scheduled",
    badgeColor: "bg-sky-950/60 text-sky-400 border border-sky-500/30",
    dotColor: "bg-sky-400",
  };
}

function formatMatchDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  } catch {
    return dateStr;
  }
}

export default function Matches() {
  const toast = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tournamentFilter, setTournamentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  const {
    isSelectionMode,
    toggleSelectionMode,
    exitSelectionMode,
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelect,
    clearSelection,
    toggleSelectAll,
    getSelectAllState,
  } = useBulkSelection("match_id");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .get("/matches")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load matches", "error")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/tournaments").then((res) => setTournaments(res.data.data || [])).catch(() => {});
    api.get("/stadiums").then((res) => setStadiums(res.data.data || [])).catch(() => {});
    api.get("/teams").then((res) => setTeams(res.data.data || [])).catch(() => {});
    api.get("/events").then((res) => setEvents(res.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      tournament_id: item.tournament_id || "",
      stadium_id: item.stadium_id || "",
      home_team_id: item.home_team_id || "",
      away_team_id: item.away_team_id || "",
      match_date: item.match_date?.split("T")[0] || "",
      match_time: item.match_time || "",
      stage: item.stage || "Group Stage",
      result: item.result || "",
    });
    setEditingId(item.match_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.home_team_id) === Number(form.away_team_id)) {
      setError("Home and away teams cannot be the same.");
      return;
    }
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/matches/${editingId}`, form);
        toast?.showToast("Match updated successfully");
      } else {
        await api.post("/matches", form);
        toast?.showToast("Match scheduled successfully");
      }
      setShowForm(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
      toast?.showToast(msg, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    try {
      await api.delete(`/matches/${id}`);
      toast?.showToast("Match deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete match", "error");
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/matches/bulk-delete", { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} matches`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete selected matches", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Real Calculated Metrics
  const totalMatches = items.length;
  const completedCount = items.filter((i) => i.result).length;
  const upcomingCount = items.filter((i) => !i.result).length;

  let totalGoals = 0;
  items.forEach((i) => {
    const sc = parseScore(i.result);
    if (sc) totalGoals += Number(sc.home) + Number(sc.away);
  });
  const avgGoalsPerMatch = completedCount > 0 ? (totalGoals / completedCount).toFixed(2) : "0.00";
  const uniqueStadiumsCount = new Set(items.map((i) => i.stadium_name).filter(Boolean)).size;

  const tournamentOptions = useMemo(
    () => ["ALL", ...Array.from(new Set(items.map((i) => i.tournament_name).filter(Boolean)))],
    [items]
  );

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      const isCompleted = !!item.result;
      let matchesStatus = true;
      if (statusFilter === "UPCOMING") matchesStatus = !isCompleted;
      else if (statusFilter === "COMPLETED") matchesStatus = isCompleted;
      else if (statusFilter === "FINALS") matchesStatus = (item.stage || "").toLowerCase().includes("final");

      const matchesTournament =
        tournamentFilter === "ALL" || item.tournament_name === tournamentFilter;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.home_team?.toLowerCase().includes(q) ||
        item.away_team?.toLowerCase().includes(q) ||
        item.tournament_name?.toLowerCase().includes(q) ||
        item.stadium_name?.toLowerCase().includes(q) ||
        item.stage?.toLowerCase().includes(q);

      return matchesStatus && matchesTournament && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "date_desc")
        return new Date(b.match_date || 0) - new Date(a.match_date || 0);
      if (sortBy === "date_asc")
        return new Date(a.match_date || 0) - new Date(b.match_date || 0);
      if (sortBy === "tournament")
        return (a.tournament_name || "").localeCompare(b.tournament_name || "");
      if (sortBy === "stage")
        return (a.stage || "").localeCompare(b.stage || "");
      return 0;
    });

    return list;
  }, [items, search, statusFilter, tournamentFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Next Upcoming Marquee Match
  const upcomingList = useMemo(() => {
    return items
      .filter((i) => !i.result)
      .sort((a, b) => new Date(a.match_date || 0) - new Date(b.match_date || 0));
  }, [items]);

  const marqueeMatch = upcomingList[0] || null;
  const secondaryUpcoming = upcomingList.slice(1);
  const completedList = useMemo(() => {
    return filtered.filter((i) => !!i.result);
  }, [filtered]);

  const handleExport = () => {
    const exportData = filtered.map((m) => ({
      match_id: m.match_id,
      tournament: m.tournament_name,
      stage: m.stage,
      home_team: m.home_team,
      away_team: m.away_team,
      date: m.match_date,
      time: m.match_time,
      stadium: m.stadium_name,
      city: m.stadium_city,
      result: m.result || "PENDING",
      status: m.result ? "FINAL" : "SCHEDULED",
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-matches-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Matches registry exported successfully");
  };

  return (
    <div className="flex flex-col w-full pb-14 gap-6 text-on-surface bg-[#0a0d14] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col gap-2.5 pt-1">
        {/* Eyebrow / Match Engine Registry */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-[15px] text-emerald-400">
            sports_soccer
          </span>
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            REGISTRY // INTERNATIONAL MATCH ENGINE
          </span>
        </div>

        {/* Main Heading & Actions Row (Dead-center aligned on heading axis) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight font-display">
              MATCHES & SCOREBOARDS
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              {totalMatches} FIXTURES LOGGED
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">download</span>
              <span>Export (JSON)</span>
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors shadow-sm tracking-wide cursor-pointer whitespace-nowrap ${
                isSelectionMode
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-[#121722] hover:bg-[#1b2333] text-slate-200 border-white/10"
              }`}
              title="Select multiple matches for deletion"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSelectionMode ? "close" : "checklist"}
              </span>
              <span>{isSelectionMode ? "Cancel" : "Multiple Deletion"}</span>
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black font-bold text-xs rounded transition-colors shadow-sm tracking-wide whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[17px] font-bold">add</span>
              <span>SCHEDULE FIXTURE</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          {totalMatches} competitive international fixtures across FIFA World Cup, UEFA Euro, and Copa América cycles. Real-time scoreboard telemetry, official assignments, and stadium ingress.
        </p>
      </div>

      {/* KPI Stats Row (100% Real Calculated Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL MATCH REGISTRY
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">
              sports
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalMatches}</span>
              <span className="text-xs font-mono font-normal text-slate-400">FIXTURES</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1.5 font-semibold truncate">
              {completedCount} FINALIZED · {upcomingCount} PENDING
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-emerald-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL GOALS RECORDED
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">
              sports_soccer
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalGoals}</span>
              <span className="text-xs font-mono font-normal text-sky-400">GOALS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              {avgGoalsPerMatch} Goals / Match Index
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-sky-400 rounded-full w-[85%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              UPCOMING 2026
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              event_upcoming
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{upcomingCount}</span>
              <span className="text-xs font-mono font-normal text-amber-400">SCHEDULED</span>
            </div>
            <div className="text-[10px] font-mono text-amber-400 mt-1.5 font-semibold truncate">
              World Cup Group Stages
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-amber-400 rounded-full w-[65%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              COMPLETED MATCHES
            </span>
            <span className="material-symbols-outlined text-[18px] text-teal-400">
              scoreboard
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{completedCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">PLAYED</span>
            </div>
            <div className="text-[10px] font-mono text-teal-400 mt-1.5 font-semibold truncate">
              Euro, Copa & WC 2022
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-teal-400 rounded-full w-[80%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              HOST VENUES
            </span>
            <span className="material-symbols-outlined text-[18px] text-purple-400">
              stadium
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{uniqueStadiumsCount}</span>
              <span className="text-xs font-mono font-normal text-purple-400">STADIA</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Certified Tournament Grounds
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-purple-400 rounded-full w-[75%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#10141e] p-2.5 rounded-lg border border-white/10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider mr-1">
            IN <span className="text-white">{filtered.length}</span> MATCHES
          </span>

          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono overflow-x-auto">
            {[
              { id: "ALL", label: `ALL (${totalMatches})` },
              { id: "UPCOMING", label: `UPCOMING (${upcomingCount})` },
              { id: "COMPLETED", label: `COMPLETED (${completedCount})` },
              { id: "FINALS", label: "FINALS" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                  statusFilter === st.id
                    ? "bg-[#00f59b] text-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#0a0d14] px-2.5 py-1 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">emoji_events</span>
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1"
            >
              {tournamentOptions.map((t) => (
                <option key={t} value={t} className="bg-[#10141e] text-white">
                  {t === "ALL" ? "All Tournaments" : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between xl:justify-end">
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded border border-white/10 flex-1 sm:w-64 max-w-full">
            <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, tournament, stadium..."
              className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full font-medium"
              type="text"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[10px] font-mono bg-[#161c28] hover:bg-[#222b3c] text-slate-300 px-1.5 py-0.5 rounded border border-white/10 transition-colors"
              >
                clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#0a0d14] px-2.5 py-1.5 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1 uppercase"
            >
              <option value="date_desc" className="bg-[#10141e] text-white">Date: Newest First</option>
              <option value="date_asc" className="bg-[#10141e] text-white">Date: Oldest First</option>
              <option value="tournament" className="bg-[#10141e] text-white">Tournament</option>
              <option value="stage" className="bg-[#10141e] text-white">Stage</option>
            </select>
          </div>

          <div className="flex items-center bg-[#0a0d14] rounded border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "cards"
                  ? "bg-[#182030] text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Cards / Fixtures View"
            >
              <span className="material-symbols-outlined text-[17px] block">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-[#182030] text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[17px] block">table_rows</span>
            </button>
          </div>

          {/* Multiple Deletion Mode Button */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors border cursor-pointer ${
              isSelectionMode
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#0a0d14] hover:bg-[#182030] text-slate-300 hover:text-white border-white/10"
            }`}
            title="Toggle Multiple Deletion mode"
          >
            <span className="material-symbols-outlined text-[15px]">
              {isSelectionMode ? "close" : "checklist"}
            </span>
            <span className="text-[11px]">{isSelectionMode ? "Cancel" : "Multiple Deletion"}</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && !loading && filtered.length > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          totalCount={filtered.length}
          onSelectAll={() => toggleSelectAll(filtered)}
          onClear={clearSelection}
          onDeleteClick={() => setShowBulkModal(true)}
          onExit={exitSelectionMode}
          entityName="match"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-[#00f59b] border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING SCOREBOARDS & FIXTURES...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#10141e] border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-[42px] text-slate-600 mb-2">sports_soccer</span>
          <p className="text-sm font-bold text-white uppercase tracking-wider">No Matches Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query, status, or tournament filters.</p>
        </div>
      ) : viewMode === "table" ? (
        /* Dense Table View */
        <div className="bg-[#10141e] rounded-lg border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b0e17] text-[10px] font-mono uppercase text-slate-400 tracking-wider border-b border-white/10">
                  {isSelectionMode && (
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        ref={tableCheckRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => toggleSelectAll(filtered)}
                        className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                        aria-label="Select all matches"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Matchup</th>
                  <th className="py-3 px-4">Score / Status</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((item) => {
                  const status = getStatus(item.match_date, item.result);
                  const score = parseScore(item.result);

                  return (
                    <tr
                      key={item.match_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected(item.match_id) ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected(item.match_id)}
                            onChange={() => toggleSelect(item.match_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            aria-label={`Select match ${item.home_team} vs ${item.away_team}`}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div>{formatMatchDate(item.match_date)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.match_time || "TBD"}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.tournament_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {item.stage || "Group Stage"}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <span className="text-emerald-400 font-mono font-bold mr-1">
                          [{getTeamCode(item.home_team)}]
                        </span>
                        {item.home_team}
                        <span className="text-slate-500 font-normal mx-2">vs</span>
                        {item.away_team}
                        <span className="text-sky-400 font-mono font-bold ml-1">
                          [{getTeamCode(item.away_team)}]
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {score ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-white text-sm bg-[#0a0d14] px-2 py-0.5 rounded border border-white/10">
                              {score.home} - {score.away}
                            </span>
                            <span className="text-[9px] text-emerald-400 uppercase font-bold">
                              {score.isPens ? "PEN" : score.isAet ? "AET" : "FT"}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${status.badgeColor}`}>
                            {status.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="truncate max-w-[180px]">{item.stadium_name || "—"}</div>
                        <div className="text-[10px] text-slate-500">{item.stadium_city || ""}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/events?matchId=${item.match_id}`)}
                            className="px-2 py-1 bg-[#121824] hover:bg-[#1a2335] text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                            title="View Match Events Timeline"
                          >
                            <span className="material-symbols-outlined text-[13px]">timeline</span>
                            <span>EVENTS</span>
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Edit Match"
                          >
                            <span className="material-symbols-outlined text-[16px] block">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.match_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Match"
                          >
                            <span className="material-symbols-outlined text-[16px] block">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Fixture Cards & Scoreboards View (Matching Reference Screenshot) */
        <div className="flex flex-col gap-6">
          {/* Section 1: Impending Marquee Showdown (If Upcoming Match exists and filter includes Upcoming/All) */}
          {marqueeMatch && (statusFilter === "ALL" || statusFilter === "UPCOMING") && !search && (
            <div className="bg-[#10141e] rounded-xl border border-white/10 overflow-hidden shadow-lg relative">
              {/* Impending Showdown Header Strip */}
              <div className="bg-[#0b0e17] px-4 py-2 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected(marqueeMatch.match_id)}
                      onChange={() => toggleSelect(marqueeMatch.match_id)}
                      className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                      aria-label="Select marquee match"
                    />
                  )}
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-amber-400 font-bold uppercase tracking-wider">
                    IMPENDING MARQUEE SHOWDOWN · MATCH NO. {marqueeMatch.match_id}
                  </span>
                </div>
                <div className="text-slate-400 tracking-wider">
                  {marqueeMatch.tournament_name || 'INTERNATIONAL FIXTURE'}
                </div>
              </div>

              {/* Showdown Main Banner */}
              <div className="p-5 sm:p-6 flex flex-col gap-5">
                {/* Meta details bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      {marqueeMatch.tournament_name || "FIFA WORLD CUP 2026"}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#161d2b] text-slate-300 border border-white/10 uppercase tracking-wider">
                      {marqueeMatch.stage || "GROUP STAGE"}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                      AWAITING KICKOFF
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-emerald-400">stadium</span>
                      <span>{marqueeMatch.stadium_name || "Official Venue"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-sky-400">schedule</span>
                      <span>{formatMatchDate(marqueeMatch.match_date)} · {marqueeMatch.match_time || "20:00 UTC"}</span>
                    </span>
                  </div>
                </div>

                {/* Teams VS Grid */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 py-2">
                  {/* Home Team */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4 p-4 rounded-lg bg-[#0a0d14] border border-white/5">
                    <div className="flex flex-col text-left md:text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        FIFA {TEAM_META[marqueeMatch.home_team]?.rank || "#1"} · {TEAM_META[marqueeMatch.home_team]?.confed || "CONMEBOL"}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                        {marqueeMatch.home_team}
                      </h2>
                      <span className="text-xs text-slate-400 mt-1">
                        Coach: {TEAM_META[marqueeMatch.home_team]?.coach || "Official Head Coach"}
                      </span>

                    </div>
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-white font-mono font-black text-xl shrink-0">
                      {getTeamCode(marqueeMatch.home_team)}
                    </div>
                  </div>

                  {/* VS Indicator */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center text-center p-2">
                    <div className="px-3 py-1 rounded bg-[#161d2b] border border-white/10 text-xs font-mono text-amber-400 font-bold tracking-wider uppercase mb-1">
                      MATCH FIXTURE
                    </div>
                    <span className="text-2xl font-black font-mono text-slate-300 my-1">
                      VS
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {marqueeMatch.stage} · {marqueeMatch.stadium_city || "Host City"}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-4 p-4 rounded-lg bg-[#0a0d14] border border-white/5">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-900/40 border border-sky-500/30 flex items-center justify-center text-white font-mono font-black text-xl shrink-0">
                      {getTeamCode(marqueeMatch.away_team)}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                        FIFA {TEAM_META[marqueeMatch.away_team]?.rank || "#2"} · {TEAM_META[marqueeMatch.away_team]?.confed || "UEFA"}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                        {marqueeMatch.away_team}
                      </h2>
                      <span className="text-xs text-slate-400 mt-1">
                        Coach: {TEAM_META[marqueeMatch.away_team]?.coach || "Official Head Coach"}
                      </span>

                    </div>
                  </div>
                </div>

                {/* Marquee Command Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/events?matchId=${marqueeMatch.match_id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00f59b] hover:bg-[#00d685] text-black font-bold text-xs rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">timeline</span>
                      <span>MATCH TIMELINE & EVENTS</span>
                    </button>
                    <button
                      onClick={() => openEdit(marqueeMatch)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b28] hover:bg-[#1f2a3e] text-slate-200 border border-white/10 text-xs font-semibold rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>EDIT FIXTURE</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span>VENUE: {marqueeMatch.stadium_name}</span>
                    <button
                      onClick={() => handleDelete(marqueeMatch.match_id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete Match"
                    >
                      <span className="material-symbols-outlined text-[16px] block">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Upcoming World Cup Fixtures Grid */}
          {(statusFilter === "ALL" || statusFilter === "UPCOMING") && secondaryUpcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">
                    event_upcoming
                  </span>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    UPCOMING FIXTURES ({secondaryUpcoming.length} SCHEDULED)
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  CONSECUTIVE MATCHDAY OPERATIONS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {secondaryUpcoming.map((item) => (
                  <div
                    key={item.match_id}
                    className={`bg-[#10141e] rounded-lg p-4 border transition-all flex flex-col justify-between shadow-sm group ${
                      isSelected(item.match_id)
                        ? "border-emerald-500/80 bg-emerald-950/10"
                        : "border-white/10 hover:border-emerald-500/30"
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 truncate">
                          {isSelectionMode && (
                            <input
                              type="checkbox"
                              checked={isSelected(item.match_id)}
                              onChange={() => toggleSelect(item.match_id)}
                              className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer shrink-0"
                              aria-label={`Select ${item.home_team} vs ${item.away_team}`}
                            />
                          )}
                          <span className="font-bold text-slate-300 uppercase truncate">
                            {item.tournament_name}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#161e2c] text-amber-400 border border-amber-500/20 font-bold uppercase shrink-0">
                          {item.stage || "GROUP STAGE"}
                        </span>
                      </div>

                      {/* Matchup Banner */}
                      <div className="my-3.5 flex items-center justify-between gap-2 p-3 bg-[#0a0d14] rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-[#161d2b] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                            {getTeamCode(item.home_team)}
                          </div>
                          <span className="text-xs font-black text-white truncate">
                            {item.home_team}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-bold text-slate-500 px-2 shrink-0">
                          VS
                        </span>

                        <div className="flex items-center justify-end gap-2 min-w-0">
                          <span className="text-xs font-black text-white truncate text-right">
                            {item.away_team}
                          </span>
                          <div className="w-8 h-8 rounded bg-[#161d2b] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                            {getTeamCode(item.away_team)}
                          </div>
                        </div>
                      </div>

                      {/* Venue & Date Details */}
                      <div className="space-y-1 text-xs font-mono text-slate-400">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[14px] text-slate-500">calendar_month</span>
                            <span>{formatMatchDate(item.match_date)}</span>
                          </span>
                          <span className="text-emerald-400 font-bold">{item.match_time || "20:00 UTC"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <span className="material-symbols-outlined text-[14px] text-slate-500">location_on</span>
                          <span className="truncate">{item.stadium_name}, {item.stadium_city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        AWAITING RESULT
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="px-2.5 py-1 bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/10 rounded text-[10px] font-mono font-bold uppercase transition-colors"
                        >
                          MANAGE FIXTURE
                        </button>
                        <button
                          onClick={() => handleDelete(item.match_id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[15px] block">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Official Completed Match Results & Scoreboard Telemetry */}
          {(statusFilter === "ALL" || statusFilter === "COMPLETED" || statusFilter === "FINALS") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-sky-400">
                    verified
                  </span>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    OFFICIAL MATCH RESULTS & SCOREBOARDS
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-[#10141e] border border-white/10 font-bold text-white">
                    {completedList.length} RATIFIED
                  </span>
                  <span className="hidden sm:inline">STATUS: POST-MATCH TMS AUDIT SIGNED OFF</span>
                </div>
              </div>

              {/* Scoreboard Rows Stack */}
              <div className="flex flex-col gap-2.5">
                {completedList.map((item) => {
                  const score = parseScore(item.result);
                  const matchEvents = events.filter((e) => e.match_id === item.match_id);
                  const goalEvents = matchEvents.filter((e) => e.event_type === "Goal");

                  return (
                    <div
                      key={item.match_id}
                      className={`bg-[#10141e] rounded-lg p-3.5 sm:p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm group ${
                        isSelected(item.match_id)
                          ? "border-emerald-500/80 bg-emerald-950/10"
                          : "border-white/10 hover:border-emerald-500/30"
                      }`}
                    >
                      {/* Left: Tournament & Venue Info */}
                      <div className="md:w-64 shrink-0 flex items-start gap-2.5">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={isSelected(item.match_id)}
                            onChange={() => toggleSelect(item.match_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer shrink-0 mt-0.5"
                            aria-label={`Select ${item.home_team} vs ${item.away_team}`}
                          />
                        )}
                        <div className="flex flex-col justify-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                              {item.tournament_name}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#161e2c] text-slate-300 border border-white/10 uppercase">
                              {item.stage || "STAGE"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                            {item.stadium_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {formatMatchDate(item.match_date)} · {item.stadium_city || ""}
                          </div>
                        </div>
                      </div>

                      {/* Center: The Official Scoreboard */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-md">
                          {/* Home Team */}
                          <div className="flex-1 text-right flex items-center justify-end gap-2">
                            <span className="font-bold text-white text-sm sm:text-base group-hover:text-emerald-400 transition-colors truncate">
                              {item.home_team}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0a0d14] text-slate-400 border border-white/10 shrink-0">
                              {getTeamCode(item.home_team)}
                            </span>
                          </div>

                          {/* Score Box */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-[#0a0d14] px-3.5 py-1.5 rounded-lg border border-white/10">
                            <span className="font-mono text-lg sm:text-xl font-black text-white">
                              {score ? `${score.home} - ${score.away}` : item.result || "0 - 0"}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold ml-1">
                              {score?.isPens ? "PEN" : score?.isAet ? "AET" : "FT"}
                            </span>
                          </div>

                          {/* Away Team */}
                          <div className="flex-1 text-left flex items-center justify-start gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0a0d14] text-slate-400 border border-white/10 shrink-0">
                              {getTeamCode(item.away_team)}
                            </span>
                            <span className="font-bold text-white text-sm sm:text-base group-hover:text-emerald-400 transition-colors truncate">
                              {item.away_team}
                            </span>
                          </div>
                        </div>

                        {/* Goalscorers / Events line if available */}
                        {goalEvents.length > 0 && (
                          <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center gap-1.5 flex-wrap justify-center text-center">
                            <span className="material-symbols-outlined text-[13px] text-emerald-400">sports_soccer</span>
                            <span>
                              {goalEvents.map((g) => `${g.player_name || "Goal"} ${g.minute}'`).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="md:w-56 shrink-0 flex items-center justify-end gap-2 border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0">
                        <button
                          onClick={() => navigate(`/events?matchId=${item.match_id}`)}
                          className="px-2.5 py-1.5 bg-[#121824] hover:bg-[#1a2335] text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                          title="View Events Timeline"
                        >
                          <span className="material-symbols-outlined text-[14px]">timeline</span>
                          <span>TIMELINE</span>
                        </button>

                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                          title="Edit Match"
                        >
                          <span className="material-symbols-outlined text-[16px] block">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.match_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Match"
                        >
                          <span className="material-symbols-outlined text-[16px] block">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Add / Edit Match Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Match Fixture" : "Schedule New Match"}
        subtitle="Manage match calendar, tournament allocation, venue, and score result"
        icon="sports_soccer"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Section 1: Competition & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tournament <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.tournament_id}
                onChange={(e) => setForm({ ...form, tournament_id: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Select Tournament</option>
                {tournaments.map((t) => (
                  <option key={t.tournament_id} value={t.tournament_id} className="bg-[#10141e] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Stadium / Host Venue <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.stadium_id}
                onChange={(e) => setForm({ ...form, stadium_id: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Select Stadium</option>
                {stadiums.map((s) => (
                  <option key={s.stadium_id} value={s.stadium_id} className="bg-[#10141e] text-white">
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Teams Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Home Team <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.home_team_id}
                onChange={(e) => setForm({ ...form, home_team_id: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Select Home Team</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id} className="bg-[#10141e] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Away Team <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.away_team_id}
                onChange={(e) => setForm({ ...form, away_team_id: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Select Away Team</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id} className="bg-[#10141e] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Schedule & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Match Date <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={form.match_date}
                onChange={(e) => setForm({ ...form, match_date: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Match Time <span className="text-emerald-400">*</span>
              </label>
              <input
                type="time"
                required
                value={form.match_time}
                onChange={(e) => setForm({ ...form, match_time: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Stage <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                placeholder="e.g. Group A, Semi-Final"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Section 4: Result (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Result / Score (leave empty if pending kickoff)
            </label>
            <input
              type="text"
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
              placeholder="e.g. 2 - 1 or 3 - 3 (4-2 pens)"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-[#1b2234]">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-2 bg-[#162030] hover:bg-[#1e2c42] text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingAction}
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingAction ? "Saving..." : editingId ? "Update Fixture" : "Schedule Match"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkDelete}
        count={selectedCount}
        entityName="match"
        loading={bulkLoading}
      />
    </div>
  );
}