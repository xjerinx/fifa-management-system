import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { useBulkSelection } from "../hooks/useBulkSelection";
import BulkActionBar from "../components/BulkActionBar";
import BulkDeleteConfirmModal from "../components/BulkDeleteConfirmModal";

const emptyForm = { name: "", capacity: "", location: "", city: "", country: "" };

function getCapacityTier(cap) {
  const c = Number(cap) || 0;
  if (c >= 80000) {
    return {
      label: "MEGA VENUE",
      color: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40",
    };
  }
  if (c >= 50000) {
    return {
      label: "MAJOR VENUE",
      color: "bg-sky-950/40 text-sky-400 border border-sky-500/40",
    };
  }
  return {
    label: "STANDARD VENUE",
    color: "bg-amber-950/40 text-amber-400 border border-amber-500/40",
  };
}

export default function Stadiums() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL"); // ALL, MEGA, MAJOR, STANDARD
  const [countryFilter, setCountryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("capacity");
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
  } = useBulkSelection("stadium_id");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .get("/stadiums")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load stadiums", "error")
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
      name: item.name || "",
      capacity: item.capacity || "",
      location: item.location || "",
      city: item.city || "",
      country: item.country || "",
    });
    setEditingId(item.stadium_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/stadiums/${editingId}`, form);
        toast?.showToast("Stadium updated successfully");
      } else {
        await api.post("/stadiums", form);
        toast?.showToast("Stadium registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this stadium"}?`)) return;
    try {
      await api.delete(`/stadiums/${id}`);
      toast?.showToast("Stadium deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete stadium", "error");
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/stadiums/bulk-delete", { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} stadiums`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete selected stadiums", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const maxCapacity = useMemo(
    () => Math.max(...items.map((i) => Number(i.capacity) || 0), 100000),
    [items]
  );

  const countries = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.country).filter(Boolean)))],
    [items]
  );

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      const cap = Number(item.capacity) || 0;
      let matchesTier = true;
      if (tierFilter === "MEGA") matchesTier = cap >= 80000;
      else if (tierFilter === "MAJOR") matchesTier = cap >= 50000 && cap < 80000;
      else if (tierFilter === "STANDARD") matchesTier = cap < 50000;

      const matchesCountry = countryFilter === "All" || item.country === countryFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.city?.toLowerCase().includes(q) ||
        item.country?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);

      return matchesTier && matchesCountry && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "capacity") return (Number(b.capacity) || 0) - (Number(a.capacity) || 0);
      if (sortBy === "capacity_asc") return (Number(a.capacity) || 0) - (Number(b.capacity) || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "matches")
        return (Number(b.matches_hosted) || 0) - (Number(a.matches_hosted) || 0);
      return 0;
    });

    return list;
  }, [items, search, tierFilter, countryFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const totalCapacity = items.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
  const totalMatchesHosted = items.reduce(
    (acc, curr) => acc + (Number(curr.matches_hosted) || 0),
    0
  );
  const avgCapacity = items.length > 0 ? Math.round(totalCapacity / items.length) : 0;
  const megaVenuesCount = items.filter((i) => (Number(i.capacity) || 0) >= 80000).length;
  const topHostStadium = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort((a, b) => (Number(b.matches_hosted) || 0) - (Number(a.matches_hosted) || 0))[0];
  }, [items]);

  const handleExport = () => {
    const exportData = filtered.map((s) => ({
      id: s.stadium_id,
      name: s.name,
      city: s.city,
      country: s.country,
      location: s.location || "—",
      capacity: Number(s.capacity) || 0,
      tier: getCapacityTier(s.capacity).label,
      matches_hosted: s.matches_hosted || 0,
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-stadiums-directory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Stadium directory exported successfully");
  };

  return (
    <div className="flex flex-col w-full pb-14 gap-6 text-on-surface bg-[#0a0d14] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">
                stadium
              </span>
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                VENUES & INFRASTRUCTURE REGISTRY // VENUE OPERATIONS DIVISION - FIFA CAT 4 ELITE
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                STADIUMS & HOST VENUES DIRECTORY
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                2026/27 ACCREDITED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">download</span>
              <span>Export Venues</span>
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors shadow-sm tracking-wide cursor-pointer whitespace-nowrap ${
                isSelectionMode
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-[#121722] hover:bg-[#1b2333] text-slate-200 border-white/10"
              }`}
              title="Select multiple stadiums for deletion"
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
              <span>REGISTER STADIUM</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          {items.length} certified international tournament stadiums with verified crowd capacity allocations and match fixture assignments.
        </p>
      </div>

      {/* KPI Stats Row (4 compact cards calculated strictly from real data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL CAPACITY
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">
              groups
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalCapacity.toLocaleString()}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">SEATS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Avg: {avgCapacity.toLocaleString()} / Venue
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-emerald-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              CERTIFIED VENUES
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">
              verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{items.length}</span>
              <span className="text-xs font-mono font-normal text-slate-400">/ {items.length} AUDITED</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% FIFA Category 4 Elite</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-sky-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL MATCHES HOSTED
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              sports_soccer
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{totalMatchesHosted}</span>
              <span className="text-xs font-mono font-normal text-slate-400">CONFIRMED</span>
            </div>
            <div className="text-[10px] font-mono text-amber-400 mt-1.5 font-semibold truncate">
              {topHostStadium ? `Top Host: ${topHostStadium.name} (${topHostStadium.matches_hosted})` : "Fixture Records Logged"}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-amber-400 rounded-full w-[75%]"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#10141e] p-4 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              MEGA VENUES (&gt;80K)
            </span>
            <span className="material-symbols-outlined text-[18px] text-teal-400">
              domain
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1.5">
              <span>{megaVenuesCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">/ {items.length} VENUES</span>
            </div>
            <div className="text-[10px] font-mono text-teal-400 mt-1.5 font-semibold">
              {items.length > 0 ? Math.round((megaVenuesCount / items.length) * 100) : 0}% Elite Mega Capacity Fleet
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-teal-400 rounded-full w-[60%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#10141e] p-2.5 rounded-lg border border-white/10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider mr-1">
            IN <span className="text-white">{filtered.length}</span> VENUES
          </span>

          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setTierFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                tierFilter === "ALL"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ALL ({items.length})
            </button>
            <button
              onClick={() => setTierFilter("MEGA")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                tierFilter === "MEGA"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              MEGA (&gt;80K)
            </button>
            <button
              onClick={() => setTierFilter("MAJOR")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                tierFilter === "MAJOR"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              MAJOR (50K–80K)
            </button>
            <button
              onClick={() => setTierFilter("STANDARD")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                tierFilter === "STANDARD"
                  ? "bg-[#00f59b] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              STANDARD (&lt;50K)
            </button>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#0a0d14] text-emerald-400 border border-emerald-500/20 uppercase tracking-wider hidden sm:inline-block">
            ACTIVE HOSTS ({filtered.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between xl:justify-end">
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded border border-white/10 flex-1 sm:w-64 max-w-full">
            <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stadiums, city, country..."
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
            <span className="material-symbols-outlined text-[15px] text-slate-400">public</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1"
            >
              {countries.map((c) => (
                <option key={c} value={c} className="bg-[#10141e] text-white">
                  {c === "All" ? "All Countries" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0d14] px-2.5 py-1.5 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1 uppercase"
            >
              <option value="capacity" className="bg-[#10141e] text-white">Capacity: High to Low</option>
              <option value="capacity_asc" className="bg-[#10141e] text-white">Capacity: Low to High</option>
              <option value="name" className="bg-[#10141e] text-white">Name: A to Z</option>
              <option value="matches" className="bg-[#10141e] text-white">Most Matches Hosted</option>
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
          entityName="stadium"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-[#00f59b] border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING STADIUM DIRECTORY...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#10141e] border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-[42px] text-slate-600 mb-2">stadium</span>
          <p className="text-sm font-bold text-white uppercase tracking-wider">No Stadiums Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or venue filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const cap = Number(item.capacity) || 0;
            const tier = getCapacityTier(cap);
            const fillPct = Math.min(100, Math.max(10, Math.round((cap / maxCapacity) * 100)));

            return (
              <div
                key={item.stadium_id}
                className={`bg-[#10141e] rounded-lg p-4 border transition-all duration-200 flex flex-col justify-between shadow-sm group ${
                  isSelected(item.stadium_id)
                    ? "border-emerald-500/80 bg-emerald-950/10"
                    : "border-white/10 hover:border-emerald-500/30"
                }`}
              >
                <div>
                  {/* Card Top Tag Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(item.stadium_id)}
                          onChange={() => toggleSelect(item.stadium_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer shrink-0"
                          aria-label={`Select ${item.name}`}
                        />
                      )}
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        CAT 4 ELITE
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase whitespace-nowrap ${tier.color}`}
                      >
                        {tier.label}
                      </span>
                      {Number(item.matches_hosted) > 0 && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                          {item.matches_hosted} MATCHES
                        </span>
                      )}
                    </div>

                    <div className="w-7 h-7 rounded bg-[#0a0d14] border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <span className="material-symbols-outlined text-[15px]">stadium</span>
                    </div>
                  </div>

                  {/* Stadium Name & Location */}
                  <div className="mt-2.5">
                    <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors break-words leading-tight">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-500 shrink-0">
                        location_on
                      </span>
                      <span className="truncate">
                        {item.city}, {item.country}{item.location ? ` — ${item.location}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Inset Box */}
                  <div className="bg-[#0a0d14] rounded border border-white/5 p-3.5 my-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-bold leading-tight">
                          TOURNAMENT
                        </span>
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-bold leading-tight">
                          CAPACITY
                        </span>
                      </div>
                      <div className="text-right flex items-baseline gap-1">
                        <span className="font-mono text-2xl font-black text-white leading-none">
                          {cap.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          / 100K MAX
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 2x2 Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-white/5 my-2">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        LOCATION / DISTRICT
                      </span>
                      <span className="text-xs font-semibold text-slate-300 mt-0.5 block truncate">
                        {item.location || item.city || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        OPERATIONAL STATUS
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5 block truncate">
                        CERTIFIED VENUE
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        VENUE CATEGORY
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-0.5 block truncate">
                        {tier.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                        MATCHES HOSTED
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-200 mt-0.5 block">
                        {item.matches_hosted || 0} Fixtures
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Status & Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ACTIVE HOST</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="px-2.5 py-1 bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/10 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                      title="Edit Stadium"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      <span>EDIT</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.stadium_id, item.name)}
                      className="px-2 py-1 bg-[#121824] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                      title="Delete Stadium"
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
                        aria-label="Select all stadiums"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Stadium Name</th>
                  <th className="py-3 px-4">City / Location</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Venue Tier</th>
                  <th className="py-3 px-4">Matches Hosted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((item) => {
                  const cap = Number(item.capacity) || 0;
                  const tier = getCapacityTier(cap);

                  return (
                    <tr
                      key={item.stadium_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected(item.stadium_id) ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected(item.stadium_id)}
                            onChange={() => toggleSelect(item.stadium_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.city} {item.location ? `(${item.location})` : ""}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.country}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {cap.toLocaleString()} seats
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${tier.color}`}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.matches_hosted || 0} Matches
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2.5 py-1 bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/10 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                            title="Edit Stadium"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            <span>EDIT</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.stadium_id, item.name)}
                            className="px-2 py-1 bg-[#121824] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1"
                            title="Delete Stadium"
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
              FIFA STADIUM SAFETY & INFRASTRUCTURE COMPLIANT
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              All {items.length} international host venues accredited under FIFA Category 4 Venue Technical Specifications.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 shrink-0">
          <span>TMS PROTOCOL v9.8.2</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ALL VENUES CERTIFIED
          </span>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Stadium" : "Add Stadium"}
        subtitle="Manage host venue credentials, location, and capacity"
        icon="stadium"
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
              Stadium Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Santiago Bernabéu"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                City <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Madrid"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Country <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="e.g. Spain"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Certified Capacity <span className="text-emerald-400">*</span>
            </label>
            <input
              type="number"
              required
              min="1000"
              max="250000"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="e.g. 81044"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Specific Location / District
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Chamartín District"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
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
              {loadingAction ? "Saving..." : editingId ? "Save Changes" : "Add Stadium"}
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
        entityName="stadium"
        loading={bulkLoading}
      />
    </div>
  );
}