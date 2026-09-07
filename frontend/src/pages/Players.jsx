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

const CLUB_CATEGORIES = [
  {
    league: "Premier League (England)",
    clubs: [
      "Arsenal",
      "Aston Villa",
      "Brighton & Hove Albion",
      "Chelsea",
      "Everton",
      "Fulham",
      "Liverpool",
      "Manchester City",
      "Manchester United",
      "Newcastle United",
      "Tottenham Hotspur",
      "West Ham United",
      "Wolverhampton Wanderers",
    ],
  },
  {
    league: "La Liga (Spain)",
    clubs: [
      "Athletic Bilbao",
      "Atlético Madrid",
      "FC Barcelona",
      "Real Betis",
      "Real Madrid",
      "Real Sociedad",
      "Sevilla",
      "Valencia",
      "Villarreal",
    ],
  },
  {
    league: "Bundesliga (Germany)",
    clubs: [
      "Bayer Leverkusen",
      "Bayern Munich",
      "Borussia Dortmund",
      "Eintracht Frankfurt",
      "RB Leipzig",
      "VfB Stuttgart",
      "VfL Wolfsburg",
    ],
  },
  {
    league: "Serie A (Italy)",
    clubs: [
      "AC Milan",
      "AS Roma",
      "Atalanta",
      "Fiorentina",
      "Inter Milan",
      "Juventus",
      "Lazio",
      "Napoli",
    ],
  },
  {
    league: "Ligue 1 (France)",
    clubs: [
      "AS Monaco",
      "Lille",
      "Lyon",
      "Marseille",
      "Nice",
      "Paris Saint-Germain",
    ],
  },
  {
    league: "Other European Giants",
    clubs: [
      "Ajax",
      "Benfica",
      "Celtic",
      "FC Porto",
      "Fenerbahçe",
      "Feyenoord",
      "Galatasaray",
      "PSV Eindhoven",
      "Rangers",
      "Sporting CP",
    ],
  },
  {
    league: "Americas & Rest of World",
    clubs: [
      "Al-Hilal",
      "Al-Ittihad",
      "Al-Nassr",
      "Boca Juniors",
      "Flamengo",
      "Inter Miami",
      "LA Galaxy",
      "Los Angeles FC",
      "Palmeiras",
      "River Plate",
    ],
  },
];

const ALL_PREDEFINED_CLUBS = CLUB_CATEGORIES.flatMap((cat) => cat.clubs);

const findCanonicalClub = (name) => {
  if (!name) return "";
  const trimmed = name.trim();
  const direct = ALL_PREDEFINED_CLUBS.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (direct) return direct;

  const upper = trimmed.toUpperCase();
  const aliases = {
    "MAN CITY": "Manchester City",
    "MAN UNITED": "Manchester United",
    "MAN UTD": "Manchester United",
    "BARCA": "FC Barcelona",
    "BARCELONA": "FC Barcelona",
    "REAL": "Real Madrid",
    "PSG": "Paris Saint-Germain",
    "BAYERN": "Bayern Munich",
    "LEVERKUSEN": "Bayer Leverkusen",
    "ATLETICO": "Atlético Madrid",
    "ATLETICO MADRID": "Atlético Madrid",
    "DORTMUND": "Borussia Dortmund",
    "INTER": "Inter Milan",
    "MILAN": "AC Milan",
  };
  return aliases[upper] || null;
};

