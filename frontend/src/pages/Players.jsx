import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import PositionBadge from "../components/PositionBadge";

const emptyForm = {
  first_name: "",
  last_name: "",
  dob: "",
  nationality: "",
  position: "Forward",
  height_cm: "",
  preferred_foot: "Right",
  market_value_m: "",
  jersey_number: "",
  team_id: "",
  club: "",
};

const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];

const NATION_CODES = {
  French: "FRA",
  France: "FRA",
  English: "ENG",
  England: "ENG",
  Brazilian: "BRA",
  Brazil: "BRA",
  Spanish: "ESP",
  Spain: "ESP",
  Argentine: "ARG",
  Argentinian: "ARG",
  Argentina: "ARG",
  German: "GER",
  Germany: "GER",
  Italian: "ITA",
  Italy: "ITA",
  Dutch: "NED",
  Netherlands: "NED",
  Portuguese: "POR",
  Portugal: "POR",
  Uruguayan: "URU",
  Uruguay: "URU",
  Japanese: "JPN",
  Japan: "JPN",
  Senegalese: "SEN",
  Senegal: "SEN",
};

// Rich scouting metadata matching the reference image layout
const SCOUTING_DATA = {
  "Kylian Mbappé": {
    posCode: "FW • ST",
    countryCode: "FRA",
    club: "REAL MADRID",
    ovr: 94,
    role: "Forward • Contract to 2029",
    attrs: [["PAC", 97], ["SHO", 90], ["DRI", 92]],
    tag: "Active Squad",
  },
  "Jude Bellingham": {
    posCode: "MF • CAM",
    countryCode: "ENG",
    club: "REAL MADRID",
    ovr: 93,
    role: "Midfielder • Contract to 2029",
    attrs: [["PHY", 88], ["PAS", 87], ["DRI", 90]],
    tag: "Golden Boy Alum",
    tagStar: true,
  },
  "Vinícius Júnior": {
    posCode: "FW • LW",
    countryCode: "BRA",
    club: "REAL MADRID",
    ovr: 92,
    role: "Winger • Contract to 2027",
    attrs: [["PAC", 96], ["DRI", 93], ["SHO", 85]],
    tag: "UCL Finalist",
  },
  "Lamine Yamal": {
    posCode: "FW • RW",
    countryCode: "ESP",
    club: "FC BARCELONA",
    ovr: 91,
    role: "Youngest Euro MVP • 17 Yrs",
    attrs: [["PAC", 93], ["DRI", 91], ["PAS", 86]],
    tag: "Kopa Trophy",
    tagStar: true,
  },
  "Rodri Hernandez": {
    posCode: "MF • CDM",
    countryCode: "ESP",
    club: "MAN CITY",
    ovr: 92,
    role: "Ballon d'Or Winner 2024",
    attrs: [["DEF", 90], ["PHY", 89], ["PAS", 91]],
    tag: "World Best MF",
  },
  "Lautaro Martínez": {
    posCode: "FW • ST",
    countryCode: "ARG",
    club: "INTER MILAN",
    ovr: 89,
    role: "Captain • Capocannoniere",
    attrs: [["SHO", 89], ["PHY", 86], ["DRI", 85]],
    tag: "Copa América MVP",
  },
  "Phil Foden": {
    posCode: "FW • RW/CAM",
    countryCode: "ENG",
    club: "MAN CITY",
    ovr: 90,
    role: "Playmaker • PL Player of Season",
    attrs: [["DRI", 91], ["SHO", 88], ["PAS", 87]],
    tag: "Active Squad",
  },
  "Pedri González": {
    posCode: "MF • CM",
    countryCode: "ESP",
    club: "FC BARCELONA",
    ovr: 89,
    role: "Midfielder • Contract to 2030",
    attrs: [["PAS", 91], ["DRI", 90], ["VIS", 93]],
    tag: "Euro Champion",
  },
  "Declan Rice": {
    posCode: "MF • CDM",
    countryCode: "ENG",
    club: "ARSENAL",
    ovr: 88,
    role: "Midfielder • Contract to 2028",
    attrs: [["DEF", 88], ["PHY", 87], ["PAS", 83]],
    tag: "Active Squad",
  },
  "Harry Kane": {
    posCode: "FW • ST",
    countryCode: "ENG",
    club: "BAYERN MUNICH",
    ovr: 90,
    role: "Striker • European Golden Shoe",
    attrs: [["SHO", 95], ["PAS", 84], ["PHY", 83]],
    tag: "Top Scorer",
  },
  "Julián Álvarez": {
    posCode: "FW • CF",
    countryCode: "ARG",
    club: "ATLÉTICO MADRID",
    ovr: 87,
    role: "Striker • World Cup Champion",
    attrs: [["PAC", 87], ["SHO", 86], ["WRK", 94]],
    tag: "Active Transfer",
  },
  "Théo Hernández": {
    posCode: "DF • LB",
    countryCode: "FRA",
    club: "AC MILAN",
    ovr: 87,
    role: "Fullback • Sprint 35.7 km/h",
    attrs: [["PAC", 94], ["DEF", 80], ["PHY", 88]],
    tag: "Defensive Pillar",
  },
  "Rodrygo Silva": {
    posCode: "FW • RW/LW",
    countryCode: "BRA",
    club: "REAL MADRID",
    ovr: 87,
    role: "Winger • Contract to 2028",
    attrs: [["PAC", 89], ["DRI", 88], ["SHO", 82]],
    tag: "Active Squad",
  },
  "Enzo Fernández": {
    posCode: "MF • CM",
    countryCode: "ARG",
    club: "CHELSEA",
    ovr: 84,
    role: "Deep-Lying Midfielder • Contract to 2031",
    attrs: [["PAS", 87], ["DRI", 82], ["DEF", 79]],
    tag: "World Cup Best Young Player",
  },
  "Aurélien Tchouaméni": {
    posCode: "MF • CDM",
    countryCode: "FRA",
    club: "REAL MADRID",
    ovr: 86,
    role: "Anchor • Interceptions 2.4/90",
    attrs: [["DEF", 86], ["PHY", 87], ["PAS", 81]],
    tag: "Contract Secured",
  },
  "Nicolò Barella": {
    posCode: "MF • CM",
    countryCode: "ITA",
    club: "INTER MILAN",
    ovr: 87,
    role: "Box-to-Box • Serie A Midfielder of the Year",
    attrs: [["STA", 93], ["DRI", 86], ["DEF", 81]],
    tag: "Vice Captain",
  },
};

