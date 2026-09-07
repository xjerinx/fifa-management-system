import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { useBulkSelection } from "../hooks/useBulkSelection";
import BulkActionBar from "../components/BulkActionBar";
import BulkDeleteConfirmModal from "../components/BulkDeleteConfirmModal";

const emptyForm = {
  name: "",
  nickname: "",
  foundation_year: "",
  jersey_color: "#10b981",
  fifa_ranking: "",
  association_id: "",
  coach_id: "",
};

// Visual metadata tailored for FIFA National Teams Directory reference
const TEAM_CONFIG = {
  Brazil: {
    code: "BR",
    accent: "#ffd814",
    confed: "CONFEDERAÇÃO SUL-AMERICANA (CONMEBOL)",
    champBadge: null,
    tier: "ELITE",
  },
  Argentina: {
    code: "AR",
    accent: "#38bdf8",
    confed: "CONFEDERAÇÃO SUL-AMERICANA (CONMEBOL)",
    champBadge: "WORLD CHAMP",
    tier: "ELITE",
  },
  France: {
    code: "FR",
    accent: "#3b82f6",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  England: {
    code: "EN",
    accent: "#e2e8f0",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  Spain: {
    code: "SP",
    accent: "#ef4444",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: "EURO CHAMP",
    tier: "ELITE",
  },
  Germany: {
    code: "GE",
    accent: "#f59e0b",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  Italy: {
    code: "IT",
    accent: "#0284c7",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  Netherlands: {
    code: "NE",
    accent: "#f97316",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  Portugal: {
    code: "PO",
    accent: "#dc2626",
    confed: "UNION OF EUROPEAN FOOTBALL (UEFA)",
    champBadge: null,
    tier: "ELITE",
  },
  Uruguay: {
    code: "UR",
    accent: "#38bdf8",
    confed: "CONFEDERAÇÃO SUL-AMERICANA (CONMEBOL)",
    champBadge: null,
    tier: "ELITE",
  },
  Japan: {
    code: "JA",
    accent: "#2563eb",
    confed: "ASIAN FOOTBALL CONFEDERATION (AFC)",
    champBadge: null,
    tier: "CONTENDER",
  },
  Senegal: {
    code: "SE",
    accent: "#10b981",
    confed: "CONFEDERATION OF AFRICAN FOOTBALL (CAF)",
    champBadge: null,
    tier: "CONTENDER",
  },
};

export default function Teams() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [confedFilter, setConfedFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL TIERS");
  const [sortBy, setSortBy] = useState("ranking");
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
  } = useBulkSelection("team_id");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .get("/teams")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load teams", "error")
      )
      .finally(() => setLoading(false));
  };

  const loadAssociations = () => {
    api
      .get("/associations")
      .then((res) => setAssociations(res.data.data || []))
      .catch((err) => console.error("Failed to load associations for teams:", err));
  };

  const loadCoaches = () => {
    api
      .get("/coaches")
      .then((res) => setCoaches(res.data.data || []))
      .catch((err) => console.error("Failed to load coaches for teams:", err));
  };

  useEffect(() => {
    load();
    loadAssociations();
    loadCoaches();
  }, []);

  const openCreate = () => {
    loadCoaches();
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    loadCoaches();
    setForm({
      name: item.name,
      nickname: item.nickname || "",
      foundation_year: Number(item.foundation_year) > 0 ? item.foundation_year : "",
      jersey_color: item.jersey_color || "#10b981",
      fifa_ranking: item.fifa_ranking || "",
      association_id: item.association_id,
      coach_id: item.coach_id || "",
    });
    setEditingId(item.team_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/teams/${editingId}`, form);
        toast?.showToast("Team updated successfully");
      } else {
        await api.post("/teams", form);
        toast?.showToast("Team registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this team"}?`)) return;
    try {
      await api.delete(`/teams/${id}`);
      toast?.showToast("Team deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete team", "error");
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/teams/bulk-delete", { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} teams`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete selected teams", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filtered, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-national-teams-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Squad rosters exported successfully");
  };

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      // Confederation filter
      const confedStr = (
        TEAM_CONFIG[item.name]?.confed ||
        item.association_name ||
        ""
      ).toUpperCase();

      let matchesConfed = true;
      if (confedFilter === "UEFA") matchesConfed = confedStr.includes("UEFA");
      else if (confedFilter === "CONMEBOL")
        matchesConfed = confedStr.includes("CONMEBOL") || confedStr.includes("SUDAMERICANA");
      else if (confedFilter === "AFC")
        matchesConfed = confedStr.includes("AFC") || confedStr.includes("ASIAN");
      else if (confedFilter === "CAF")
        matchesConfed = confedStr.includes("CAF") || confedStr.includes("AFRICAN");

      // Tier filter
      const rank = Number(item.fifa_ranking) || 999;
      let matchesTier = true;
      if (tierFilter === "ELITE") matchesTier = rank <= 10;
      else if (tierFilter === "CONTENDER") matchesTier = rank > 10;

      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.nickname?.toLowerCase().includes(q) ||
        item.association_name?.toLowerCase().includes(q) ||
        item.coach_name?.toLowerCase().includes(q) ||
        TEAM_CONFIG[item.name]?.code?.toLowerCase().includes(q);

      return matchesConfed && matchesTier && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "ranking")
        return (Number(a.fifa_ranking) || 999) - (Number(b.fifa_ranking) || 999);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "players")
        return (Number(b.player_count) || 0) - (Number(a.player_count) || 0);
      if (sortBy === "founded") {
        const yearA = Number(a.foundation_year) > 0 ? Number(a.foundation_year) : 9999;
        const yearB = Number(b.foundation_year) > 0 ? Number(b.foundation_year) : 9999;
        return yearA - yearB;
      }
      return 0;
    });

    return list;
  }, [items, search, confedFilter, tierFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const totalPlayers = useMemo(
    () => items.reduce((acc, curr) => acc + (Number(curr.player_count) || 0), 0),
    [items]
  );
  const totalCoaches = useMemo(
    () => items.filter((i) => i.coach_name || TEAM_CONFIG[i.name]?.fallbackCoach).length,
    [items]
  );

  return (
    <div className="flex flex-col w-full pb-14 gap-5 text-on-surface">
      {/* ========================================================
          1. EDITORIAL PAGE HEADER
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pt-1">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-emerald-400 font-semibold mb-1">
            <span>FEDERATION CONSOLE // REGISTRY</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">SYNC: ACTIVE (TMS 2026.4)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase leading-[1.08] font-display">
            NATIONAL TEAMS
            <br />
            DIRECTORY
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl font-normal">
            {items.length} registered senior national teams competing in FIFA and continental
            championships
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#121722] hover:bg-[#1a2233] text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#1e2738] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              download
            </span>
            <span>Export Squad Rosters</span>
          </button>

          <button
            onClick={() => setSortBy(sortBy === "ranking" ? "name" : "ranking")}
            className={`flex items-center gap-2 px-3.5 py-2 bg-[#121722] hover:bg-[#1a2233] text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors shadow-sm ${sortBy === "ranking"
              ? "text-emerald-400 border-emerald-500/30"
              : "text-slate-300 border-[#1e2738]"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>Ranking Filter</span>
          </button>

          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors shadow-sm cursor-pointer ${
              isSelectionMode
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#121722] hover:bg-[#1a2233] text-slate-300 hover:text-white border-[#1e2738]"
            }`}
            title="Select multiple teams for deletion"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSelectionMode ? "close" : "checklist"}
            </span>
            <span>{isSelectionMode ? "Cancel Selection" : "Multiple Deletion"}</span>
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Register Team</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SUMMARY STAT CARDS (4 COMPACT KPI CARDS)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Teams */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE TEAMS
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">
              flag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {items.length}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-tight">
                100% AUDITED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Senior tier national delegations
            </p>
          </div>
        </div>

        {/* Registered Players */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              REGISTERED PLAYERS
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">
              sports_soccer
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {totalPlayers}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-mono font-bold uppercase tracking-tight">
                CAP: 26 / TEAM
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Squad sheets validated in FIFA TMS
            </p>
          </div>
        </div>

        {/* Head Coaches */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              HEAD COACHES
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              badge
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {totalCoaches}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-tight">
                PRO LICENSED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              UEFA / CONMEBOL Pro credentials
            </p>
          </div>
        </div>

        {/* Holders */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              HOLDERS
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              emoji_events
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                2
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-tight">
                MAJOR TITLES
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              ARG (World Cup) • ESP (Euro)
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. REGISTRY TOOLBAR: SEARCH & FILTERS
          ======================================================== */}
      <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#111622] px-3 py-1.5 rounded-lg border border-[#1f2738] flex-1 min-w-[240px] max-w-md focus-within:border-emerald-500/50 transition-colors">
            <span className="material-symbols-outlined text-[16px] text-slate-500">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by country, federation, nickname..."
              className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full"
              type="text"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[9px] bg-[#1c2433] text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                ESC
              </kbd>
            )}
          </div>

          {/* Confederation Filter Pills */}
          <div className="flex items-center gap-1">
            {["ALL", "UEFA", "CONMEBOL", "AFC", "CAF"].map((confed) => (
              <button
                key={confed}
                onClick={() => setConfedFilter(confed)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${confedFilter === confed
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {confed}
              </button>
            ))}
          </div>

          <div className="hidden lg:block w-px h-5 bg-[#1f2738]"></div>

          {/* Tier Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-[#111622] rounded-lg border border-[#1f2738]">
            {["ALL TIERS", "ELITE", "CONTENDER"].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${tierFilter === tier
                  ? "bg-[#1f2b3e] text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Right Sort & View Controls */}
        <div className="flex items-center gap-2.5 shrink-0 justify-end">
          <div className="flex items-center gap-1.5 bg-[#111622] border border-[#1f2738] rounded-lg px-2.5 py-1">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              arrow_downward
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="ranking" className="bg-[#111622]">FIFA Rank</option>
              <option value="name" className="bg-[#111622]">Name: A-Z</option>
              <option value="players" className="bg-[#111622]">Most Players</option>
              <option value="founded" className="bg-[#111622]">Oldest Founded</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#111622] rounded-lg border border-[#1f2738] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                ? "bg-[#1f2b3e] text-emerald-400"
                : "text-slate-400 hover:text-white"
                }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table"
                ? "bg-[#1f2b3e] text-emerald-400"
                : "text-slate-400 hover:text-white"
                }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
            </button>
          </div>

          {/* Multiple Deletion Mode Button */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
              isSelectionMode
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#111622] hover:bg-[#1f2b3e] text-slate-300 hover:text-white border-[#1f2738]"
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
          entityName="team"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {/* ========================================================
          4. TEAM DIRECTORY GRID (4 COLUMNS DENSE LAYOUT)
          ======================================================== */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Synchronizing National Teams Registry...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#0c1017] border border-[#192233] rounded-xl">
          <span className="material-symbols-outlined text-[44px] text-slate-600 mb-2">
            shield
          </span>
          <p className="text-base font-bold text-white uppercase tracking-wider">
            No Teams Matching Criteria
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query, confederation filter, or tier selection.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setConfedFilter("ALL");
              setTierFilter("ALL TIERS");
            }}
            className="mt-4 px-3.5 py-1.5 bg-[#162030] hover:bg-[#1e2c42] text-xs font-semibold text-slate-200 rounded-lg transition-colors border border-white/5"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((item) => {
            const config = TEAM_CONFIG[item.name] || {};
            const code = config.code || item.name.slice(0, 2).toUpperCase();
            const accent = item.jersey_color?.startsWith("#")
              ? item.jersey_color
              : config.accent || "#10b981";
            const confederationFullName =
              config.confed || item.association_name?.toUpperCase() || "FIFA MEMBER ASSOCIATION";
            const champBadge = config.champBadge;
            const rank = Number(item.fifa_ranking) || null;
            const isElite = rank !== null && rank <= 10;
            const headCoach =
              item.coach_name?.trim() || "Unassigned";

            return (
              <div
                key={item.team_id}
                className="relative bg-[#0d121c] border border-[#192131] hover:border-[#27354d] transition-all rounded-xl p-4 flex flex-col justify-between shadow-sm overflow-hidden group"
              >
                {/* Top colored accent stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] transition-opacity"
                  style={{ backgroundColor: accent }}
                />

                <div>
                  {/* Card Header: Initials Badge, Name & Rank */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(item.team_id)}
                          onChange={(e) => toggleSelect(item.team_id, e)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900/90 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500 cursor-pointer shrink-0 animate-in fade-in duration-100"
                          title="Select team"
                        />
                      )}
                      {/* Initials Badge */}
                      <div className="w-9 h-9 rounded-lg bg-[#141a26] border border-[#222c3d] flex items-center justify-center font-black text-xs text-white tracking-wider shrink-0 shadow-inner">
                        {code}
                      </div>
                    </div>

                    {/* Team Name, Nickname & Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-white tracking-wider uppercase truncate group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </h3>

                        {/* Championship badge or Elite/Contender pill */}
                        {champBadge ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-tight">
                            <span className="material-symbols-outlined text-[10px]">
                              emoji_events
                            </span>
                            <span>{champBadge}</span>
                          </span>
                        ) : isElite ? (
                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[#1e293b] text-[#93c5fd] border border-[#334155] uppercase tracking-wider">
                            ELITE
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[#151c28] text-slate-400 border border-[#253247] uppercase tracking-wider">
                            CONTENDER
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                        {item.nickname ? `"${item.nickname}"` : "Senior National Squad"}
                      </p>
                    </div>

                    {/* Right: FIFA Rank */}
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-white block leading-none font-mono">
                        {item.fifa_ranking ? `#${item.fifa_ranking}` : "—"}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight block mt-0.5">
                        FIFA RANK
                      </span>
                    </div>
                  </div>

                  {/* Confederation Row */}
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-tight mt-3 truncate">
                    <span className="material-symbols-outlined text-[13px] text-slate-500 shrink-0">
                      public
                    </span>
                    <span className="truncate">{confederationFullName}</span>
                  </div>

                  {/* Coach & Players Row */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#161e2c]">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                        HEAD COACH
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">
                        {headCoach}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold shrink-0">
                      <span className="material-symbols-outlined text-[13px]">
                        group
                      </span>
                      <span>{item.player_count || 0} PL</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Est. Year & Action Buttons */}
                <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-[#161e2c]">
                  <span className="text-[11px] font-mono text-slate-400 truncate">
                    Est. {Number(item.foundation_year) > 0 ? item.foundation_year : "—"}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Team"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.team_id, item.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Team"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        delete
                      </span>
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 tracking-wider uppercase ml-1 transition-colors"
                      title="View Squad & Tactics"
                    >
                      <span>SQUAD & TACTICS</span>
                      <span className="material-symbols-outlined text-[13px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0c1017] rounded-xl border border-[#192233] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111622] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#192233]">
                  {isSelectionMode && (
                    <th className="py-3 px-3 w-10 text-center animate-in fade-in duration-100">
                      <input
                        ref={tableCheckRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => toggleSelectAll(filtered)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900/90 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Nickname</th>
                  <th className="py-3 px-4">Confederation</th>
                  <th className="py-3 px-4">Head Coach</th>
                  <th className="py-3 px-4">Players</th>
                  <th className="py-3 px-4">Founded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161e2c] text-xs">
                {filtered.map((item) => {
                  const config = TEAM_CONFIG[item.name] || {};
                  const code = config.code || item.name.slice(0, 2).toUpperCase();
                  const accent = item.jersey_color?.startsWith("#")
                    ? item.jersey_color
                    : config.accent || "#10b981";

                  return (
                    <tr
                      key={item.team_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelectionMode && isSelected(item.team_id) ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 w-10 text-center animate-in fade-in duration-100">
                          <input
                            type="checkbox"
                            checked={isSelected(item.team_id)}
                            onChange={(e) => toggleSelect(item.team_id, e)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900/90 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.fifa_ranking ? `#${item.fifa_ranking}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-6 h-6 rounded bg-[#141a26] border border-[#222c3d] flex items-center justify-center text-[10px] font-bold text-white font-mono shrink-0"
                            style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
                          >
                            {code}
                          </span>
                          <span className="font-bold text-white uppercase tracking-wider">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">
                        {item.nickname ? `"${item.nickname}"` : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {config.confed || item.association_name || "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {item.coach_name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.player_count || 0} PL
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {Number(item.foundation_year) > 0 ? item.foundation_year : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Edit Team"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.team_id, item.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Team"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
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

      {/* ========================================================
          5. ADD / EDIT TEAM MODAL (UNIFIED DESIGN SYSTEM)
          ======================================================== */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Team" : "Add Team"}
        subtitle="Manage national team profile, colors, and ranking"
        icon="shield"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Team Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Spain National Team"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Head Coach <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <select
              value={form.coach_id}
              onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
            >
              <option value="">Unassigned Coach</option>
              {coaches.map((c) => {
                const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
                const isCurrent = editingId && c.team_id === editingId;
                const statusText = isCurrent
                  ? "(Current Coach)"
                  : c.team_name
                  ? `(Assigned: ${c.team_name})`
                  : "(Free Agent)";
                return (
                  <option key={c.coach_id} value={c.coach_id}>
                    {fullName} — {statusText}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nickname
              </label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="e.g. La Roja"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                FIFA Ranking
              </label>
              <input
                type="number"
                min="1"
                max="250"
                value={form.fifa_ranking}
                onChange={(e) => setForm({ ...form, fifa_ranking: e.target.value })}
                placeholder="e.g. 1"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Foundation Year <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="1800"
                max="2030"
                required
                value={form.foundation_year}
                onChange={(e) => setForm({ ...form, foundation_year: e.target.value })}
                placeholder="e.g. 1913"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Jersey Color
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={form.jersey_color}
                  onChange={(e) => setForm({ ...form, jersey_color: e.target.value })}
                  className="w-9 h-8 p-0.5 bg-[#0a0e16] border border-[#1f2738] rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={form.jersey_color}
                  onChange={(e) => setForm({ ...form, jersey_color: e.target.value })}
                  className="flex-1 bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Governing Association <span className="text-emerald-400">*</span>
            </label>
            <select
              required
              value={form.association_id}
              onChange={(e) => setForm({ ...form, association_id: e.target.value })}
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
            >
              <option value="">Select Association</option>
              {associations.map((a) => (
                <option key={a.association_id} value={a.association_id}>
                  {a.name} ({a.fifa_code || a.region})
                </option>
              ))}
            </select>
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
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingAction ? "Saving..." : editingId ? "Update Team" : "Save Team"}
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
        entityName="team"
        loading={bulkLoading}
      />
    </div>
  );
}