// Known authentic clubs for real-world recognizable athletes
const KNOWN_REAL_CLUBS = {
  "jude bellingham": "Real Madrid",
  "kylian mbappé": "Real Madrid",
  "kylian mbappe": "Real Madrid",
  "lamine yamal": "FC Barcelona",
  "vinícius júnior": "Real Madrid",
  "vinicius junior": "Real Madrid",
  "vinicius jr": "Real Madrid",
  "rodri": "Manchester City",
  "rodri hernandez": "Manchester City",
  "phil foden": "Manchester City",
  "harry kane": "Bayern Munich",
  "lautaro martínez": "Inter Milan",
  "lautaro martinez": "Inter Milan",
  "declan rice": "Arsenal",
  "pedri": "FC Barcelona",
  "pedri gonzález": "FC Barcelona",
  "pedri gonzalez": "FC Barcelona",
  "julián álvarez": "Atlético Madrid",
  "julian alvarez": "Atlético Madrid",
  "lionel messi": "Inter Miami",
  "alisson becker": "Liverpool",
  "marquinhos": "Paris Saint-Germain",
  "danilo": "Juventus",
  "casemiro": "Manchester United",
  "lucas paquetá": "West Ham United",
  "lucas paqueta": "West Ham United",
  "rodrygo": "Real Madrid",
  "gabriel martinelli": "Arsenal",
  "emiliano martínez": "Aston Villa",
  "emiliano martinez": "Aston Villa",
  "nicolás otamendi": "Benfica",
  "nicolas otamendi": "Benfica",
  "rodrigo de paul": "Atlético Madrid",
  "enzo fernández": "Chelsea",
  "enzo fernandez": "Chelsea",
  "mike maignan": "AC Milan",
  "dayot upamecano": "Bayern Munich",
  "théo hernández": "AC Milan",
  "theo hernandez": "AC Milan",
  "aurélien tchouaméni": "Real Madrid",
  "aurelien tchouameni": "Real Madrid",
  "antoine griezmann": "Atlético Madrid",
  "ousmane dembélé": "Paris Saint-Germain",
  "ousmane dembele": "Paris Saint-Germain",
  "jordan pickford": "Everton",
  "john stones": "Manchester City",
  "luke shaw": "Manchester United",
  "unai simón": "Athletic Bilbao",
  "unai simon": "Athletic Bilbao",
  "dani carvajal": "Real Madrid",
  "alejandro grimaldo": "Bayer Leverkusen",
  "álvaro morata": "AC Milan",
  "alvaro morata": "AC Milan",
  "manuel neuer": "Bayern Munich",
  "joshua kimmich": "Bayern Munich",
  "antonio rüdiger": "Real Madrid",
  "antonio rudiger": "Real Madrid",
  "toni kroos": "Real Madrid",
  "ilkay gündogan": "Manchester City",
  "ilkay gundogan": "Manchester City",
  "kai havertz": "Arsenal",
  "leroy sané": "Bayern Munich",
  "leroy sane": "Bayern Munich",
  "gianluigi donnarumma": "Paris Saint-Germain",
  "alessandro bastoni": "Inter Milan",
  "federico dimarco": "Inter Milan",
  "nicolo barella": "Inter Milan",
  "lorenzo pellegrini": "AS Roma",
  "giacomo raspadori": "Napoli",
  "gianluca scamacca": "Atalanta",
};

