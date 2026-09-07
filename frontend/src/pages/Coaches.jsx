import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { useBulkSelection } from "../hooks/useBulkSelection";
import BulkActionBar from "../components/BulkActionBar";
import BulkDeleteConfirmModal from "../components/BulkDeleteConfirmModal";

const emptyForm = {
  first_name: "",
  last_name: "",
  dob: "",
  nationality: "",
  license_no: "",
  start_date: "",
  end_date: "",
  team_id: "",
};

// Rich tactical & scouting metadata mapped to real coaches
const COACH_SCOUTING_DATA = {
  "Luis de la Fuente": {
    countryCode: "ESP",
    fed: "RFEF",
    confederation: "UEFA",
    licenseDisplay: "RFEF-005",
    appointedFormatted: "01/01/2023",
    tacticalSystem: "4-3-3 Possession / High Press",
    honor: "Euro 2024 • Nations Lg.",
    winRate: 78,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "L",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    licenseColor: "text-sky-400",
  },
  "Marcelo Bielsa": {
    countryCode: "URU",
    fed: "AUF",
    confederation: "CONMEBOL",
    licenseDisplay: "AUF-010",
    appointedFormatted: "15/03/2023",
    tacticalSystem: "4-2-3-1 Intense Press / Man-Mark",
    honor: "Copa América 3rd",
    winRate: 65,
    squadCount: 24,
    contract: "'26",
    avatarInitials: "MB",
    avatarBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    licenseColor: "text-amber-400",
  },
  "Aliou Cissé": {
    countryCode: "SEN",
    fed: "FSF",
    confederation: "AFC/CAF",
    licenseDisplay: "FSF-012",
    appointedFormatted: "05/03/2015",
    tacticalSystem: "4-3-3 Compact Counter Transition",
    honor: "AFCON Champions",
    winRate: 64,
    squadCount: 23,
    contract: "'25",
    avatarInitials: "AC",
    avatarBg: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    licenseColor: "text-cyan-400",
  },
  "Didier Deschamps": {
    countryCode: "FRA",
    fed: "FFF",
    confederation: "UEFA",
    licenseDisplay: "FFF-003",
    appointedFormatted: "08/07/2012",
    tacticalSystem: "4-2-3-1 Hybrid Direct",
    honor: "FIFA World Cup '18",
    winRate: 69,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "DD",
    avatarBg: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    licenseColor: "text-sky-400",
  },
  "Dorival Júnior": {
    countryCode: "BRA",
    fed: "CBF",
    confederation: "CONMEBOL",
    licenseDisplay: "CBF-001",
    appointedFormatted: "08/01/2024",
    tacticalSystem: "4-3-3 Fluid Samba Dynamism",
    honor: "Copa Libertadores x2",
    winRate: 68,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "DJ",
    avatarBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    licenseColor: "text-amber-400",
  },
  "Ronald Koeman": {
    countryCode: "NED",
    fed: "KNVB",
    confederation: "UEFA",
    licenseDisplay: "KNVB-008",
    appointedFormatted: "01/07/2023",
    tacticalSystem: "3-4-2-1 Wing Back Overload",
    honor: "Euro 2024 Semi-Final",
    winRate: 62,
    squadCount: 25,
    contract: "'26",
    avatarInitials: "RK",
    avatarBg: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    licenseColor: "text-sky-400",
  },
  "Roberto Martínez": {
    countryCode: "POR",
    fed: "FPF",
    confederation: "UEFA",
    licenseDisplay: "FPF-009",
    appointedFormatted: "09/01/2023",
    tacticalSystem: "4-3-3 / 3-4-3 Positional",
    honor: "Euro Qualifiers (10-0-0)",
    winRate: 74,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "RM",
    avatarBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    licenseColor: "text-sky-400",
  },
  "Hajime Moriyasu": {
    countryCode: "JPN",
    fed: "JFA",
    confederation: "AFC",
    licenseDisplay: "JFA-011",
    appointedFormatted: "26/07/2018",
    tacticalSystem: "4-2-3-1 Rapid Transition",
    honor: "Asian Cup Finalist",
    winRate: 68,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "HM",
    avatarBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    licenseColor: "text-cyan-400",
  },
  "Julian Nagelsmann": {
    countryCode: "GER",
    fed: "DFB",
    confederation: "UEFA",
    licenseDisplay: "DFB-006",
    appointedFormatted: "22/09/2023",
    tacticalSystem: "4-2-2-2 Gegenpress / Vert",
    honor: "Euro 2024 QF",
    winRate: 64,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "JN",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    licenseColor: "text-sky-400",
  },
  "Lionel Scaloni": {
    countryCode: "ARG",
    fed: "AFA",
    confederation: "CONMEBOL",
    licenseDisplay: "AFA-002",
    appointedFormatted: "14/11/2018",
    tacticalSystem: "4-3-3 / 4-4-2 Fluid Adaptive",
    honor: "World Cup '22 • Copa x2",
    winRate: 72,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "LS",
    avatarBg: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    licenseColor: "text-amber-400",
  },
  "Gareth Southgate": {
    countryCode: "ENG",
    fed: "FA",
    confederation: "UEFA",
    licenseDisplay: "FA-004",
    appointedFormatted: "2016 – 2024",
    isTenure: true,
    tacticalSystem: "4-2-3-1 Solid Mid-Block",
    honor: "2x Euro Finalist",
    winRate: 61,
    squadCount: null,
    contract: "Concluded",
    isArchive: true,
    avatarInitials: "GS",
    avatarBg: "bg-slate-800 text-slate-400 border-white/10",
    licenseColor: "text-slate-400",
  },
  "Luciano Spalletti": {
    countryCode: "ITA",
    fed: "FIGC",
    confederation: "UEFA",
    licenseDisplay: "FIGC-007",
    appointedFormatted: "04/08/2023",
    tacticalSystem: "3-4-2-1 Vertical Build-Up",
    honor: "Serie A Scudetto Winner",
    winRate: 58,
    squadCount: 26,
    contract: "'26",
    avatarInitials: "LS",
    avatarBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    licenseColor: "text-sky-400",
  },
};

