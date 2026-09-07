import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { useBulkSelection } from "../hooks/useBulkSelection";
import BulkActionBar from "../components/BulkActionBar";
import BulkDeleteConfirmModal from "../components/BulkDeleteConfirmModal";

const emptyForm = { name: "", type: "World Cup", format: "Group + Knockout", start_date: "", end_date: "" };
const types = ["World Cup", "Continental", "Regional", "Friendly"];
const formats = ["Group + Knockout", "League", "Knockout", "Round Robin"];

const TYPE_CONFIG = {
  "World Cup": {
    badgeLabel: "FIFA GLOBAL",
    icon: "emoji_events",
    badge: "bg-amber-950/50 text-amber-400 border border-amber-500/30",
    accentGlow: "group-hover:border-amber-500/40",
    iconBg: "bg-amber-950/30 text-amber-400 border-amber-500/20",
  },
  Continental: {
    badgeLabel: "CONTINENTAL",
    icon: "public",
    badge: "bg-sky-950/50 text-sky-400 border border-sky-500/30",
    accentGlow: "group-hover:border-sky-500/40",
    iconBg: "bg-sky-950/30 text-sky-400 border-sky-500/20",
  },
  Regional: {
    badgeLabel: "REGIONAL",
    icon: "flag",
    badge: "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30",
    accentGlow: "group-hover:border-emerald-500/40",
    iconBg: "bg-emerald-950/30 text-emerald-400 border-emerald-500/20",
  },
  Friendly: {
    badgeLabel: "INVITATIONAL",
    icon: "celebration",
    badge: "bg-purple-950/50 text-purple-400 border border-purple-500/30",
    accentGlow: "group-hover:border-purple-500/40",
    iconBg: "bg-purple-950/30 text-purple-400 border-purple-500/20",
  },
};

function getStatus(start, end) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s)
    return {
      label: "Upcoming",
      badgeColor: "bg-sky-950/60 text-sky-400 border border-sky-500/30",
      dotColor: "bg-sky-400",
      barColor: "bg-sky-400",
    };
  if (now > e)
    return {
      label: "Completed",
      badgeColor: "bg-slate-800/80 text-slate-300 border border-white/10",
      dotColor: "bg-slate-400",
      barColor: "bg-slate-600",
    };
  return {
    label: "Active",
    badgeColor: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
    dotColor: "bg-emerald-400",
    barColor: "bg-[#00f59b]",
  };
}

