import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

const emptyForm = { name: "", region: "", fifa_code: "", foundation_date: "" };

// Rich metadata map matching the reference image for official football governing bodies
const ASSOCIATION_META = {
  UEFA: {
    hq: "Nyon, Switzerland",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Certified",
    metric1Label: "TEAMS",
    metric1Val: "7 Elite",
    metric2Label: "COMPETITIONS",
    metric2Val: "3 Active",
    metaText: "Jurisdiction: 55 Nations",
    topBar: "bg-sky-500",
    tagColor: "text-sky-400",
  },
  CBF: {
    hq: "Rio de Janeiro, Brazil",
    type: "MEMBER FEDERATION",
    tier: "FIFA #1",
    badge: "CONMEBOL",
    status: "Active Valid",
    metric1Label: "SQUAD",
    metric1Val: "8 Members",
    metric2Label: "DISCIPLINE",
    metric2Val: "0 Flags",
    metaText: "Pres: E. Rodrigues",
    topBar: "bg-emerald-500",
    tagColor: "text-emerald-400",
  },
  CONMEBOL: {
    hq: "Luque, Paraguay",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Certified",
    metric1Label: "ACTIVE TEAMS",
    metric1Val: "3 Nations",
    metric2Label: "ROSTER POOL",
    metric2Val: "BRA, ARG, URU",
    metaText: "HQ: CONMEBOL Complex",
    topBar: "bg-sky-500",
    tagColor: "text-sky-400",
  },
  AFC: {
    hq: "Kuala Lumpur, Malaysia",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Certified",
    metric1Label: "ACTIVE MEMBERS",
    metric1Val: "1 Japan",
    metric2Label: "AFFILIATES",
    metric2Val: "47 FAs",
    metaText: "Pres: Salman Al Khalifa",
    topBar: "bg-rose-500",
    tagColor: "text-rose-400",
  },
  CAF: {
    hq: "Cairo, Egypt",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Certified",
    metric1Label: "ACTIVE MEMBERS",
    metric1Val: "1 Senegal",
    metric2Label: "REGIONS",
    metric2Val: "6 Zones",
    metaText: "Pres: P. Motsepe",
    topBar: "bg-amber-500",
    tagColor: "text-amber-400",
  },
  CONCACAF: {
    hq: "Miami, USA",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Compliant",
    metric1Label: "ACTIVE TEAMS",
    metric1Val: "0 Rosters",
    metric2Label: "HOST STATUS",
    metric2Val: "2026 Host",
    metaText: "Pres: V. Montagliani",
    topBar: "bg-sky-500",
    tagColor: "text-sky-400",
  },
  DFB: {
    hq: "Frankfurt, Germany",
    type: "MEMBER FEDERATION",
    tier: "FIFA #6",
    badge: "UEFA",
    status: "Active Valid",
    metric1Label: "SQUAD",
    metric1Val: "7 Members",
    metric2Label: "AUDIT SCORE",
    metric2Val: "99.4%",
    metaText: "Pres: B. Neuendorf",
    topBar: "bg-slate-500",
    tagColor: "text-slate-400",
  },
  FIGC: {
    hq: "Rome, Italy",
    type: "MEMBER FEDERATION",
    tier: "FIFA #7",
    badge: "UEFA",
    status: "Active Valid",
    metric1Label: "SQUAD",
    metric1Val: "0 Rosters",
    metric2Label: "LEGACY",
    metric2Val: "4 Titles",
    metaText: "Pres: G. Gravina",
    topBar: "bg-blue-500",
    tagColor: "text-blue-400",
  },
  OFC: {
    hq: "Auckland, New Zealand",
    type: "CONTINENTAL CONFEDERATION",
    tier: "TIER 1",
    status: "Certified",
    metric1Label: "ACTIVE TEAMS",
    metric1Val: "0 Rosters",
    metric2Label: "MEMBER FAS",
    metric2Val: "13 FAs",
    metaText: "Pres: L. Chung",
    topBar: "bg-teal-500",
    tagColor: "text-teal-400",
  },
  RFEF: {
    hq: "Las Rozas, Madrid, Spain",
    type: "MEMBER FEDERATION",
    tier: "UEFA REIGNING",
    badge: "UEFA",
    status: "Active Valid",
    metric1Label: "SQUAD",
    metric1Val: "7 Players",
    metric2Label: "AUDIT RATING",
    metric2Val: "Class A",
    metaText: "Pres: P. Rocha",
    topBar: "bg-amber-500",
    tagColor: "text-amber-400",
  },
};