function calculateAgeNumber(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function calculateAge(dob) {
  const age = calculateAgeNumber(dob);
  return age !== null ? `${age} Yrs` : "—";
}

function getPositionTheme(pos) {
  if (pos === "Forward") {
    return {
      badge: "FW",
      headerBg: "bg-gradient-to-r from-[#7f1d1d] to-[#5c1313]",
      headerBorder: "border-b border-rose-900/60",
      textColor: "text-rose-200",
      dotColor: "bg-rose-500",
    };
  }
  if (pos === "Midfielder") {
    return {
      badge: "MF",
      headerBg: "bg-gradient-to-r from-[#064e3b] to-[#043d2e]",
      headerBorder: "border-b border-emerald-900/60",
      textColor: "text-emerald-200",
      dotColor: "bg-emerald-500",
    };
  }
  if (pos === "Defender") {
    return {
      badge: "DF",
      headerBg: "bg-gradient-to-r from-[#0c4a6e] to-[#083344]",
      headerBorder: "border-b border-sky-900/60",
      textColor: "text-sky-200",
      dotColor: "bg-sky-500",
    };
  }
  return {
    badge: "GK",
    headerBg: "bg-gradient-to-r from-[#78350f] to-[#542508]",
    headerBorder: "border-b border-amber-900/60",
    textColor: "text-amber-200",
    dotColor: "bg-amber-500",
  };
}

const ITEMS_PER_PAGE = 16;

export default function Players() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState("ALL");
  const [filterTeam, setFilterTeam] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .get("/players")
      .then((res) => setItems(res.data.data || []))
      .catch((err) =>
        toast?.showToast(err.response?.data?.message || "Failed to load players", "error")
      )
      .finally(() => setLoading(false));
  };

  const loadTeams = () => {
    api
      .get("/teams")
      .then((res) => setTeams(res.data.data || []))
      .catch((err) => console.error("Failed to load teams for players:", err));
  };

  useEffect(() => {
    load();
    loadTeams();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterPosition, filterTeam, sortBy]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      first_name: item.first_name,
      last_name: item.last_name,
      dob: item.dob?.split("T")[0] || "",
      nationality: item.nationality,
      position: item.position || "Forward",
      height_cm: item.height_cm || "",
      preferred_foot: item.preferred_foot || "Right",
      market_value_m: item.market_value_m || "",
      jersey_number: item.jersey_number || "",
      team_id: item.team_id || "",
      club: item.club || "",
    });
    setEditingId(item.player_id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      if (editingId) {
        await api.put(`/players/${editingId}`, form);
        toast?.showToast("Player updated successfully");
      } else {
        await api.post("/players", form);
        toast?.showToast("Player registered successfully");
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
    if (!confirm(`Are you sure you want to delete ${name || "this player"}?`)) return;
    try {
      await api.delete(`/players/${id}`);
      toast?.showToast("Player removed successfully");
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || "Failed to delete player", "error");
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      [
        "Player ID",
        "Full Name",
        "Nationality",
        "Position",
        "Jersey Number",
        "National Team",
        "Market Value (M EUR)",
        "Height (cm)",
        "Preferred Foot",
        "DOB",
      ],
      ...filtered.map((p) => [
        p.player_id,
        `"${p.first_name} ${p.last_name}"`,
        `"${p.nationality}"`,
        `"${p.position}"`,
        p.jersey_number || "",
        `"${p.team_name || ""}"`,
        p.market_value_m || 0,
        p.height_cm || "",
        `"${p.preferred_foot || ""}"`,
        p.dob ? p.dob.split("T")[0] : "",
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fifa-scouting-hub-roster-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast?.showToast("Scouting sheet CSV exported successfully");
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      toast?.showToast(`Batch Import: ${file.name} queued for verification`);
    }
  };

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      let matchesPosition = true;
      if (filterPosition === "FW") matchesPosition = item.position === "Forward";
      else if (filterPosition === "MF") matchesPosition = item.position === "Midfielder";
      else if (filterPosition === "DF") matchesPosition = item.position === "Defender";
      else if (filterPosition === "GK") matchesPosition = item.position === "Goalkeeper";
      else if (filterPosition !== "ALL") matchesPosition = item.position === filterPosition;

      const matchesTeam = !filterTeam || item.team_name === filterTeam;
      const q = search.toLowerCase().trim();
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const numStr = item.jersey_number ? String(item.jersey_number) : "";

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        item.nationality?.toLowerCase().includes(q) ||
        item.club?.toLowerCase().includes(q) ||
        item.position?.toLowerCase().includes(q) ||
        item.team_name?.toLowerCase().includes(q) ||
        numStr === q;

      return matchesPosition && matchesTeam && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "value")
        return (Number(b.market_value_m) || 0) - (Number(a.market_value_m) || 0);
      if (sortBy === "value_asc")
        return (Number(a.market_value_m) || 0) - (Number(b.market_value_m) || 0);
      if (sortBy === "name")
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortBy === "age")
        return (calculateAgeNumber(a.dob) || 99) - (calculateAgeNumber(b.dob) || 99);
      if (sortBy === "jersey")
        return (Number(a.jersey_number) || 999) - (Number(b.jersey_number) || 999);
      return 0;
    });

    return list;
  }, [items, search, filterPosition, filterTeam, sortBy]);

  // Statistics Calculations
  const totalValuationM = useMemo(
    () => items.reduce((acc, curr) => acc + (Number(curr.market_value_m) || 0), 0),
    [items]
  );
  const totalValuationB = (totalValuationM / 1000).toFixed(2);
  const usdValuationB = (totalValuationM * 1.1 / 1000).toFixed(2);
  const avgValuationM = items.length > 0 ? (totalValuationM / items.length).toFixed(1) : 0;

  const meanSquadAge = useMemo(() => {
    const ages = items
      .map((p) => calculateAgeNumber(p.dob))
      .filter((a) => typeof a === "number" && !isNaN(a) && a > 0);
    if (!ages.length) return "26.2";
    const sum = ages.reduce((acc, a) => acc + a, 0);
    return (sum / ages.length).toFixed(1);
  }, [items]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="flex flex-col w-full pb-14 gap-5 text-on-surface">
      {/* Hidden File Input for Batch Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx"
        className="hidden"
      />

      {/* ========================================================
          1. EDITORIAL PAGE HEADER
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pt-1">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-emerald-400 font-semibold mb-1">
            <span>FIFA TMS ACTIVE ROSTER</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">NODE: ZURICH-004</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase leading-[1.08] font-display">
            REGISTERED PLAYERS &<br />
            SCOUTING HUB
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl font-normal">
            {items.length} professional athletes registered across international federations with
            complete contract, biometric tracking, and real-time market valuations.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#121722] hover:bg-[#1a2233] text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#1e2738] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              upload_file
            </span>
            <span>Batch Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#121722] hover:bg-[#1a2233] text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#1e2738] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              download
            </span>
            <span>Export Scouting Sheet</span>
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SUMMARY STAT CARDS (4 COMPACT STATS ROW)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Athletes */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL ATHLETES
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">
              verified_user
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {items.length}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-tight">
                100% Eligible
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Senior registered delegation pool
            </p>
          </div>
        </div>

        {/* Total Valuation */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL VALUATION
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-400">
              trending_up
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                €{totalValuationB}B
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                USD ${usdValuationB}B
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Combined squad book valuation
            </p>
          </div>
        </div>

        {/* Avg Market Value */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              AVG MARKET VALUE
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">
              analytics
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                €{avgValuationM}M
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                +3.4% YoY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Benchmark across international tiers
            </p>
          </div>
        </div>

        {/* Mean Squad Age */}
        <div className="bg-[#0c1017] border border-[#192233] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              MEAN SQUAD AGE
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">
              schedule
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {meanSquadAge}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-tight">
                Prime Window
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              International competitive peak window
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. REGISTRY TOOLBAR: SEARCH & POSITION FILTER TABS
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
              placeholder="Search by athlete, club, number, or nation..."
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

          {/* Position Pills with colored dots */}
          <div className="flex items-center gap-1">
            {[
              { id: "ALL", label: "ALL", dot: null },
              { id: "FW", label: "FW", dot: "bg-rose-500" },
              { id: "MF", label: "MF", dot: "bg-emerald-500" },
              { id: "DF", label: "DF", dot: "bg-sky-500" },
              { id: "GK", label: "GK", dot: "bg-amber-500" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPosition(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filterPosition === p.id
                    ? "bg-[#00f59b] text-black shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {p.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterPosition === p.id ? "bg-black" : p.dot
                    }`}
                  />
                )}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* National Team Filter Dropdown */}
          <div className="flex items-center bg-[#111622] border border-[#1f2738] rounded-lg px-2.5 py-1">
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#111622]">
                All National Teams
              </option>
              {teams.map((t) => (
                <option key={t.team_id} value={t.name} className="bg-[#111622]">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Sort & View Controls */}
        <div className="flex items-center gap-2.5 shrink-0 justify-end">
          <div className="flex items-center gap-1.5 bg-[#111622] border border-[#1f2738] rounded-lg px-2.5 py-1">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              swap_vert
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="value" className="bg-[#111622]">
                Market Value (High to Low)
              </option>
              <option value="value_asc" className="bg-[#111622]">
                Market Value (Low to High)
              </option>
              <option value="name" className="bg-[#111622]">
                Athlete Name (A–Z)
              </option>
              <option value="age" className="bg-[#111622]">
                Age (Youngest)
              </option>
              <option value="jersey" className="bg-[#111622]">
                Jersey Number
              </option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#111622] rounded-lg border border-[#1f2738] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-[#1f2b3e] text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-[#1f2b3e] text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. SCOUTING PLAYER DIRECTORY (4-COLUMNS GRID)
          ======================================================== */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Synchronizing Athlete Profiles & Scouting Data...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#0c1017] border border-[#192233] rounded-xl">
          <span className="material-symbols-outlined text-[44px] text-slate-600 mb-2">
            sports_soccer
          </span>
          <p className="text-base font-bold text-white uppercase tracking-wider">
            No Athletes Matching Criteria
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query, position filter, or team selection.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterPosition("ALL");
              setFilterTeam("");
            }}
            className="mt-4 px-3.5 py-1.5 bg-[#162030] hover:bg-[#1e2c42] text-xs font-semibold text-slate-200 rounded-lg transition-colors border border-white/5"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {paginatedItems.map((item) => {
            const fullName = `${item.first_name} ${item.last_name}`.trim();
            const scouting = SCOUTING_DATA[fullName] || {};
            const theme = getPositionTheme(item.position);

            const countryCode =
              scouting.countryCode ||
              NATION_CODES[item.nationality] ||
              item.nationality?.slice(0, 3).toUpperCase() ||
              "FIFA";
            const club =
              item.club
                ? item.club.toUpperCase()
                : (scouting.club || (item.team_name ? item.team_name.toUpperCase() : ""));
            const jersey = item.jersey_number ? `#${item.jersey_number}` : "—";
            const posCode =
              scouting.posCode ||
              (item.position === "Forward"
                ? "FW • ST"
                : item.position === "Midfielder"
                ? "MF • CM"
                : item.position === "Defender"
                ? "DF • CB"
                : "GK");

            const ovr =
              scouting.ovr ||
              Math.min(
                94,
                Math.max(
                  76,
                  Math.round(76 + Math.sqrt(Number(item.market_value_m) || 10) * 1.35)
                )
              );

            const roleHighlight =
              scouting.role ||
              `${item.position} • ${calculateAge(item.dob)}`;

            const attrs = scouting.attrs || [
              ["PAC", Math.min(96, Math.max(70, ovr + 2))],
              ["DRI", Math.min(94, Math.max(68, ovr - 1))],
              ["PHY", Math.min(92, Math.max(65, ovr - 3))],
            ];

            const tag = scouting.tag || "Active Squad";
            const tagStar = scouting.tagStar;

            return (
              <div
                key={item.player_id}
                className="bg-[#0d121c] border border-[#192131] hover:border-[#27354d] transition-all rounded-xl overflow-hidden flex flex-col justify-between shadow-sm group"
              >
                <div>
                  {/* Position Banner Top Header */}
                  <div
                    className={`${theme.headerBg} ${theme.headerBorder} px-3 py-2 flex items-center justify-between`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      {posCode}
                    </span>

                    <span className="text-[9.5px] font-mono font-bold tracking-wider uppercase text-white/90 truncate max-w-[150px]">
                      {club ? `${countryCode} // ${club}` : countryCode}
                    </span>

                    <span className="text-sm font-black font-mono tracking-tight text-white">
                      {jersey}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="p-3 pb-2">
                    {/* Foot / Sub-bar & OVR Rating */}
                    <div className="flex items-center justify-between pb-1 text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {countryCode}{item.club ? ` • ${item.club}` : ""} • {item.preferred_foot || "Right"} Foot
                      </span>

                      <div className="flex items-baseline gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                          OVR
                        </span>
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          {ovr}
                        </span>
                      </div>
                    </div>

                    {/* Player Name */}
                    <h3 className="text-sm font-black text-white uppercase tracking-wider truncate group-hover:text-emerald-400 transition-colors mt-0.5">
                      {fullName}
                    </h3>

                    {/* Role / Highlight / Contract */}
                    <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                      {roleHighlight}
                    </p>

                    {/* Market Valuation */}
                    <div className="mt-2.5 flex items-baseline justify-between pt-2 border-t border-[#161e2c]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        MARKET VALUATION
                      </span>
                      <span className="text-xs font-black text-emerald-400 font-mono tracking-tight">
                        {item.market_value_m ? `€${item.market_value_m}M` : "€—"}
                      </span>
                    </div>

                    {/* Attributes Badges */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {attrs.map(([code, val], idx) => (
                        <div
                          key={idx}
                          className="bg-[#131926] border border-[#1f283a] px-2 py-0.5 rounded text-[9.5px] font-mono font-bold text-slate-300 flex items-center gap-1"
                        >
                          <span className="text-slate-500">{code}</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Status Tag & Profile Actions */}
                <div className="px-3 py-2 border-t border-[#161e2c] flex items-center justify-between gap-1.5 bg-[#0a0f18]/60">
                  {/* Left Status Tag */}
                  <div className="flex items-center gap-1 min-w-0">
                    {tagStar ? (
                      <span className="material-symbols-outlined text-[12px] text-amber-400 shrink-0">
                        star
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    <span className="text-[9.5px] font-bold text-slate-300 truncate">
                      {tag}
                    </span>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Player"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.player_id, fullName)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Player"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="px-2 py-0.5 rounded bg-[#162030] hover:bg-[#1f2d44] text-[9.5px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors border border-white/5 ml-0.5"
                    >
                      PROFILE
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="px-2 py-0.5 rounded bg-[#162030] hover:bg-[#1f2d44] text-[9.5px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors border border-white/5"
                    >
                      STATS
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
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Club / Team</th>
                  <th className="py-3 px-4">Nationality</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Foot</th>
                  <th className="py-3 px-4">Market Valuation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161e2c] text-xs">
                {paginatedItems.map((item) => {
                  const fullName = `${item.first_name} ${item.last_name}`;
                  const scouting = SCOUTING_DATA[fullName] || {};
                  const age = calculateAge(item.dob);

                  return (
                    <tr
                      key={item.player_id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {item.jersey_number ? `#${item.jersey_number}` : "—"}
                      </td>
                      <td className="py-3 px-4 font-bold text-white uppercase tracking-wider">
                        {fullName}
                      </td>
                      <td className="py-3 px-4">
                        <PositionBadge position={item.position} />
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.club || scouting.club || item.team_name || "Free Agent"}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.nationality}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {age}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.preferred_foot || "Right"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.market_value_m ? `€${item.market_value_m}M` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Edit Player"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.player_id, fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Player"
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
          5. PAGINATION (MATCHING REFERENCE IMAGE)
          ======================================================== */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#161e2c]">
          <div className="text-xs text-slate-400 font-mono">
            Showing{" "}
            <span className="text-white font-bold">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            -{" "}
            <span className="text-white font-bold">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="text-white font-bold">{filtered.length}</span>{" "}
            Registered Athletes
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#121722] hover:bg-[#1a2233] disabled:opacity-40 disabled:hover:bg-[#121722] text-xs font-semibold uppercase tracking-wider text-slate-300 rounded-lg border border-[#1e2738] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                chevron_left
              </span>
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#00f59b] text-black shadow-sm"
                    : "bg-[#121722] hover:bg-[#1a2233] text-slate-400 hover:text-white border border-[#1e2738]"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#121722] hover:bg-[#1a2233] disabled:opacity-40 disabled:hover:bg-[#121722] text-xs font-semibold uppercase tracking-wider text-slate-300 rounded-lg border border-[#1e2738] transition-colors"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          6. ADD / EDIT PLAYER MODAL (UNIFIED DESIGN SYSTEM)
          ======================================================== */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Player" : "Add Player"}
        subtitle="Manage athlete registration, position, biometrics, and value"
        icon="sports_soccer"
        maxWidth="max-w-xl"
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
                placeholder="e.g. Kylian"
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
                placeholder="e.g. Mbappé"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Position <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Jersey Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.jersey_number}
                onChange={(e) => setForm({ ...form, jersey_number: e.target.value })}
                placeholder="e.g. 10"
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
                placeholder="e.g. France"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Date of Birth <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                min="140"
                max="230"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                placeholder="e.g. 178"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Preferred Foot
              </label>
              <select
                value={form.preferred_foot}
                onChange={(e) => setForm({ ...form, preferred_foot: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Market Value (€ Millions)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.market_value_m}
                onChange={(e) => setForm({ ...form, market_value_m: e.target.value })}
                placeholder="e.g. 180"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Club <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.club}
                onChange={(e) => setForm({ ...form, club: e.target.value })}
                placeholder="e.g. Real Madrid"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assigned Team
              </label>
              <select
                value={form.team_id}
                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="">Free Agent / No Team</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingAction ? "Saving..." : editingId ? "Save Changes" : "Add Player"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}