function progressPct(start, end) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export default function Tournaments() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("start");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

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
  } = useBulkSelection("tournament_id");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .get("/tournaments")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load tournaments", "error")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      type: item.type || "World Cup",
      format: item.format || "Group + Knockout",
      start_date: item.start_date?.split("T")[0] || "",
      end_date: item.end_date?.split("T")[0] || "",
    });
    setEditingId(item.tournament_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/tournaments/${editingId}`, form);
        toast?.showToast("Tournament updated successfully");
      } else {
        await api.post("/tournaments", form);
        toast?.showToast("Tournament registered successfully");
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

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name || "this tournament"}?`)) return;
    try {
      await api.delete(`/tournaments/${id}`);
      toast?.showToast("Tournament deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete tournament", "error");
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/tournaments/bulk-delete", { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} tournaments`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete selected tournaments", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Real Calculated Metrics
  const totalTournaments = items.length;
  const activeCount = items.filter((i) => getStatus(i.start_date, i.end_date).label === "Active").length;
  const upcomingCount = items.filter((i) => getStatus(i.start_date, i.end_date).label === "Upcoming").length;
  const completedCount = items.filter((i) => getStatus(i.start_date, i.end_date).label === "Completed").length;

  const totalTeams = useMemo(
    () => items.reduce((acc, curr) => acc + (Number(curr.team_count) || 0), 0),
    [items]
  );
  const totalMatches = useMemo(
    () => items.reduce((acc, curr) => acc + (Number(curr.match_count) || 0), 0),
    [items]
  );

  const worldCupCount = items.filter((i) => i.type === "World Cup").length;
  const continentalCount = items.filter((i) => i.type === "Continental").length;

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      const matchesType =
        typeFilter === "ALL" ||
        item.type?.toLowerCase() === typeFilter.toLowerCase();

      const st = getStatus(item.start_date, item.end_date).label.toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        st === statusFilter;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q) ||
        item.format?.toLowerCase().includes(q);

      return matchesType && matchesStatus && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "start") return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      if (sortBy === "start_asc") return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "teams") return (Number(b.team_count) || 0) - (Number(a.team_count) || 0);
      if (sortBy === "matches") return (Number(b.match_count) || 0) - (Number(a.match_count) || 0);
      return 0;
    });

    return list;
  }, [items, search, typeFilter, statusFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleExport = () => {
    const exportData = filtered.map((t) => ({
      id: t.tournament_id,
      name: t.name,
      type: t.type,
      format: t.format,
      start_date: t.start_date,
      end_date: t.end_date,
      status: getStatus(t.start_date, t.end_date).label,
      teams_registered: t.team_count || 0,
      matches_scheduled: t.match_count || 0,
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-tournaments-calendar-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Tournament calendar exported successfully");
  };

  return (
    <div className="flex flex-col w-full pb-14 gap-6 text-on-surface bg-[#0a0d14] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col gap-2.5 pt-1">
        {/* Eyebrow / Competitions Registry */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-[15px] text-emerald-400">
            emoji_events
          </span>
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            TOURNAMENTS & COMPETITIONS REGISTRY // GLOBAL CALENDAR - FIFA STATUTES 2026/27
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold hidden sm:inline">
            ● TMS PROTOCOL v9.8.2 ACTIVE
          </span>
        </div>

        {/* Main Heading & Actions Row (Dead-center aligned on heading axis) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight font-display">
              INTERNATIONAL TOURNAMENTS & CUPS
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              {totalTournaments} REGISTERED EDITIONS
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">download</span>
              <span>Export Calendar</span>
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors shadow-sm tracking-wide cursor-pointer whitespace-nowrap ${
                isSelectionMode
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-[#121722] hover:bg-[#1b2333] text-slate-200 border-white/10"
              }`}
              title="Select multiple tournaments for deletion"
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
              <span>REGISTER TOURNAMENT</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          Governing continental and global football competitions, tournament formats, host nation assignments, and fixture allocations.
        </p>
      </div>

      {/* KPI Stats Row (Strictly Real Computed Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL TOURNAMENTS
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              emoji_events
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalTournaments}</span>
              <span className="text-xs font-mono font-normal text-slate-400">EDITIONS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              {worldCupCount} Global · {continentalCount} Continental
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-amber-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              REGISTERED TEAMS
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">
              shield
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalTeams}</span>
              <span className="text-xs font-mono font-normal text-sky-400">SLOTS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Active tournament allocations
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-sky-400 rounded-full w-[80%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              SCHEDULED MATCHES
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">
              sports_soccer
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalMatches}</span>
              <span className="text-xs font-mono font-normal text-slate-400">FIXTURES</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1.5 font-semibold">
              Tournament Fixture Allocations
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-emerald-400 rounded-full w-[70%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              CALENDAR STATUS
            </span>
            <span className="material-symbols-outlined text-[18px] text-purple-400">
              calendar_month
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{upcomingCount + activeCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">ACTIVE / UPCOMING</span>
            </div>
            <div className="text-[10px] font-mono text-purple-400 mt-1.5 font-semibold">
              {completedCount} Historical Records Logged
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-purple-400 rounded-full w-[65%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#10141e] p-2.5 rounded-lg border border-white/10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider mr-1">
            IN <span className="text-white">{filtered.length}</span> EDITIONS
          </span>

          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                typeFilter === "ALL"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ALL ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter("World Cup")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                typeFilter === "World Cup"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              FIFA GLOBAL ({worldCupCount})
            </button>
            <button
              onClick={() => setTypeFilter("Continental")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                typeFilter === "Continental"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              CONTINENTAL ({continentalCount})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono">
            {["ALL", "ACTIVE", "UPCOMING", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  statusFilter === st
                    ? "bg-[#1f283a] text-[#00f59b] border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between xl:justify-end">
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded border border-white/10 flex-1 sm:w-64 max-w-full">
            <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournament by title, format..."
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
              <option value="start" className="bg-[#10141e] text-white">Date: Newest First</option>
              <option value="start_asc" className="bg-[#10141e] text-white">Date: Oldest First</option>
              <option value="name" className="bg-[#10141e] text-white">Name: A to Z</option>
              <option value="teams" className="bg-[#10141e] text-white">Most Teams</option>
              <option value="matches" className="bg-[#10141e] text-white">Most Matches</option>
            </select>
          </div>

          <div className="flex items-center bg-[#0a0d14] rounded border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-[#182030] text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Grid View"
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
          entityName="tournament"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-[#00f59b] border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING TOURNAMENTS DIRECTORY...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#10141e] border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-[42px] text-slate-600 mb-2">emoji_events</span>
          <p className="text-sm font-bold text-white uppercase tracking-wider">No Tournaments Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or competition filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const st = getStatus(item.start_date, item.end_date);
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG["World Cup"];
            const pct = progressPct(item.start_date, item.end_date);
            const startYr = item.start_date ? new Date(item.start_date).getFullYear() : "";
            const endYr = item.end_date ? new Date(item.end_date).getFullYear() : "";
            const seasonStr = startYr && endYr && startYr !== endYr ? `${startYr}–${String(endYr).slice(-2)}` : startYr || "";

            return (
              <div
                key={item.tournament_id}
                className={`bg-[#10141e] rounded-lg p-4 border transition-all duration-200 flex flex-col justify-between shadow-sm group ${
                  isSelected(item.tournament_id)
                    ? "border-emerald-500/80 bg-emerald-950/10"
                    : "border-white/10 hover:border-emerald-500/30"
                }`}
              >
                <div>
                  {/* Top Tag Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(item.tournament_id)}
                          onChange={() => toggleSelect(item.tournament_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer shrink-0"
                          aria-label={`Select ${item.name}`}
                        />
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase whitespace-nowrap flex items-center gap-1 ${st.badgeColor}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`}></span>
                        <span>{st.label}</span>
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase whitespace-nowrap ${cfg.badge}`}
                      >
                        {cfg.badgeLabel}
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded bg-[#0a0d14] border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                      <span className="material-symbols-outlined text-[15px]">{cfg.icon}</span>
                    </div>
                  </div>

                  {/* Tournament Name & Format */}
                  <div className="mt-2.5">
                    <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors break-words leading-tight uppercase">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-500 shrink-0">
                        hub
                      </span>
                      <span className="truncate">
                        {item.format} {seasonStr ? `· Season ${seasonStr}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Window & Lifecycle Progress Inset Box */}
                  <div className="bg-[#0a0d14] rounded border border-white/5 p-3.5 my-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-bold leading-tight">
                          TOURNAMENT WINDOW
                        </span>
                        <div className="text-xs font-mono text-slate-300 font-semibold mt-0.5">
                          {formatDate(item.start_date)} — {formatDate(item.end_date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-black text-white">
                          {pct}%
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase ml-1 block">
                          Lifecycle
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full ${st.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* 2x2 Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-white/5 my-2">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        REGISTERED TEAMS
                      </span>
                      <span className="font-mono text-xs font-bold text-white mt-0.5 block truncate">
                        {item.team_count || 0} Teams Assigned
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        SCHEDULED MATCHES
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5 block truncate">
                        {item.match_count || 0} Fixtures Logged
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        COMPETITION FORMAT
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-0.5 block truncate">
                        {item.format}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        GOVERNING TIER
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-0.5 block truncate">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Status & Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`}></span>
                    <span>{st.label.toUpperCase()} CALENDAR</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="px-2.5 py-1 bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/10 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                      title="Edit Tournament"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      <span>EDIT</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.tournament_id, item.name)}
                      className="px-2 py-1 bg-[#121824] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                      title="Delete Tournament"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      <span>DELETE</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
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
                        aria-label="Select all tournaments"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Teams</th>
                  <th className="py-3 px-4">Matches</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((item) => {
                  const st = getStatus(item.start_date, item.end_date);
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG["World Cup"];

                  return (
                    <tr
                      key={item.tournament_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected(item.tournament_id) ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected(item.tournament_id)}
                            onChange={() => toggleSelect(item.tournament_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${cfg.badge}`}>
                          {cfg.badgeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.format}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatDate(item.start_date)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatDate(item.end_date)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {item.team_count || 0} Teams
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.match_count || 0} Matches
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${st.badgeColor}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2.5 py-1 bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/10 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                            title="Edit Tournament"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            <span>EDIT</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.tournament_id, item.name)}
                            className="px-2 py-1 bg-[#121824] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                            title="Delete Tournament"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span>
                            <span>DELETE</span>
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
      )}

      {/* Compliance / Status Footer Banner */}
      <div className="bg-[#10141e] border border-white/10 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">verified_user</span>
          <div>
            <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider block">
              FIFA COMPETITION REGULATIONS 2026/27 COMPLIANT
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              TMS Scheduling Protocol v9.8.2 · Real-time bracket sync active · Zürich HQ Direct Connect
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 shrink-0">
          <span>ALL CALENDARS VERIFIED</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            TMS SYNCED
          </span>
        </div>
      </div>

      {/* Add / Edit Tournament Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Tournament" : "Add Tournament"}
        subtitle="Manage championship competition details and calendar dates"
        icon="emoji_events"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tournament Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. FIFA World Cup 2026"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tournament Type <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                {types.map((t) => (
                  <option key={t} value={t} className="bg-[#10141e] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Format <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                {formats.map((f) => (
                  <option key={f} value={f} className="bg-[#10141e] text-white">
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Start Date <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                End Date <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
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
              {loadingAction ? "Saving..." : editingId ? "Save Changes" : "Register Tournament"}
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
        entityName="tournament"
        loading={bulkLoading}
      />
    </div>
  );
}