const CONFED_TABS = ["ALL", "UEFA", "CONMEBOL", "CAF", "AFC", "CONCACAF", "OFC"];

function getCodeBadgeStyle(code) {
  if (!code) return "text-xs tracking-wider";
  const len = code.trim().length;
  if (len >= 8) return "text-[7.5px] tracking-tighter leading-none px-0.5"; // e.g. CONCACAF
  if (len >= 6) return "text-[8.5px] tracking-tighter leading-none px-0.5"; // e.g. CONMEBOL
  if (len >= 4) return "text-[10px] tracking-tight";                       // e.g. UEFA, RFEF, FIGC
  return "text-xs tracking-wider";                                         // e.g. CBF, DFB, OFC
}

export default function Associations() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedConfed, setSelectedConfed] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  const load = () => {
    setLoading(true);
    api
      .get("/associations")
      .then((res) => setItems(res.data.data || []))
      .catch((err) => {
        toast?.showToast(
          err.response?.data?.message || "Failed to load associations",
          "error"
        );
      })
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
      region: item.region,
      fifa_code: item.fifa_code,
      foundation_date: item.foundation_date?.split("T")[0] || "",
    });
    setEditingId(item.association_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/associations/${editingId}`, form);
        toast?.showToast("Association updated successfully");
      } else {
        await api.post("/associations", form);
        toast?.showToast("Association registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this association"}?`)) return;
    try {
      await api.delete(`/associations/${id}`);
      toast?.showToast("Association deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(
        err.response?.data?.message || "Failed to delete association",
        "error"
      );
    }
  };

  // Filter logic supporting confederation tab and search
  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      // Confed tab check
      if (selectedConfed !== "ALL") {
        const code = item.fifa_code?.toUpperCase();
        const region = item.region?.toLowerCase() || "";
        const confedMatch =
          code === selectedConfed ||
          (selectedConfed === "UEFA" && (region.includes("europe") || code === "DFB" || code === "FIGC" || code === "RFEF")) ||
          (selectedConfed === "CONMEBOL" && (region.includes("south america") || code === "CBF")) ||
          (selectedConfed === "CAF" && region.includes("africa")) ||
          (selectedConfed === "AFC" && region.includes("asia")) ||
          (selectedConfed === "CONCACAF" && region.includes("north america")) ||
          (selectedConfed === "OFC" && region.includes("oceania"));

        if (!confedMatch) return false;
      }

      // Search query
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        item.name?.toLowerCase().includes(q) ||
        item.fifa_code?.toLowerCase().includes(q) ||
        item.region?.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "teams") return (b.team_count || 0) - (a.team_count || 0);
      if (sortBy === "founded")
        return new Date(a.foundation_date || 0) - new Date(b.foundation_date || 0);
      return 0;
    });

    return list;
  }, [items, search, selectedConfed, sortBy]);

  const totalTeams = items.reduce((acc, curr) => acc + (Number(curr.team_count) || 0), 0);

  const exportRegistry = () => {
    const dataStr = JSON.stringify(filtered, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-associations-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-12 gap-5 text-slate-200">
      {/* ========================================================
          1. HEADER & ACTION CLUSTER
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          {/* Micro Telemetry Bar */}
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <span className="font-bold text-sky-400">GOVERNANCE & JURISDICTION HUB</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              TMS Node V4.2 Connected
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            FOOTBALL ASSOCIATIONS & CONFEDERATIONS
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Global administrative registry tracking continental confederations and recognized member associations under FIFA Statutes 2026/27.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={exportRegistry}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111622] hover:bg-[#182133] text-slate-300 hover:text-white text-xs font-semibold rounded border border-[#1b2234] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>AUDIT REPORTS</span>
          </button>

          <button
            onClick={exportRegistry}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111622] hover:bg-[#182133] text-slate-300 hover:text-white text-xs font-semibold rounded border border-[#1b2234] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>EXPORT REGISTRY</span>
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ REGISTER ASSOCIATION</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SIX OPERATIONAL KPI METRIC CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: CONFEDERATIONS */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            CONFEDERATIONS
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight">06</span>
            <span className="text-[11px] text-slate-400 font-mono">Continental</span>
          </div>
          <div className="h-0.5 w-full bg-sky-500/80 rounded-full mt-1"></div>
        </div>

        {/* Card 2: ACTIVE FEDERATIONS */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ACTIVE FEDERATIONS
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {items.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">+2 pending</span>
          </div>
          <div className="h-0.5 w-full bg-emerald-500/80 rounded-full mt-1"></div>
        </div>

        {/* Card 3: AFFILIATED TEAMS */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            AFFILIATED TEAMS
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {totalTeams || 12}
            </span>
            <span className="text-[11px] text-sky-400 font-mono">Elite Tier</span>
          </div>
          <div className="h-0.5 w-full bg-sky-500/80 rounded-full mt-1"></div>
        </div>

        {/* Card 4: FIFA COMPLIANCE */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            FIFA COMPLIANCE
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              100%
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Certified</span>
          </div>
          <div className="h-0.5 w-full bg-emerald-500/80 rounded-full mt-1"></div>
        </div>

        {/* Card 5: SANCTIONS & FLAGS */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            SANCTIONS & FLAGS
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">00</span>
            <span className="text-[11px] text-amber-400 font-mono">Clean Slate</span>
          </div>
          <div className="h-0.5 w-full bg-amber-500/80 rounded-full mt-1"></div>
        </div>

        {/* Card 6: ACTIVE COMPETITIONS */}
        <div className="bg-[#111622] p-3.5 rounded-lg border border-[#1b2234] flex flex-col justify-between min-h-[96px] relative overflow-hidden shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ACTIVE COMPETITIONS
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight">08</span>
            <span className="text-[11px] text-sky-400 font-mono">Live Hubs</span>
          </div>
          <div className="h-0.5 w-full bg-blue-500/80 rounded-full mt-1"></div>
        </div>
      </div>

      {/* ========================================================
          3. FILTER & SEARCH CONTROL STRIP
          ======================================================== */}
      <div className="bg-[#111622] p-2.5 rounded-lg border border-[#1b2234] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#0c101a] px-3 py-1.5 rounded border border-[#1b2234] flex-1 max-w-md focus-within:border-emerald-500/50 transition-colors">
          <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by association name, code, cc"
            className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full font-mono"
            type="text"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] text-slate-400 hover:text-white font-mono"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Confederation Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 scrollbar-none font-mono text-xs">
          {CONFED_TABS.map((tab) => {
            const countLabel = tab === "ALL" ? ` (${items.length})` : "";
            const active = selectedConfed === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedConfed(tab)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#1e2738] text-white border border-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
                {countLabel}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown & View Mode Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto">
          <div className="flex items-center gap-1.5 bg-[#0c101a] px-2.5 py-1.5 rounded border border-[#1b2234] text-xs font-mono">
            <span className="text-slate-500 uppercase font-bold text-[10px]">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="name" className="bg-[#111622]">Name (A-Z)</option>
              <option value="teams" className="bg-[#111622]">Most Teams</option>
              <option value="founded" className="bg-[#111622]">Foundation Year</option>
            </select>
          </div>

          <div className="flex items-center bg-[#0c101a] p-0.5 rounded border border-[#1b2234]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "text-[#00f59b] bg-[#162030]"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "text-[#00f59b] bg-[#162030]"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[17px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. CONTENT AREA: BENTO CARDS GRID OR DATA TABLE
          ======================================================== */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Accessing master registry...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#111622] border border-[#1b2234] rounded-lg">
          <span className="material-symbols-outlined text-[40px] text-slate-600 mb-2">flag</span>
          <p className="text-base font-bold text-white uppercase font-mono">No Associations Found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust criteria or click "+ Register Association" to add.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Bento Grid (3 Columns matching reference image) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const code = item.fifa_code || "—";
            const meta = ASSOCIATION_META[code] || {
              hq: item.region || "Global Headquarters",
              type: item.region ? "MEMBER FEDERATION" : "GOVERNING ENTITY",
              tier: "TIER 1",
              status: "Certified",
              metric1Label: "TEAMS",
              metric1Val: `${item.team_count || 0} Affiliated`,
              metric2Label: "COMPETITIONS",
              metric2Val: "Active",
              metaText: `Region: ${item.region || "Global"}`,
              topBar: "bg-emerald-500",
              tagColor: "text-emerald-400",
            };

            const estYear = item.foundation_date
              ? new Date(item.foundation_date).getFullYear()
              : "1904";

            return (
              <div
                key={item.association_id}
                className="bg-[#111622] rounded-lg border border-[#1b2234] hover:border-slate-600 transition-all p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden"
              >
                {/* Top Accent Color Bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${meta.topBar}`}></div>

                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Left Square Code Badge */}
                      <div
                        className={`w-10 h-10 rounded bg-[#161c2b] border border-white/10 font-mono font-bold text-white flex items-center justify-center shrink-0 shadow-inner select-none ${getCodeBadgeStyle(code)}`}
                        title={code}
                      >
                        <span className="truncate max-w-full text-center">{code}</span>
                      </div>

                      {/* Name & Headquarters */}
                      <div className="min-w-0">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${meta.tagColor}`}>
                          {meta.type}
                        </span>
                        <h2 className="text-sm font-bold text-white leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </h2>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          <span className="material-symbols-outlined text-[12px] text-slate-500 shrink-0">
                            location_on
                          </span>
                          <span className="truncate">
                            {meta.hq} • Est. {estYear}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#162030] text-slate-300 border border-white/10">
                        {meta.tier}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Metrics Breakdown Row */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 my-3 border-y border-[#1b2234] text-xs font-mono">
                    {/* Metric 1 */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        {meta.metric1Label}
                      </span>
                      <span className="text-xs font-bold text-white mt-0.5 block truncate">
                        {item.team_count ? `${item.team_count} Teams` : meta.metric1Val}
                      </span>
                    </div>

                    {/* Metric 2 */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        {meta.metric2Label}
                      </span>
                      <span className="text-xs font-bold text-sky-400 mt-0.5 block truncate">
                        {meta.metric2Val}
                      </span>
                    </div>

                    {/* Metric 3 (Status) */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        STATUS
                      </span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block truncate">
                        {meta.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata & Action Buttons */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {meta.metaText}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/teams"
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                    >
                      VIEW SQUADS
                    </Link>

                    <button
                      onClick={() => openEdit(item)}
                      className="text-[11px] font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider px-2 py-1 rounded bg-[#162030] border border-white/5"
                    >
                      MANAGE
                    </button>

                    <button
                      onClick={() => handleDelete(item.association_id, item.name)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Association"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-[#111622] rounded-lg border border-[#1b2234] overflow-hidden shadow-sm font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c101a] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1b2234]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Association / Confederation</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Headquarters</th>
                  <th className="py-3 px-4">Founded</th>
                  <th className="py-3 px-4">Affiliated Teams</th>
                  <th className="py-3 px-4">Compliance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234] text-xs">
                {filtered.map((item) => {
                  const code = item.fifa_code || "—";
                  const meta = ASSOCIATION_META[code] || {
                    hq: item.region || "Global",
                    type: "MEMBER FEDERATION",
                    tier: "TIER 1",
                    status: "Certified",
                  };
                  const estYear = item.foundation_date
                    ? new Date(item.foundation_date).getFullYear()
                    : "1904";

                  return (
                    <tr key={item.association_id} className="hover:bg-[#162030]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        <span className="px-2 py-0.5 rounded bg-[#161c2b] border border-white/10">
                          {code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#162030] text-sky-400 border border-sky-500/20 font-bold">
                          {meta.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {meta.hq}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {estYear}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.team_count || 0} Teams
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {meta.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2 py-1 rounded bg-[#162030] text-slate-300 hover:text-white border border-white/5 text-[11px] font-bold uppercase"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDelete(item.association_id, item.name)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
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
          5. STATUTORY COMPLIANCE STATUS BOTTOM BANNER
          ======================================================== */}
      <div className="bg-[#111622] p-4 rounded-lg border border-[#1b2234] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Statutory Compliance Status
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              All 10 governing entities hold active voting status for the 77th FIFA Congress. Zero statutory suspensions logged.
            </p>
          </div>
        </div>

        <button
          onClick={exportRegistry}
          className="px-3.5 py-2 bg-[#162030] hover:bg-[#1f2d44] text-slate-200 text-xs font-mono font-bold uppercase rounded border border-white/10 transition-colors shrink-0"
        >
          VIEW INTEGRITY REGISTRY
        </button>
      </div>

      {/* ========================================================
          6. CREATE / EDIT MODAL
          ======================================================== */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Association" : "Add Association"}
        subtitle="Manage confederation details, FIFA acronym, and region"
        icon="account_balance"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Association / Confederation Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Royal Spanish Football Federation"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                FIFA / Official Code <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength="8"
                value={form.fifa_code}
                onChange={(e) => setForm({ ...form, fifa_code: e.target.value.toUpperCase() })}
                placeholder="e.g. RFEF"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Region / Continental Zone <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Select Zone</option>
                <option value="Europe">Europe (UEFA)</option>
                <option value="South America">South America (CONMEBOL)</option>
                <option value="Africa">Africa (CAF)</option>
                <option value="Asia">Asia (AFC)</option>
                <option value="North America">North America (CONCACAF)</option>
                <option value="Oceania">Oceania (OFC)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Foundation Date
            </label>
            <input
              type="date"
              value={form.foundation_date}
              onChange={(e) => setForm({ ...form, foundation_date: e.target.value })}
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
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
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingAction ? "Saving..." : editingId ? "Update Association" : "Save Association"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}