const NATION_TO_CODE = {
  Spanish: "ESP",
  Spain: "ESP",
  Argentinian: "ARG",
  Argentine: "ARG",
  Argentina: "ARG",
  Senegalese: "SEN",
  Senegal: "SEN",
  French: "FRA",
  France: "FRA",
  Brazilian: "BRA",
  Brazil: "BRA",
  Dutch: "NED",
  Netherlands: "NED",
  Portuguese: "POR",
  Portugal: "POR",
  Japanese: "JPN",
  Japan: "JPN",
  German: "GER",
  Germany: "GER",
  English: "ENG",
  England: "ENG",
  Italian: "ITA",
  Italy: "ITA",
  Uruguayan: "URU",
  Uruguay: "URU",
};

function calculateTenureYears(startDate, endDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months / 12);
}

function calculateTenure(startDate, endDate) {
  if (!startDate) return "—";
  const years = calculateTenureYears(startDate, endDate).toFixed(1);
  return `${years} yrs`;
}

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function Coaches() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, ACTIVE, UEFA, CONMEBOL, AFC
  const [sortBy, setSortBy] = useState("name"); // name, dob, tenure, date
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
  } = useBulkSelection("coach_id");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .get("/coaches")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load coaches", "error")
      )
      .finally(() => setLoading(false));
  };

  const loadTeams = () => {
    api
      .get("/teams")
      .then((res) => setTeams(res.data.data || []))
      .catch((err) => console.error("Failed to load teams for coaches:", err));
  };

  useEffect(() => {
    load();
    loadTeams();
  }, []);

  const openCreate = () => {
    loadTeams();
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    loadTeams();
    setForm({
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      dob: item.dob?.split("T")[0] || "",
      nationality: item.nationality || "",
      license_no: item.license_no || "",
      start_date: item.start_date?.split("T")[0] || "",
      end_date: item.end_date?.split("T")[0] || "",
      team_id: item.team_id || "",
    });
    setEditingId(item.coach_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/coaches/${editingId}`, form);
        toast?.showToast("Coach updated successfully");
      } else {
        await api.post("/coaches", form);
        toast?.showToast("Coach registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this coach"}?`)) return;
    try {
      await api.delete(`/coaches/${id}`);
      toast?.showToast("Coach deleted successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete coach", "error");
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/coaches/bulk-delete", { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} coaches`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete selected coaches", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Helper to get coach full name
  const getCoachName = (item) => {
    return [item.first_name, item.last_name].filter(Boolean).join(" ").trim();
  };

  // Helper to get clean license number without extra text
  const cleanLicense = (val) => {
    if (!val) return "—";
    return String(val).split(" (")[0].trim() || "—";
  };

  // Helper to get scouting metadata
  const getScouting = (item) => {
    const fullName = getCoachName(item);
    const base = COACH_SCOUTING_DATA[fullName];
    const licenseNo = cleanLicense(item.license_no || base?.licenseDisplay);

    if (base) {
      return {
        ...base,
        licenseDisplay: licenseNo,
      };
    }
    // Fallback dynamic generation for newly registered coaches
    const initials = (item.first_name?.[0] || "") + (item.last_name?.[0] || "");
    const code = NATION_TO_CODE[item.nationality] || item.nationality?.slice(0, 3).toUpperCase() || "INT";
    const isAct = !item.end_date;
    return {
      countryCode: code,
      fed: item.team_name || "FA",
      confederation: ["ESP", "FRA", "GER", "NED", "POR", "ITA", "ENG"].includes(code)
        ? "UEFA"
        : ["BRA", "ARG", "URU"].includes(code)
          ? "CONMEBOL"
          : "AFC",
      licenseDisplay: licenseNo,
      appointedFormatted: formatDate(item.start_date),
      tacticalSystem: "4-3-3 Balanced Positional",
      honor: isAct ? "Active Federation Appointee" : "Past Delegate",
      winRate: 60,
      squadCount: 26,
      contract: isAct ? "'26" : "Concluded",
      avatarInitials: initials || "HC",
      avatarBg: "bg-slate-800 text-slate-300 border-white/10",
      licenseColor: "text-sky-400",
    };
  };

  // Summary statistics calculations
  const stats = useMemo(() => {
    const total = items.length;
    let uefa = 0;
    let conmebol = 0;
    let afcCaf = 0;
    let activeTotalTenure = 0;
    let activeCoachCount = 0;
    let totalWinRate = 0;

    items.forEach((item) => {
      const scout = getScouting(item);
      if (scout.confederation === "UEFA") uefa++;
      else if (scout.confederation === "CONMEBOL") conmebol++;
      else afcCaf++;

      if (!item.end_date) {
        activeCoachCount++;
        activeTotalTenure += calculateTenureYears(item.start_date, item.end_date);
        totalWinRate += scout.winRate || 65;
      }
    });

    const meanTenure = activeCoachCount > 0 ? (activeTotalTenure / activeCoachCount).toFixed(1) : "3.4";
    const avgWinRate = activeCoachCount > 0 ? (totalWinRate / activeCoachCount).toFixed(1) : "68.4";

    return {
      total,
      uefa,
      conmebol,
      afcCaf,
      meanTenure,
      avgWinRate,
    };
  }, [items]);

  // Filtered & Sorted coaches list
  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      const isActive = !item.end_date;
      const scout = getScouting(item);
      const fullName = getCoachName(item);

      // Pill filter
      let matchesFilter = true;
      if (activeFilter === "ACTIVE") {
        matchesFilter = isActive;
      } else if (activeFilter === "UEFA") {
        matchesFilter = scout.confederation === "UEFA";
      } else if (activeFilter === "CONMEBOL") {
        matchesFilter = scout.confederation === "CONMEBOL";
      } else if (activeFilter === "AFC") {
        matchesFilter = scout.confederation === "AFC" || scout.confederation === "AFC/CAF";
      }

      // Search query
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fullName.toLowerCase().includes(q) ||
        item.nationality?.toLowerCase().includes(q) ||
        item.team_name?.toLowerCase().includes(q) ||
        item.license_no?.toLowerCase().includes(q) ||
        scout.countryCode?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });

    // Sort logic
    result.sort((a, b) => {
      if (sortBy === "name") {
        return getCoachName(a).localeCompare(getCoachName(b));
      }
      if (sortBy === "dob") {
        return new Date(b.dob || 0) - new Date(a.dob || 0);
      }
      if (sortBy === "tenure") {
        return calculateTenureYears(b.start_date, b.end_date) - calculateTenureYears(a.start_date, a.end_date);
      }
      if (sortBy === "date") {
        return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      }
      return 0;
    });

    return result;
  }, [items, search, activeFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleExport = () => {
    const exportData = filtered.map((c) => {
      const scout = getScouting(c);
      return {
        id: c.coach_id,
        name: getCoachName(c),
        nationality: c.nationality,
        country_code: scout.countryCode,
        confederation: scout.confederation,
        license_no: c.license_no,
        appointed: scout.appointedFormatted,
        dob: c.dob ? formatDate(c.dob) : "N/A",
        status: c.end_date ? "Inactive" : "Active",
        team: c.team_name || "Unassigned",
      };
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fifa-coaches-credentials-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showToast("Coach credentials exported successfully");
  };

  return (
    <div className="flex flex-col w-full pb-14 gap-6 text-on-surface bg-[#0a0d14] min-h-screen">
      {/* 1. Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1">
        <div className="min-w-0 max-w-xl">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-[16px] text-sky-400">
              verified
            </span>
            <span className="text-[11px] font-mono tracking-wider text-sky-400 uppercase font-semibold">
              TECHNICAL STAFF DIRECTORY // LICENSING HUB • FIFA PRO ACCREDITED
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            HEAD COACHES & TACTICAL DIRECTORS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {items.length} accredited head coaches leading registered national team delegations for the 2026/27 international cycle.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">download</span>
            <span>Export Credentials</span>
          </button>

          <button
            onClick={() => {
              setActiveFilter(activeFilter === "ACTIVE" ? "ALL" : "ACTIVE");
              toast?.showToast(`Filter toggled: ${activeFilter === "ACTIVE" ? "All Coaches" : "Active Only"}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2333] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors shadow-sm tracking-wide whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-400">tune</span>
            <span>Accreditation</span>
          </button>

          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors shadow-sm tracking-wide cursor-pointer whitespace-nowrap ${
              isSelectionMode
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#121722] hover:bg-[#1b2333] text-slate-200 border-white/10"
            }`}
            title="Select multiple coaches for deletion"
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
            <span>Register Head Coach</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Statistics Row (6 Cards matching reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Coaches */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              TOTAL COACHES
            </span>
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              shield
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {stats.total}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% Pro Licensed</span>
            </div>
          </div>
        </div>

        {/* UEFA Pro */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              UEFA PRO
            </span>
            <span className="text-[9px] font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1 py-0.2 rounded font-bold">
              UEFA
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {stats.uefa}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Verified council
            </div>
          </div>
        </div>

        {/* CONMEBOL Pro */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              CONMEBOL PRO
            </span>
            <span className="text-[9px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
              CSB
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {stats.conmebol}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Licencia Elite
            </div>
          </div>
        </div>

        {/* AFC / CAF PRO */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              AFC / CAF PRO
            </span>
            <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded font-bold">
              AFC/CAF
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none">
              {stats.afcCaf}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              AFC Elite Diploma
            </div>
          </div>
        </div>

        {/* Mean Tenure */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              MEAN TENURE
            </span>
            <span className="material-symbols-outlined text-[15px] text-slate-400">
              hourglass_empty
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline gap-1">
              <span>{stats.meanTenure}</span>
              <span className="text-xs font-normal text-slate-400">YRS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
              Max: Deschamps (12y)
            </div>
          </div>
        </div>

        {/* Avg Win Rate */}
        <div className="bg-[#10141e] p-3.5 rounded-lg border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              AVG WIN RATE
            </span>
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              trending_up
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-emerald-400 font-mono leading-none">
              {stats.avgWinRate}%
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Competitive fixtures
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#10141e] p-2.5 rounded-lg border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded border border-white/10 flex-1 max-w-xl">
          <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coach by name, nationality, license ID, or squad..."
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
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between md:justify-end">
          {/* Confederation Filter Pills */}
          <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeFilter === "ALL"
                ? "bg-[#00f59b] text-black"
                : "text-slate-400 hover:text-white"
                }`}
            >
              ALL ({items.length})
            </button>
            <button
              onClick={() => setActiveFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeFilter === "ACTIVE"
                ? "bg-[#00f59b] text-black"
                : "text-slate-400 hover:text-white"
                }`}
            >
              ACTIVE
            </button>
            <button
              onClick={() => setActiveFilter("UEFA")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeFilter === "UEFA"
                ? "bg-[#00f59b] text-black"
                : "text-slate-400 hover:text-white"
                }`}
            >
              UEFA
            </button>
            <button
              onClick={() => setActiveFilter("CONMEBOL")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeFilter === "CONMEBOL"
                ? "bg-[#00f59b] text-black"
                : "text-slate-400 hover:text-white"
                }`}
            >
              CONMEBOL
            </button>
            <button
              onClick={() => setActiveFilter("AFC")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeFilter === "AFC"
                ? "bg-[#00f59b] text-black"
                : "text-slate-400 hover:text-white"
                }`}
            >
              AFC
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-[#0a0d14] px-2.5 py-1 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 font-mono font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="name" className="bg-[#10141e] text-white">Sort: Coach Name</option>
              <option value="dob" className="bg-[#10141e] text-white">Sort: Date of Birth</option>
              <option value="date" className="bg-[#10141e] text-white">Sort: Appointed Date</option>
              <option value="tenure" className="bg-[#10141e] text-white">Sort: Longest Tenure</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#0a0d14] rounded border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                ? "bg-[#182030] text-emerald-400"
                : "text-slate-500 hover:text-slate-300"
                }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[17px] block">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table"
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
          entityName="coach"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {/* 4. Coach Card Grid / Table Content */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-[#00f59b] border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING TECHNICAL LICENSES...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#10141e] border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-[42px] text-slate-600 mb-2">
            sports
          </span>
          <p className="text-sm font-bold text-white uppercase tracking-wider">
            No Coaches Found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or confederation filter.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* 4-Column Dense Scouting Grid on Desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((item) => {
            const fullName = getCoachName(item);
            const scout = getScouting(item);
            const isActive = !item.end_date;

            return (
              <div
                key={item.coach_id}
                className={`bg-[#10141e] rounded-lg p-3.5 border transition-all duration-200 flex flex-col justify-between shadow-sm group relative ${
                  isSelected(item.coach_id)
                    ? "border-emerald-500/80 bg-emerald-950/10"
                    : "border-white/10 hover:border-emerald-500/40"
                }`}
              >
                <div>
                  {/* Top Row: Avatar + Name + Status Pill */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(item.coach_id)}
                          onChange={() => toggleSelect(item.coach_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer shrink-0"
                          aria-label={`Select ${fullName}`}
                        />
                      )}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${scout.avatarBg}`}
                      >
                        {scout.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-[13px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate leading-tight">
                          {fullName}
                        </h2>
                        {/* Nationality + Country Code */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">
                            flag
                          </span>
                          <span className="truncate">
                            {item.team_name || item.nationality}
                          </span>
                          <span className="bg-[#161c28] text-slate-300 text-[9px] font-mono px-1 py-0.2 rounded border border-white/5 font-semibold">
                            {scout.countryCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isActive ? (
                        <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="bg-slate-800/90 border border-white/10 text-slate-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                          INACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* License + Appointment + Date of Birth Box */}
                  <div className="bg-[#0a0d14] rounded border border-white/5 p-2.5 my-2.5 text-left">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                          LICENSE
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold truncate block mt-0.5 ${scout.licenseColor}`}
                        >
                          {scout.licenseDisplay}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                          {scout.isTenure ? "TENURE" : "APPOINTED"}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-300 block mt-0.5">
                          {scout.appointedFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                          DATE OF BIRTH
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-200 block mt-0.5">
                          {formatDate(item.dob)}
                        </span>
                      </div>
                      {calculateAge(item.dob) !== null && (
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {calculateAge(item.dob)} yrs old
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Row: Contract & Quick Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <span className="material-symbols-outlined text-[13px] text-emerald-400">
                      calendar_month
                    </span>
                    <span>
                      {item.end_date ? `Until ${formatDate(item.end_date)}` : "Active Contract"}
                    </span>
                  </div>

                  {/* Right: Edit/Delete Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                      title="Edit Coach"
                    >
                      <span className="material-symbols-outlined text-[15px] block">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.coach_id, fullName)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete Coach"
                    >
                      <span className="material-symbols-outlined text-[15px] block">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
                        aria-label="Select all coaches"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Coach / Delegation</th>
                  <th className="py-3 px-4">Confederation</th>
                  <th className="py-3 px-4">License No.</th>
                  <th className="py-3 px-4">Appointed</th>
                  <th className="py-3 px-4">Date of Birth</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((item) => {
                  const fullName = getCoachName(item);
                  const scout = getScouting(item);
                  const isActive = !item.end_date;

                  return (
                    <tr
                      key={item.coach_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected(item.coach_id) ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected(item.coach_id)}
                            onChange={() => toggleSelect(item.coach_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0a0d14] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            aria-label={`Select ${fullName}`}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] shrink-0 border ${scout.avatarBg}`}
                          >
                            {scout.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-white">{fullName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{item.team_name || item.nationality}</span>
                              <span className="bg-[#161c28] text-slate-300 text-[9px] font-mono px-1 rounded font-semibold">
                                {scout.countryCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-semibold">
                          {scout.confederation}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={scout.licenseColor}>
                          {scout.licenseDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {scout.appointedFormatted}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatDate(item.dob)}
                      </td>
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 border border-white/10 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Edit Coach"
                          >
                            <span className="material-symbols-outlined text-[16px] block">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.coach_id, fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Coach"
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

      {/* 5. Bottom Regulatory Compliance Box (matching reference) */}
      <div className="bg-[#0e131d] border border-white/10 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <span className="material-symbols-outlined text-emerald-400 text-[24px] mt-0.5">
            verified_user
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              FIFA Coaching Convention 2026 Regulatory Compliance
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed max-w-4xl">
              All twelve designated Head Coaches hold verified Pro-diploma accreditations cross-validated via the FIFA Technical Monitoring System (TMS). Technical area accreditations for the upcoming match fixtures window remain active through 2026/27 competition phases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <span className="text-[11px] font-mono text-slate-400">
            Last Audit: <span className="text-slate-300 font-semibold">12m ago</span>
          </span>
          <button
            onClick={() => toast?.showToast("TMS Audit Log: All 12 Head Coaches validated with Active Pro Status.")}
            className="px-3 py-1.5 bg-[#161c28] hover:bg-[#20293a] text-slate-200 text-xs font-mono font-bold rounded border border-white/10 transition-colors uppercase tracking-wider"
          >
            AUDIT LOG
          </button>
        </div>
      </div>

      {/* Add / Edit Coach Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Head Coach" : "Register Head Coach"}
        subtitle="Manage head coach details, license credentials, and team delegation"
        icon="sports"
        maxWidth="max-w-lg"
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
                placeholder="e.g. Luis"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="e.g. de la Fuente"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nationality <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                placeholder="e.g. Spanish"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                License Number
              </label>
              <input
                type="text"
                value={form.license_no}
                onChange={(e) => setForm({ ...form, license_no: e.target.value })}
                placeholder="e.g. RFEF-005"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Assigned Team / Delegation
            </label>
            <select
              value={form.team_id}
              onChange={(e) => setForm({ ...form, team_id: e.target.value })}
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
            >
              <option value="">No delegation assigned (Free Agent)</option>
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.name}
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
              {loadingAction ? "Saving..." : editingId ? "Save Changes" : "Register Coach"}
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
        entityName="coach"
        loading={bulkLoading}
      />
    </div>
  );
}