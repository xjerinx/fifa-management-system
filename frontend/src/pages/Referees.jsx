import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

const emptyForm = {
  first_name: "",
  last_name: "",
  nationality: "",
  badge_no: "",
  role: "Main Referee",
};

const roles = ["Main Referee", "Assistant Referee", "Fourth Official", "VAR Official"];

const ROLE_STYLE = {
  "Main Referee": {
    label: "MAIN REFEREE",
    color: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40",
    icon: "sports",
  },
  "Assistant Referee": {
    label: "ASSISTANT REFEREE",
    color: "bg-amber-950/40 text-amber-400 border border-amber-500/40",
    icon: "flag",
  },
  "Fourth Official": {
    label: "FOURTH OFFICIAL",
    color: "bg-blue-950/40 text-blue-400 border border-blue-500/40",
    icon: "counter_4",
  },
  "VAR Official": {
    label: "VAR OFFICIAL",
    color: "bg-sky-950/40 text-sky-400 border border-sky-500/40",
    icon: "desktop_windows",
  },
};

export default function Referees() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("matches");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  const load = () => {
    setLoading(true);
    api
      .get("/referees")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load referees", "error")
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
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      nationality: item.nationality || "",
      badge_no: item.badge_no || "",
      role: item.role || "Main Referee",
    });
    setEditingId(item.referee_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/referees/${editingId}`, form);
        toast?.showToast("Referee updated successfully");
      } else {
        await api.post("/referees", form);
        toast?.showToast("Referee registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this referee"}?`)) return;
    try {
      await api.delete(`/referees/${id}`);
      toast?.showToast("Referee deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete referee", "error");
    }
  };

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const q = search.toLowerCase().trim();
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        item.nationality?.toLowerCase().includes(q) ||
        item.role?.toLowerCase().includes(q) ||
        item.badge_no?.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "matches")
        return (Number(b.matches_officiated) || 0) - (Number(a.matches_officiated) || 0);
      if (sortBy === "matches_asc")
        return (Number(a.matches_officiated) || 0) - (Number(b.matches_officiated) || 0);
      if (sortBy === "name")
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortBy === "role") return (a.role || "").localeCompare(b.role || "");
      return 0;
    });

    return list;
  }, [items, search, roleFilter, sortBy]);

  // Derived real counts from active data
  const mainCount = items.filter((i) => i.role === "Main Referee").length;
  const varCount = items.filter((i) => i.role === "VAR Official").length;
  const assistantCount = items.filter((i) => i.role === "Assistant Referee").length;
  const fourthCount = items.filter((i) => i.role === "Fourth Official").length;
  const totalMatchesOfficiated = items.reduce(
    (acc, curr) => acc + (Number(curr.matches_officiated) || 0),
    0
  );

  const handleExport = () => {
    const dataStr = JSON.stringify(filtered, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-match-officials-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Match officials registry exported successfully");
  };

  return (
    <div className="flex flex-col w-full pb-14 gap-6 text-on-surface bg-[#0a0d14] min-h-screen">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pt-1">
        <div>
          {/* Eyebrow badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase font-semibold">
              MATCH OFFICIALS REGISTRY // ARBITRATION DIVISION • FIFA ELITE PANEL
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            MATCH OFFICIALS & REFEREES
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            {items.length} FIFA international certified referees and VAR video match officials assigned to competitive international fixtures and tournament assignments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">download</span>
            <span>AUDIT PERFORMANCE</span>
          </button>

          <button
            onClick={() => {
              setRoleFilter(roleFilter === "Main Referee" ? "ALL" : "Main Referee");
              toast?.showToast(`Filtered: ${roleFilter === "Main Referee" ? "All Officials" : "Main Referees Only"}`);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">tune</span>
            <span>ASSIGNMENTS FILTER</span>
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black font-bold text-xs rounded transition-colors shadow-sm tracking-wide"
          >
            <span className="material-symbols-outlined text-[17px] font-bold">add</span>
            <span>+ ADD REFEREE</span>
          </button>
        </div>
      </div>

      {/* 2. Denser Stat Card Row (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Certified Officials */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              CERTIFIED OFFICIALS
            </span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">
              badge
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {items.length}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold mt-1.5">
              FIFA Int'l
            </div>
            {/* Progress sliver */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div className="h-full bg-emerald-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Card 2: Main Referees */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              MAIN REFEREES
            </span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">
              sports
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {mainCount}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Category 1 & Elite
            </div>
            {/* Progress sliver */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div className="h-full bg-teal-400 rounded-full w-[70%]"></div>
            </div>
          </div>
        </div>

        {/* Card 3: VAR Specialists */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              VAR SPECIALISTS
            </span>
            <span className="material-symbols-outlined text-[16px] text-sky-400">
              desktop_windows
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {varCount}
            </div>
            <div className="text-[10px] font-mono text-sky-400 mt-1.5">
              VMO Certified
            </div>
            {/* Progress sliver */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div className="h-full bg-sky-400 rounded-full w-[40%]"></div>
            </div>
          </div>
        </div>

        {/* Card 4: Assistant Referees */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              ASSISTANT REFEREES
            </span>
            <span className="material-symbols-outlined text-[16px] text-amber-400">
              flag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {assistantCount}
            </div>
            <div className="text-[10px] font-mono text-amber-400 mt-1.5">
              FIFA AR Badge
            </div>
            {/* Progress sliver */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div className="h-full bg-amber-400 rounded-full w-[50%]"></div>
            </div>
          </div>
        </div>

        {/* Card 5: Total Matches Officiated */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL MATCHES
            </span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">
              calendar_month
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {totalMatchesOfficiated}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Logged
            </div>
            {/* Progress sliver */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div className="h-full bg-emerald-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search + Filter Bar */}
      <div className="bg-[#10141e] p-2.5 rounded-lg border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded border border-white/10 flex-1 max-w-xl">
          <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search official by name, nationality, FIFA badge..."
            className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full font-medium"
            type="text"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] font-mono bg-[#161c28] hover:bg-[#222b3c] text-slate-300 px-1.5 py-0.5 rounded border border-white/10 transition-colors"
            >
              ESC to clear
            </button>
          ) : (
            <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">ESC to clear</span>
          )}
        </div>

        {/* Filter Pills, Sort Dropdown & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between lg:justify-end">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                roleFilter === "ALL"
                  ? "bg-[#00f59b] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ALL ({items.length})
            </button>
            <button
              onClick={() => setRoleFilter("Main Referee")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                roleFilter === "Main Referee"
                  ? "bg-[#00f59b] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              MAIN REFEREE ({mainCount})
            </button>
            <button
              onClick={() => setRoleFilter("VAR Official")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                roleFilter === "VAR Official"
                  ? "bg-[#00f59b] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              VAR OFFICIAL ({varCount})
            </button>
            <button
              onClick={() => setRoleFilter("Assistant Referee")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                roleFilter === "Assistant Referee"
                  ? "bg-[#00f59b] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ASSISTANT ({assistantCount})
            </button>
            {fourthCount > 0 && (
              <button
                onClick={() => setRoleFilter("Fourth Official")}
                className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                  roleFilter === "Fourth Official"
                    ? "bg-[#00f59b] text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                4TH ({fourthCount})
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-[#0a0d14] px-2.5 py-1 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1 uppercase"
            >
              <option value="matches" className="bg-[#10141e] text-white">SORT: MOST MATCHES</option>
              <option value="matches_asc" className="bg-[#10141e] text-white">SORT: FEWEST MATCHES</option>
              <option value="name" className="bg-[#10141e] text-white">SORT: NAME (A–Z)</option>
              <option value="role" className="bg-[#10141e] text-white">SORT: ROLE</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
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
        </div>
      </div>

      {/* 4. Content Area: 3-Column Grid / Table View */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-[#00f59b] border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING ARBITRATION REGISTRY...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#10141e] border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-[42px] text-slate-600 mb-2">sports</span>
          <p className="text-sm font-bold text-white uppercase tracking-wider">No Match Officials Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or role filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* 3-Column Card Grid matching Target */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const roleInfo = ROLE_STYLE[item.role] || {
              label: item.role ? item.role.toUpperCase() : "OFFICIAL",
              color: "bg-[#262a33] text-slate-300 border-white/10",
              icon: "sports",
            };

            const initials =
              (item.first_name?.[0] || "") + (item.last_name?.[0] || "") || "REF";

            const formattedBadge = item.badge_no
              ? item.badge_no.startsWith("#")
                ? item.badge_no
                : `#${item.badge_no}`
              : "—";

            return (
              <div
                key={item.referee_id}
                className="bg-[#10141e] rounded-lg p-4 border border-white/10 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between shadow-sm group"
              >
                <div>
                  {/* Top Row: Initials Avatar Box + Name & Nationality + Role Badge Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-[#0a0d14] border border-white/10 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {item.first_name} {item.last_name}
                          </h2>
                          <span
                            className="material-symbols-outlined text-[15px] text-emerald-400 shrink-0"
                            title="Certified FIFA Official"
                          >
                            check_circle
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5 truncate">
                          {item.nationality}
                        </div>
                      </div>
                    </div>

                    {/* Role Badge Pill */}
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider ${roleInfo.color}`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* Middle Row: Two-Column Mini Stat Layout */}
                  <div className="bg-[#0a0d14] rounded border border-white/5 p-2.5 my-3">
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-semibold block">
                          BADGE ID
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                          {formattedBadge}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-semibold block">
                          ASSIGNMENTS
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5 block">
                          {item.matches_officiated || 0} Matches
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Minimal Icon Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    FIFA ARBITRATION
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                      title="Edit Referee"
                    >
                      <span className="material-symbols-outlined text-[16px] block">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.referee_id, `${item.first_name} ${item.last_name}`)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete Referee"
                    >
                      <span className="material-symbols-outlined text-[16px] block">delete</span>
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
                  <th className="py-3 px-4">Badge ID</th>
                  <th className="py-3 px-4">Official Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Nationality</th>
                  <th className="py-3 px-4">Matches Officiated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((item) => {
                  const roleInfo = ROLE_STYLE[item.role] || {
                    label: item.role ? item.role.toUpperCase() : "OFFICIAL",
                    color: "bg-[#262a33] text-slate-300 border-white/10",
                  };
                  return (
                    <tr key={item.referee_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {item.badge_no || "—"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.first_name} {item.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.nationality}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {item.matches_officiated || 0} Matches
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Edit Referee"
                          >
                            <span className="material-symbols-outlined text-[16px] block">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.referee_id, `${item.first_name} ${item.last_name}`)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Referee"
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
      )}

      {/* Add / Edit Referee Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Referee" : "Add Referee"}
        subtitle="Manage official credentials, role, and badge number"
        icon="sports"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                First Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="e.g. Szymon"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Last Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="e.g. Marciniak"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Badge Number <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.badge_no}
                onChange={(e) => setForm({ ...form, badge_no: e.target.value })}
                placeholder="e.g. FIFA-REF-001"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nationality <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                placeholder="e.g. Poland"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Arbitration Role <span className="text-emerald-400">*</span>
            </label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
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
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingAction ? "Saving..." : editingId ? "Update Referee" : "Save Referee"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}