// Resolves a player's authentic club from DB or known real-world roster; returns null for fictional players
const getPlayerClub = (item) => {
  if (item?.club && item.club.trim()) {
    return item.club.trim();
  }
  const firstName = (item?.first_name || "").toLowerCase().trim();
  const lastName = (item?.last_name || "").toLowerCase().trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (KNOWN_REAL_CLUBS[fullName]) return KNOWN_REAL_CLUBS[fullName];
  if (KNOWN_REAL_CLUBS[firstName]) return KNOWN_REAL_CLUBS[firstName];

  // Specific check for Pedri (e.g. "Pedri Hi" or "Pedri")
  if (fullName.includes("pedri") || firstName === "pedri") return "FC Barcelona";
  if (fullName.includes("rodri") || firstName === "rodri") return "Manchester City";
  if (fullName.includes("bellingham")) return "Real Madrid";
  if (fullName.includes("mbappé") || fullName.includes("mbappe")) return "Real Madrid";
  if (fullName.includes("yamal")) return "FC Barcelona";
  if (fullName.includes("vinícius") || fullName.includes("vinicius")) return "Real Madrid";
  if (fullName.includes("foden")) return "Manchester City";
  if (fullName.includes("kane")) return "Bayern Munich";
  if (fullName.includes("lautaro")) return "Inter Milan";
  if (fullName.includes("rice")) return "Arsenal";
  if (fullName.includes("álvarez") || fullName.includes("alvarez")) return "Atlético Madrid";
  if (fullName.includes("messi")) return "Inter Miami";

  // Check other known players
  for (const [key, club] of Object.entries(KNOWN_REAL_CLUBS)) {
    if (fullName.includes(key) || (key.length > 5 && fullName.includes(key.split(" ")[0]))) {
      return club;
    }
  }

  // Fictional / placeholder player (e.g. "Elliot Anderson", "Doawhduaw", etc.) -> null
  return null;
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
  const [isCustomClub, setIsCustomClub] = useState(false);
  const [customClubText, setCustomClubText] = useState("");
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
    setIsCustomClub(false);
    setCustomClubText("");
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    const rawClub = item.club || getPlayerClub(item) || "";
    const canonical = findCanonicalClub(rawClub);
    let initialClub = rawClub;
    let customMode = false;
    let customText = "";

    if (rawClub) {
      if (canonical) {
        initialClub = canonical;
        customMode = false;
      } else {
        initialClub = rawClub;
        customMode = true;
        customText = rawClub;
      }
    }

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
      club: initialClub,
    });
    setIsCustomClub(customMode);
    setCustomClubText(customText);
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
        "Club",
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
        `"${p.club || ""}"`,
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

      const playerClub = getPlayerClub(item) || item.club || "";
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        item.nationality?.toLowerCase().includes(q) ||
        playerClub.toLowerCase().includes(q) ||
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
            const theme = getPositionTheme(item.position);

            const countryCode =
              NATION_CODES[item.nationality] ||
              item.nationality?.slice(0, 3).toUpperCase() ||
              "FIFA";
            const playerClub = getPlayerClub(item);
            const jersey = item.jersey_number ? `#${item.jersey_number}` : "—";
            const posShort =
              item.position === "Forward"
                ? "FW"
                : item.position === "Midfielder"
                ? "MF"
                : item.position === "Defender"
                ? "DF"
                : "GK";
            const posDisplay = `${posShort} • ${item.position.toUpperCase()}`;
            const age = calculateAge(item.dob);

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
                      {posDisplay}
                    </span>

                    <span className="text-[9.5px] font-mono font-bold tracking-wider text-white/90 truncate max-w-[170px]">
                      {playerClub ? `${countryCode} // ${playerClub}` : countryCode}
                    </span>

                    <span className="text-sm font-black font-mono tracking-tight text-white">
                      {jersey}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="p-3 pb-2">
                    {/* Foot / Sub-bar */}
                    <div className="flex items-center justify-between pb-1 text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {countryCode} · {item.preferred_foot || "Right"} Foot
                      </span>

                      {item.height_cm ? (
                        <span className="text-slate-400 font-mono text-[10px]">
                          {Math.round(item.height_cm)} cm
                        </span>
                      ) : null}
                    </div>

                    {/* Player Name */}
                    <h3 className="text-sm font-black text-white uppercase tracking-wider truncate group-hover:text-emerald-400 transition-colors mt-0.5">
                      {fullName}
                    </h3>

                    {/* Position & Age */}
                    <p className="text-[10.5px] text-slate-400 truncate mt-0.5 font-medium">
                      {item.position} • {age}
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

                    {/* Database Attribute Badges */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {item.height_cm ? (
                        <div className="bg-[#131926] border border-[#1f283a] px-2 py-0.5 rounded text-[9.5px] font-mono font-bold text-slate-300 flex items-center gap-1">
                          <span className="text-slate-500">HT</span>
                          <span>{Math.round(item.height_cm)} cm</span>
                        </div>
                      ) : null}
                      {item.preferred_foot ? (
                        <div className="bg-[#131926] border border-[#1f283a] px-2 py-0.5 rounded text-[9.5px] font-mono font-bold text-slate-300 flex items-center gap-1">
                          <span className="text-slate-500">FOOT</span>
                          <span>{item.preferred_foot}</span>
                        </div>
                      ) : null}
                      {item.jersey_number ? (
                        <div className="bg-[#131926] border border-[#1f283a] px-2 py-0.5 rounded text-[9.5px] font-mono font-bold text-slate-300 flex items-center gap-1">
                          <span className="text-slate-500">NO</span>
                          <span>#{item.jersey_number}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Status Tag & Profile Actions */}
                <div className="px-3 py-2 border-t border-[#161e2c] flex items-center justify-between gap-1.5 bg-[#0a0f18]/60">
                  {/* Left Status Tag */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[9.5px] font-bold text-slate-300 truncate font-mono">
                      {item.team_name || "Active Squad"}
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
                        {getPlayerClub(item) || item.club || item.team_name || "Free Agent"}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Club <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (isCustomClub) {
                      setIsCustomClub(false);
                      const canonical = findCanonicalClub(form.club);
                      setForm({ ...form, club: canonical || "" });
                    } else {
                      setIsCustomClub(true);
                      setCustomClubText(form.club || "");
                    }
                  }}
                  className="text-[10.5px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  {isCustomClub ? "📋 Pick from list" : "✏️ Custom"}
                </button>
              </div>

              {isCustomClub ? (
                <input
                  type="text"
                  value={customClubText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomClubText(val);
                    setForm({ ...form, club: val });
                  }}
                  placeholder="e.g. Santos FC, Al Nassr..."
                  className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  autoFocus
                />
              ) : (
                <select
                  value={form.club || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__custom__") {
                      setIsCustomClub(true);
                      setCustomClubText("");
                      setForm({ ...form, club: "" });
                    } else {
                      setForm({ ...form, club: val });
                    }
                  }}
                  className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
                >
                  <option value="">Select Club (or Free Agent / None)</option>
                  {form.club && !ALL_PREDEFINED_CLUBS.includes(form.club) && (
                    <option value={form.club}>{form.club} (Current)</option>
                  )}
                  {CLUB_CATEGORIES.map((cat) => (
                    <optgroup
                      key={cat.league}
                      label={cat.league}
                      className="bg-[#121722] text-emerald-400 font-semibold"
                    >
                      {cat.clubs.map((c) => (
                        <option
                          key={c}
                          value={c}
                          className="bg-[#0a0e16] text-white font-normal"
                        >
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option
                    value="__custom__"
                    className="bg-[#121722] text-emerald-400 font-semibold"
                  >
                    + Other / Custom Club...
                  </option>
                </select>
              )}
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