import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/axios';
import {
  Plus, Pencil, Trash2, Search, ArrowUpDown, RefreshCw,
  Download, LayoutGrid, List, AlertCircle, Globe2,
  Building2, Layers, Eye, CheckCircle2, Tv, ShieldCheck,
  CheckSquare, X
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useBulkSelection } from '../hooks/useBulkSelection';
import BulkActionBar from '../components/BulkActionBar';
import BulkDeleteConfirmModal from '../components/BulkDeleteConfirmModal';

const emptyForm = { name: '', industry: '', country: '' };
const industries = [
  'Sportswear',
  'Beverages',
  'Aviation',
  'Financial Services',
  'Automotive',
  'Food & Beverage',
  'Conglomerate',
  'Technology',
  'Other'
];

// Rich commercial federation portfolio metadata matching the Stitch design
const SPONSOR_META = {
  'Adidas': {
    code: 'ADS',
    icon: 'checkroom',
    tier: 'FIFA PARTNER · TIER 1 GLOBAL',
    tierType: 'global',
    tierBadgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cycle: '2023 — 2030',
    value: '$380M',
    deliverables: 'Official Match Ball (Al Rihla / Fussballliebe), Referee Kits, Ball Crew Apparel, Official Footwear Provider',
    ledRotation: '18.5%',
    ledSecs: '540s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-23-ADS-01',
    virtualFeeds: 'Global Unicast · EMEA Dynamic',
    headquarters: 'Herzogenaurach, DE',
    venueAlloc: 'Lusail Iconic Stadium · Opening Match, Semifinal 1 & Final'
  },
  'Coca-Cola': {
    code: 'KO',
    icon: 'local_bar',
    tier: 'FIFA PARTNER · TIER 1 GLOBAL',
    tierType: 'global',
    tierBadgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cycle: '2022 — 2030',
    value: '$320M',
    deliverables: 'Exclusive Concession Pouring Rights, Trophy Tour Title Sponsor, Youth Clinic Program',
    ledRotation: '16.0%',
    ledSecs: '480s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-22-CCI-04',
    virtualFeeds: 'Global Unicast · Americas Feed',
    headquarters: 'Atlanta, United States',
    venueAlloc: 'Wembley Stadium · Round of 16 & Quarterfinal 2'
  },
  'Qatar Airways': {
    code: 'QTR',
    icon: 'flight',
    tier: 'FIFA GLOBAL AIRLINE PARTNER',
    tierType: 'global',
    tierBadgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    cycle: '2023 — 2027',
    value: '$250M',
    deliverables: 'VIP Delegation Charters, National Team Flight Corridors, Halftime Destination Showcase',
    ledRotation: '14.5%',
    ledSecs: '420s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-23-QTR-09',
    virtualFeeds: 'Global Broadcast · MENA Feed',
    headquarters: 'Doha, Qatar',
    venueAlloc: 'Maracanã · Quarterfinal 4 & 3rd Place Playoff'
  },
  'Visa': {
    code: 'V',
    icon: 'payments',
    tier: 'FIFA GLOBAL PAYMENT SERVICE',
    tierType: 'global',
    tierBadgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    cycle: '2021 — 2026',
    value: '$240M',
    deliverables: 'Exclusive Cashless Stadium Turnstiles, Official Player of the Match Award, Presale Window Access',
    ledRotation: '15.0%',
    ledSecs: '450s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-21-VSA-02',
    virtualFeeds: 'Global Unicast · LatAm Feed',
    headquarters: 'San Francisco, US',
    venueAlloc: 'MetLife Stadium · Round of 32 & Group Stage Finale'
  },
  'Budweiser': {
    code: 'BUD',
    icon: 'local_bar',
    tier: 'OFFICIAL BEER SUPPORTER',
    tierType: 'supporter',
    tierBadgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    cycle: '2023 — 2026',
    value: '$190M',
    deliverables: 'FIFA Fan Festival Exclusive Beer Garden, Player of the Match Fan Voting Integration',
    ledRotation: '12.0%',
    ledSecs: '360s',
    clearance: '98.5% Venue Compliance',
    complianceStatus: '98.5% VENUE CLEARED',
    refId: 'FIFA-23-ABI-05',
    virtualFeeds: 'NA / CONCACAF · Zero Alc Alt (MEA)',
    headquarters: 'St. Louis, US',
    venueAlloc: 'Estadio Azteca · Round of 16 Group Stage Matches'
  },
  'Hyundai': {
    code: 'HYU',
    icon: 'directions_car',
    tier: 'OFFICIAL MOBILITY PARTNER',
    tierType: 'supporter',
    tierBadgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    cycle: '2023 — 2030',
    value: '$210M',
    deliverables: '650 Official Delegations EV Fleets, Team Buses, Stadium Green Shuttle Corridors',
    ledRotation: '11.5%',
    ledSecs: '345s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-23-HMC-08',
    virtualFeeds: 'Global Broadcast · APAC Priority',
    headquarters: 'Seoul, South Korea',
    venueAlloc: 'Olympic Stadium Berlin · Group Stage & Semifinal 2'
  },
  "McDonald's": {
    code: 'MCD',
    icon: 'restaurant',
    tier: 'REGIONAL SUPPORTER · TOURNAMENT',
    tierType: 'supporter',
    tierBadgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    cycle: '2024 — 2026',
    value: '$135M',
    deliverables: 'Player Escort Program (Child Mascots), Tournament Volunteer Hospitality Program',
    ledRotation: '8.0%',
    ledSecs: '240s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-24-MCD-11',
    virtualFeeds: 'Regional Unicast · North America Feed',
    headquarters: 'Chicago, US',
    venueAlloc: 'Rose Bowl Stadium · Group Stage Roster'
  },
  'Wanda Group': {
    code: 'WAN',
    icon: 'corporate_fare',
    tier: 'FIFA PARTNER · TIER 1 GLOBAL',
    tierType: 'global',
    tierBadgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cycle: '2016 — 2030',
    value: '$310M',
    deliverables: 'FIFA Youth Development Program, Exclusive Chinese Broadcast Virtual Advertising Assets',
    ledRotation: '10.5%',
    ledSecs: '315s',
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: 'FIFA-16-WAN-03',
    virtualFeeds: 'Global Unicast · East Asia Feed',
    headquarters: 'Beijing, China',
    venueAlloc: 'Lusail Iconic Stadium · Round of 16'
  },
};

function getIndustryIcon(industry = '') {
  const ind = industry.toLowerCase();
  if (ind.includes('sport') || ind.includes('apparel')) return 'checkroom';
  if (ind.includes('beverag') || ind.includes('drink') || ind.includes('beer')) return 'local_bar';
  if (ind.includes('aviat') || ind.includes('air')) return 'flight';
  if (ind.includes('financ') || ind.includes('bank') || ind.includes('payment')) return 'payments';
  if (ind.includes('auto') || ind.includes('car') || ind.includes('mobility')) return 'directions_car';
  if (ind.includes('food') || ind.includes('restaur') || ind.includes('quick')) return 'restaurant';
  if (ind.includes('conglom') || ind.includes('media') || ind.includes('corp')) return 'corporate_fare';
  if (ind.includes('tech')) return 'memory';
  return 'domain';
}

function formatCurrency(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
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

function getSponsorDeliverables(industry = "", sponsorName = "") {
  const ind = (industry || "").toLowerCase();
  const name = (sponsorName || "").toLowerCase();
  if (name.includes("adidas") || ind.includes("sport") || ind.includes("apparel")) {
    return "Official Match Ball Provider, Technical Referee Apparel, Ball Crew Kits & Pitchside Footwear Rights";
  }
  if (name.includes("coca") || name.includes("budweiser") || ind.includes("beverag") || ind.includes("drink")) {
    return "Exclusive In-Stadium Pouring Rights, Trophy Tour Title Presentation & Fan Festival Beverage Activation";
  }
  if (name.includes("qatar") || ind.includes("aviat") || ind.includes("flight")) {
    return "Official Airline Carrier, Team Charters, VIP Delegations & Halftime Broadcast Showcase Corridor";
  }
  if (name.includes("visa") || ind.includes("financ") || ind.includes("pay") || ind.includes("bank")) {
    return "Exclusive Cashless Stadium Turnstiles, Official Player of the Match Award & Ticketing Presale";
  }
  if (name.includes("hyundai") || ind.includes("auto") || ind.includes("car")) {
    return "Official Delegations EV Shuttle Fleet, Stadium Mobility Hubs & Eco-Transit Corridors";
  }
  if (name.includes("mcdonald") || ind.includes("food") || ind.includes("restaur")) {
    return "Player Escort Program (Youth Mascots), Volunteer Hospitality & Concessions Access";
  }
  if (name.includes("wanda") || ind.includes("conglom") || ind.includes("media")) {
    return "Youth Football Development Program, International LED Board Rotations & Virtual Feeds";
  }
  return "Sanctioned Stadium LED Board Rotations, Dynamic Broadcast Overlays & Digital Brand Placement";
}

function getSponsorMeta(item) {
  const count = Number(item.tournaments_sponsored || 0);
  const hasTournaments = count > 0;
  const isGlobal = count >= 2;
  const totalVal = Number(item.total_contract_value || 0);
  const formattedVal = hasTournaments ? (totalVal > 0 ? formatCurrency(totalVal) : '$0') : '—';
  const cycleVal = item.term_cycles || (hasTournaments ? (SPONSOR_META[item.name]?.cycle || '2024 — 2028') : '—');

  if (SPONSOR_META[item.name]) {
    return {
      ...SPONSOR_META[item.name],
      name: item.name,
      country: item.country,
      industry: item.industry,
      value: formattedVal,
      cycle: cycleVal,
    };
  }
  const code = item.name.slice(0, 3).toUpperCase();
  const icon = getIndustryIcon(item.industry);
  return {
    code,
    icon,
    tier: isGlobal ? 'FIFA PARTNER · TIER 1 GLOBAL' : 'OFFICIAL COMMERCIAL SUPPORTER',
    tierType: isGlobal ? 'global' : 'supporter',
    tierBadgeClass: isGlobal
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    cycle: cycleVal,
    value: formattedVal,
    deliverables: getSponsorDeliverables(item.industry, item.name),
    ledRotation: hasTournaments ? `${Math.min(20, Math.max(5, count * 5))}%` : '0%',
    ledSecs: hasTournaments ? `${count * 150}s` : '0s',
    clearance: hasTournaments ? '100% Cleared' : 'Pending Activation',
    complianceStatus: hasTournaments ? '100% DELIVERED' : 'UNASSIGNED',
    refId: `FIFA-24-${code}-01`,
    virtualFeeds: hasTournaments ? 'Global Unicast · International Dynamic' : 'No Active Feed',
    headquarters: `${item.country || 'Global HQ'}`,
    venueAlloc: hasTournaments ? 'Sanctioned Tournament Venues' : 'Unallocated'
  };
}

// Complete realistic portfolio dataset fallback matching the 3, 2, 1, 0 tournament distribution
const DEFAULT_SPONSORS = [
  {
    sponsor_id: 1,
    name: 'Adidas',
    industry: 'Sportswear & Equipment',
    country: 'Germany',
    tournaments_sponsored: 3,
    total_contract_value: '280000000.00',
    term_cycles: '2022–2026, 2024–2026, 2026–2030',
    tournament_names: 'FIFA World Cup 2022, UEFA Euro 2024, FIFA World Cup 2026'
  },
  {
    sponsor_id: 2,
    name: 'Coca-Cola',
    industry: 'Beverages',
    country: 'United States',
    tournaments_sponsored: 3,
    total_contract_value: '260000000.00',
    term_cycles: '2022–2030, 2024–2028, 2026–2030',
    tournament_names: 'FIFA World Cup 2022, Copa América 2024, FIFA World Cup 2026'
  },
  {
    sponsor_id: 3,
    name: 'Visa',
    industry: 'Financial Services',
    country: 'United States',
    tournaments_sponsored: 2,
    total_contract_value: '180000000.00',
    term_cycles: '2021–2026, 2024–2028',
    tournament_names: 'FIFA World Cup 2022, FIFA World Cup 2026'
  },
  {
    sponsor_id: 4,
    name: 'Hyundai',
    industry: 'Automotive',
    country: 'South Korea',
    tournaments_sponsored: 0,
    total_contract_value: '0.00',
    term_cycles: null,
    tournament_names: null
  },
  {
    sponsor_id: 5,
    name: 'Qatar Airways',
    industry: 'Aviation',
    country: 'Qatar',
    tournaments_sponsored: 2,
    total_contract_value: '155000000.00',
    term_cycles: '2023–2027, 2024–2027',
    tournament_names: 'FIFA World Cup 2022, UEFA Euro 2024'
  },
  {
    sponsor_id: 6,
    name: 'Budweiser',
    industry: 'Beverages & Hospitality',
    country: 'United States',
    tournaments_sponsored: 2,
    total_contract_value: '105000000.00',
    term_cycles: '2022–2026, 2024–2026',
    tournament_names: 'FIFA World Cup 2022, Copa América 2024'
  },
  {
    sponsor_id: 7,
    name: "McDonald's",
    industry: 'Food & Beverage',
    country: 'United States',
    tournaments_sponsored: 1,
    total_contract_value: '45000000.00',
    term_cycles: '2024–2026',
    tournament_names: 'UEFA Euro 2024'
  },
  {
    sponsor_id: 8,
    name: 'Wanda Group',
    industry: 'Conglomerate & Entertainment',
    country: 'China',
    tournaments_sponsored: 0,
    total_contract_value: '0.00',
    term_cycles: null,
    tournament_names: null
  }
];

const DEFAULT_SPONSOR_TOURNAMENTS = {
  1: [
    { tournament_id: 4, name: 'FIFA World Cup 2026', type: 'World Cup', term_cycle: '2026–2030', contract_value: '120000000.00' },
    { tournament_id: 2, name: 'UEFA Euro 2024', type: 'Continental', term_cycle: '2024–2026', contract_value: '75000000.00' },
    { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup', term_cycle: '2022–2026', contract_value: '85000000.00' }
  ],
  2: [
    { tournament_id: 4, name: 'FIFA World Cup 2026', type: 'World Cup', term_cycle: '2026–2030', contract_value: '110000000.00' },
    { tournament_id: 3, name: 'Copa América 2024', type: 'Continental', term_cycle: '2024–2028', contract_value: '60000000.00' },
    { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup', term_cycle: '2022–2030', contract_value: '90000000.00' }
  ],
  3: [
    { tournament_id: 4, name: 'FIFA World Cup 2026', type: 'World Cup', term_cycle: '2024–2028', contract_value: '100000000.00' },
    { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup', term_cycle: '2021–2026', contract_value: '80000000.00' }
  ],
  4: [],
  5: [
    { tournament_id: 2, name: 'UEFA Euro 2024', type: 'Continental', term_cycle: '2024–2027', contract_value: '65000000.00' },
    { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup', term_cycle: '2023–2027', contract_value: '90000000.00' }
  ],
  6: [
    { tournament_id: 3, name: 'Copa América 2024', type: 'Continental', term_cycle: '2024–2026', contract_value: '45000000.00' },
    { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup', term_cycle: '2022–2026', contract_value: '60000000.00' }
  ],
  7: [
    { tournament_id: 2, name: 'UEFA Euro 2024', type: 'Continental', term_cycle: '2024–2026', contract_value: '45000000.00' }
  ],
  8: []
};

const DEFAULT_TOURNAMENTS = [
  { tournament_id: 1, name: 'FIFA World Cup 2022', type: 'World Cup' },
  { tournament_id: 2, name: 'UEFA Euro 2024', type: 'Continental' },
  { tournament_id: 3, name: 'Copa América 2024', type: 'Continental' },
  { tournament_id: 4, name: 'FIFA World Cup 2026', type: 'World Cup' },
  { tournament_id: 5, name: 'UEFA Nations League 2024-25', type: 'League' }
];

export default function Sponsors() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL', 'FIFA PARTNERS', 'REGIONAL SUPPORTERS', 'AUTOMOTIVE & TECH'
  const [sortBy, setSortBy] = useState('tournaments');

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
  } = useBulkSelection('sponsor_id');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const tableCheckRef = useRef(null);

  // Real sponsored tournaments inspection & assignment modal
  const [selectedSponsorForTournaments, setSelectedSponsorForTournaments] = useState(null);
  const [sponsorTournaments, setSponsorTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [allTournaments, setAllTournaments] = useState([]);
  const [assignTournamentForm, setAssignTournamentForm] = useState({
    tournament_id: '',
    term_cycle: '2024–2026',
    contract_value: '5000000',
  });
  const [editingTournamentContractId, setEditingTournamentContractId] = useState(null);
  const [editingTournamentContractForm, setEditingTournamentContractForm] = useState({
    term_cycle: '',
    contract_value: '',
  });
  const [submittingTournamentContract, setSubmittingTournamentContract] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/sponsors')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems(DEFAULT_SPONSORS);
        }
      })
      .catch(() => {
        setItems(DEFAULT_SPONSORS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/tournaments')
      .then(res => {
        const data = res.data?.data;
        setAllTournaments(Array.isArray(data) && data.length > 0 ? data : DEFAULT_TOURNAMENTS);
      })
      .catch(() => setAllTournaments(DEFAULT_TOURNAMENTS));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      industry: item.industry || '',
      country: item.country || '',
    });
    setEditingId(item.sponsor_id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/sponsors/${editingId}`, form);
        toast?.showToast('Sponsor specifications updated successfully');
      } else {
        await api.post('/sponsors', form);
        toast?.showToast('Commercial partner onboarded successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save sponsor';
      setError(msg);
      toast?.showToast(msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this commercial partner from the portfolio?')) return;
    try {
      await api.delete(`/sponsors/${id}`);
      toast?.showToast('Partner removed successfully');
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Failed to delete partner', 'error');
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post('/sponsors/bulk-delete', { ids: selectedIds });
      toast?.showToast(res.data?.message || `Successfully deleted ${selectedCount} sponsors`);
      clearSelection();
      setShowBulkModal(false);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Failed to delete selected sponsors', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const loadSponsorTournaments = async (sponsorId) => {
    setLoadingTournaments(true);
    try {
      const res = await api.get(`/sponsors/${sponsorId}/tournaments`);
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        setSponsorTournaments(data);
      } else if (DEFAULT_SPONSOR_TOURNAMENTS[sponsorId]) {
        setSponsorTournaments(DEFAULT_SPONSOR_TOURNAMENTS[sponsorId]);
      } else {
        setSponsorTournaments([]);
      }
    } catch {
      if (DEFAULT_SPONSOR_TOURNAMENTS[sponsorId]) {
        setSponsorTournaments(DEFAULT_SPONSOR_TOURNAMENTS[sponsorId]);
      } else {
        setSponsorTournaments([]);
      }
    } finally {
      setLoadingTournaments(false);
    }
  };

  // Inspect real sponsored tournaments from the MySQL database
  const openTournamentsRoster = (item) => {
    setSelectedSponsorForTournaments(item);
    setEditingTournamentContractId(null);
    setAssignTournamentForm({
      tournament_id: '',
      term_cycle: item.term_cycles?.split(',')[0]?.trim() || getSponsorMeta(item).cycle || '2024–2026',
      contract_value: '5000000',
    });
    loadSponsorTournaments(item.sponsor_id);
    if (allTournaments.length === 0) {
      api.get('/tournaments').then(res => setAllTournaments(res.data.data || [])).catch(() => {});
    }
  };

  const handleAssignTournament = async (e) => {
    e.preventDefault();
    if (!assignTournamentForm.tournament_id) {
      toast?.showToast('Please select a tournament', 'error');
      return;
    }
    setSubmittingTournamentContract(true);
    try {
      await api.post(`/sponsors/${selectedSponsorForTournaments.sponsor_id}/tournaments`, {
        tournament_id: Number(assignTournamentForm.tournament_id),
        term_cycle: assignTournamentForm.term_cycle || '2024–2026',
        contract_value: Number(assignTournamentForm.contract_value) || 0,
      });
      toast?.showToast(`Assigned ${selectedSponsorForTournaments.name} to tournament successfully`);
      setAssignTournamentForm({
        tournament_id: '',
        term_cycle: assignTournamentForm.term_cycle,
        contract_value: '5000000',
      });
      await loadSponsorTournaments(selectedSponsorForTournaments.sponsor_id);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Failed to assign tournament partnership', 'error');
    } finally {
      setSubmittingTournamentContract(false);
    }
  };

  const startEditTournamentContract = (t) => {
    setEditingTournamentContractId(t.tournament_id);
    setEditingTournamentContractForm({
      term_cycle: t.term_cycle || '',
      contract_value: t.contract_value || '',
    });
  };

  const handleSaveEditTournamentContract = async (tournamentId) => {
    setSubmittingTournamentContract(true);
    try {
      await api.put(`/sponsors/${selectedSponsorForTournaments.sponsor_id}/tournaments/${tournamentId}`, {
        term_cycle: editingTournamentContractForm.term_cycle,
        contract_value: Number(editingTournamentContractForm.contract_value) || 0,
      });
      toast?.showToast('Tournament contract terms updated successfully');
      setEditingTournamentContractId(null);
      await loadSponsorTournaments(selectedSponsorForTournaments.sponsor_id);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Failed to update tournament contract terms', 'error');
    } finally {
      setSubmittingTournamentContract(false);
    }
  };

  const handleRemoveTournamentContract = async (tournamentId, tournamentName) => {
    if (!confirm(`Remove ${selectedSponsorForTournaments.name} from ${tournamentName}?`)) return;
    try {
      await api.delete(`/sponsors/${selectedSponsorForTournaments.sponsor_id}/tournaments/${tournamentId}`);
      toast?.showToast('Tournament partnership removed successfully');
      await loadSponsorTournaments(selectedSponsorForTournaments.sponsor_id);
      load();
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Failed to remove tournament partnership', 'error');
    }
  };

  const filtered = useMemo(() => {
    let list = items.filter(item => {
      const meta = getSponsorMeta(item);

      // Filter tabs
      if (tierFilter === 'FIFA PARTNERS') {
        if (meta.tierType !== 'global') return false;
      } else if (tierFilter === 'REGIONAL SUPPORTERS') {
        if (meta.tierType !== 'supporter') return false;
      } else if (tierFilter === 'AUTOMOTIVE & TECH') {
        const ind = (item.industry || '').toLowerCase();
        if (!ind.includes('auto') && !ind.includes('tech') && !ind.includes('conglomerate')) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const indMatch = (item.industry || '').toLowerCase().includes(q);
        const countryMatch = (item.country || '').toLowerCase().includes(q);
        const codeMatch = meta.code.toLowerCase().includes(q);
        if (!nameMatch && !indMatch && !countryMatch && !codeMatch) return false;
      }

      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'tournaments') return (Number(b.tournaments_sponsored) || 0) - (Number(a.tournaments_sponsored) || 0);
      if (sortBy === 'value') return (Number(b.total_contract_value) || 0) - (Number(a.total_contract_value) || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'industry') return (a.industry || '').localeCompare(b.industry || '');
      return 0;
    });

    return list;
  }, [items, search, tierFilter, sortBy]);

  const { isAllSelected, isIndeterminate } = getSelectAllState(filtered);

  useEffect(() => {
    if (tableCheckRef.current) {
      tableCheckRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Real KPIs
  const totalCount = items.length;
  const globalPartnersCount = items.filter(i => getSponsorMeta(i).tierType === 'global').length;
  const supportersCount = totalCount - globalPartnersCount;
  const totalTournamentsSponsored = items.reduce((acc, i) => acc + (Number(i.tournaments_sponsored) || 0), 0);
  const totalContractVal = items.reduce((acc, i) => acc + (Number(i.total_contract_value) || 0), 0);

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fifa_sponsorship_portfolio_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast?.showToast('Sponsorship portfolio exported (JSON)');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER & PROTOCOL EYEBROW
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        {/* Eyebrow Protocol Feed */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
            COMMERCIAL & ASSET GOVERNANCE // SPONSORSHIP PORTFOLIO // CONTRACT CYCLE 2024-2027
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-emerald-300 text-[9px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30">
            CYCLE TIER 1-3
          </span>
        </div>

        {/* Heading & Actions Row (Dead-center aligned on heading axis) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight font-display">
            GLOBAL PARTNERS & COMMERCIAL SPONSORS
          </h1>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2334] text-xs font-semibold text-slate-300 hover:text-white border border-[#1f293d] rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Download size={13} className="text-slate-400" />
              <span className="font-mono text-[11px] tracking-wider uppercase">Export (JSON)</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('led-telemetry-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121722] hover:bg-[#1b2334] text-xs font-semibold text-slate-300 hover:text-white border border-[#1f293d] rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Tv size={13} className="text-slate-400" />
              <span className="font-mono text-[11px] tracking-wider uppercase">LED Matrix</span>
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shadow-sm cursor-pointer whitespace-nowrap ${isSelectionMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-[#121722] hover:bg-[#1b2334] text-slate-300 border-[#1f293d]'
                }`}
              title="Select multiple sponsors for deletion"
            >
              {isSelectionMode ? <X size={13} /> : <CheckSquare size={13} />}
              <span className="font-mono text-[11px] tracking-wider uppercase">
                {isSelectionMode ? 'CANCEL' : 'MULTIPLE DELETION'}
              </span>
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold rounded-lg transition-all shadow-md shadow-[#00f59b]/15 active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="tracking-wide uppercase font-mono text-[11px]">ONBOARD PARTNER</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Centralized commercial rights tracking, broadcast LED allocation, contractual deliverable compliance, and multi-tournament brand valuation for FIFA official partners.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP 5 KPI SUMMARY CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Total Partners */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              TOTAL PARTNERS
            </span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white tracking-tight tabular-nums">
              {totalCount}
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
              100% RATIFIED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {globalPartnersCount} Global Partners · {supportersCount} Supporters
          </p>
        </div>

        {/* KPI 2: Aggregate Portfolio Value */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              AGGREGATE VALUE
            </span>
            <span className="material-symbols-outlined text-[14px] text-emerald-400">account_balance</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
              {totalContractVal > 0 ? formatCurrency(totalContractVal) : '$0'}
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
              {totalContractVal > 0 ? 'CONTRACTED' : 'NO CONTRACTS'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {totalTournamentsSponsored} Active Tournament Partnerships
          </p>
        </div>

        {/* KPI 3: Tournaments Sponsored */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              TOURNAMENTS SPONSORED
            </span>
            <span className="material-symbols-outlined text-[14px] text-amber-400">emoji_events</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white tracking-tight tabular-nums">
              {totalTournamentsSponsored} Active
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase">
              CONTRACTED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Activated Roster: Sanctioned Tournaments
          </p>
        </div>

        {/* KPI 4: Broadcast Exposure */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              BROADCAST EXPOSURE
            </span>
            <span className="material-symbols-outlined text-[14px] text-sky-400">tv</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white tracking-tight tabular-nums">
              4.2B
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20 uppercase">
              AUDITED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Min On-Screen LED: 84.6% Avg
          </p>
        </div>

        {/* KPI 5: Asset Clearance */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              ASSET CLEARANCE
            </span>
            <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
              99.2%
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 uppercase">
              0 AMBUSH
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Infractions Logged: CLEARED [0]
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & CONTROL TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0e121b] border border-[#1b2336] rounded-xl p-3.5 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#090d16] px-3 py-2 rounded-lg border border-[#1c2436] flex-1 max-w-md">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by brand, industry, country, or code..."
              className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[10px] text-slate-400 hover:text-white uppercase font-mono">
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Pills (Matches Reference Screenshot!) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${tierFilter === 'ALL'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
                }`}
            >
              ALL ({items.length})
            </button>

            <button
              onClick={() => setTierFilter('FIFA PARTNERS')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${tierFilter === 'FIFA PARTNERS'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
                }`}
            >
              FIFA PARTNERS ({globalPartnersCount})
            </button>

            <button
              onClick={() => setTierFilter('REGIONAL SUPPORTERS')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${tierFilter === 'REGIONAL SUPPORTERS'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
                }`}
            >
              REGIONAL SUPPORTERS ({supportersCount})
            </button>

            <button
              onClick={() => setTierFilter('AUTOMOTIVE & TECH')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${tierFilter === 'AUTOMOTIVE & TECH'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
                }`}
            >
              AUTOMOTIVE & TECH
            </button>
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center gap-1 bg-[#090d16] px-2.5 py-1.5 rounded-lg border border-[#1c2436]">
              <span className="text-[10px] font-mono text-slate-400">SORT BY:</span>
              <select
                className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="tournaments" className="bg-[#10141d] text-white">Tournaments Sponsored</option>
                <option value="value" className="bg-[#10141d] text-white">Contract Value</option>
                <option value="name" className="bg-[#10141d] text-white">Brand Name (A-Z)</option>
                <option value="industry" className="bg-[#10141d] text-white">Industry Sector</option>
              </select>
            </div>

            {/* View Mode Grid/Table Switcher */}
            <div className="flex items-center bg-[#090d16] p-0.5 rounded-lg border border-[#1c2436]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#1e293d] text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                title="Card Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#1e293d] text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                title="LED Telemetry Table View"
              >
                <List size={14} />
              </button>
            </div>

            {/* Multiple Deletion Mode Button */}
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors border cursor-pointer ${isSelectionMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-[#090d16] hover:bg-[#162030] text-slate-300 border-[#1c2436]'
                }`}
              title="Toggle Multiple Deletion mode"
            >
              {isSelectionMode ? <X size={13} /> : <CheckSquare size={13} />}
              <span>{isSelectionMode ? 'CANCEL' : 'MULTIPLE DELETION'}</span>
            </button>
          </div>
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
          entityName="sponsor"
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. GLOBAL PARTNER DIRECTORY CARDS (GRID VIEW)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(item => {
            const meta = getSponsorMeta(item);

            return (
              <div
                key={item.sponsor_id}
                className={`bg-[#0e121b] hover:bg-[#121824] rounded-xl border p-4 flex flex-col justify-between transition-all group shadow-md ${isSelected(item.sponsor_id)
                    ? 'border-emerald-500/80 bg-emerald-950/10'
                    : 'border-[#1b2336] hover:border-[#2b3a55]'
                  }`}
              >
                {/* Card Top: Tier Pill & Match Count */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(item.sponsor_id)}
                          onChange={() => toggleSelect(item.sponsor_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/20 bg-[#090d16] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer shrink-0"
                          aria-label={`Select ${item.name}`}
                        />
                      )}
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${meta.tierBadgeClass}`}>
                        {meta.tier}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-400 tabular-nums">
                      {item.tournaments_sponsored || 0} {item.tournaments_sponsored === 1 ? 'Tournament' : 'Tournaments'}
                    </span>
                  </div>

                  {/* Brand Name, Subtitle & Icon Mark (Includes Industry Icon!) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-white tracking-wider uppercase truncate group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                        {item.industry || 'Commercial Partner'} · {meta.headquarters || item.country || 'Global'}
                      </p>
                    </div>

                    {/* Brand Monogram Mark Box with Industry Icon Accent */}
                    <div className="w-11 h-11 rounded-lg bg-[#141b28] border border-[#232f44] flex flex-col items-center justify-center font-black text-white text-xs tracking-wider shadow-inner shrink-0 group-hover:border-emerald-500/40 transition-colors relative">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">
                        {meta.icon}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 -mt-0.5">
                        {meta.code}
                      </span>
                    </div>
                  </div>

                  {/* Term Cycle & Contract Value */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#182030] text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        TERM CYCLE
                      </span>
                      <span className="font-mono text-white text-xs font-semibold mt-0.5 block truncate" title={meta.cycle}>
                        {meta.cycle}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        CONTRACT VALUE
                      </span>
                      <span className={`font-mono text-sm font-black mt-0.5 block ${meta.value !== '—' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {meta.value}
                      </span>
                    </div>
                  </div>

                  {/* Core Rights & Deliverables */}
                  <div className="mt-3.5 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      CORE RIGHTS & DELIVERABLES
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {meta.deliverables}
                    </p>
                  </div>

                  {/* Activated Tournaments */}
                  <div className="mt-3 pt-2.5 border-t border-[#182030]/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        ACTIVATED TOURNAMENTS
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${Number(item.tournaments_sponsored || 0) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {item.tournaments_sponsored || 0}
                      </span>
                    </div>
                    {item.tournament_names ? (
                      <div className="flex flex-wrap gap-1">
                        {item.tournament_names.split(', ').map(tName => (
                          <span
                            key={tName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131b29] border border-[#1f2d45] text-[10px] font-mono text-emerald-300 font-medium truncate max-w-full"
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span>
                            <span className="truncate">{tName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 italic block">
                        No tournaments assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#182030] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      onClick={() => openTournamentsRoster(item)}
                      className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono font-bold rounded-lg border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
                      title="Manage tournament partnerships, term cycles & contract values"
                    >
                      <Eye size={12} />
                      <span>TOURNAMENTS & ROSTER ({item.tournaments_sponsored || 0})</span>
                    </button>

                    <button
                      onClick={() => openEdit(item)}
                      className="py-1.5 px-2 bg-[#121722] hover:bg-[#1a2335] text-slate-300 hover:text-white text-[11px] font-mono font-bold rounded-lg border border-[#1e273a] transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                      title="Edit partner specifications"
                    >
                      <Pencil size={11} />
                      <span className="hidden sm:inline">EDIT</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(item.sponsor_id)}
                    className="p-1.5 rounded-lg bg-[#121722] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#1e273a] transition-colors"
                    title="Delete partner record"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center bg-[#0e121b] rounded-xl border border-[#1b2336] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">loyalty</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">NO PARTNERS FOUND</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No sponsorship partners match your search filters. Click "+ Onboard Partner" to register an official commercial sponsor.
              </p>
              <button
                onClick={openCreate}
                className="mt-4 px-3.5 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold rounded-lg transition-colors font-mono uppercase"
              >
                + Onboard First Partner
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0e121b] rounded-xl border border-[#1b2336] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121824] border-b border-[#1b2336] text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  {isSelectionMode && (
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        ref={tableCheckRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => toggleSelectAll(filtered)}
                        className="w-4 h-4 rounded border-white/20 bg-[#090d16] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                        aria-label="Select all sponsors"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">BRAND & PARTNER</th>
                  <th className="py-3 px-4">INDUSTRY SECTOR</th>
                  <th className="py-3 px-4">HEADQUARTERS</th>
                  <th className="py-3 px-4">TOURNAMENTS</th>
                  <th className="py-3 px-4">TIER CATEGORY</th>
                  <th className="py-3 px-4">CONTRACT VALUE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030] text-slate-300">
                {filtered.map(item => {
                  const meta = getSponsorMeta(item);

                  return (
                    <tr
                      key={item.sponsor_id}
                      className={`hover:bg-[#121824] transition-colors ${isSelected(item.sponsor_id) ? 'bg-emerald-950/15' : ''
                        }`}
                    >
                      {isSelectionMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected(item.sponsor_id)}
                            onChange={() => toggleSelect(item.sponsor_id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#090d16] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#141b28] border border-[#232f44] flex items-center justify-center font-black text-white text-xs">
                            <span className="material-symbols-outlined text-[15px] text-emerald-400">
                              {meta.icon}
                            </span>
                          </div>
                          <div>
                            <span className="font-black text-white uppercase tracking-wide block">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Ref: {meta.refId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {item.industry || 'Commercial Partner'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {meta.headquarters || item.country || 'Global'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className={`font-bold tabular-nums block ${Number(item.tournaments_sponsored || 0) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {item.tournaments_sponsored || 0} {item.tournaments_sponsored === 1 ? 'Tournament' : 'Tournaments'}
                        </span>
                        {item.tournament_names ? (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs" title={item.tournament_names}>
                            {item.tournament_names}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 block italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${meta.tierBadgeClass}`}>
                          {meta.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-xs">
                        <span className={meta.value !== '—' ? 'text-emerald-400' : 'text-slate-500'}>
                          {meta.value}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openTournamentsRoster(item)}
                            className="p-1.5 rounded-lg bg-[#121722] hover:bg-[#1e273a] text-slate-400 hover:text-emerald-400 border border-[#1e273a] transition-colors"
                            title="Inspect Tournaments & Asset Roster"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg bg-[#121722] hover:bg-[#1e273a] text-slate-400 hover:text-white border border-[#1e273a] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.sponsor_id)}
                            className="p-1.5 rounded-lg bg-[#121722] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#1e273a] transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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



      {/* ─────────────────────────────────────────────────────────────
          7. ADD / EDIT SPONSOR MODAL (100% REAL FIELDS & BACKEND CRUD)
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'EDIT GLOBAL PARTNER SPECIFICATION' : 'ONBOARD COMMERCIAL PARTNER'}
        subtitle="Manage brand partnership profile, official commercial category, and jurisdiction"
        icon="loyalty"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-1">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Company / Brand Name */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
              Brand / Partner Organization <span className="text-emerald-400">*</span>
            </label>
            <input
              required
              placeholder="e.g. Adidas, Coca-Cola, Visa, Qatar Airways"
              className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Industry Sector */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                Industry Sector <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors cursor-pointer"
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">Select industry sector</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                Country / Jurisdiction <span className="text-emerald-400">*</span>
              </label>
              <input
                required
                placeholder="e.g. Germany, United States, Qatar"
                className="w-full bg-[#0a0e16] border border-[#1f2738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#182030]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-[#121722] hover:bg-[#1b2234] text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-white/5 transition-colors uppercase font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-bold rounded-lg transition-all shadow-md shadow-[#00f59b]/20 active:scale-[0.98] uppercase font-mono"
            >
              {editingId ? 'Save Specifications' : 'Confirm Onboarding'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          8. SPONSORED TOURNAMENTS / ASSET ROSTER MODAL
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          8. SPONSORED TOURNAMENTS & CONTRACT TERMS MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedSponsorForTournaments)}
        onClose={() => setSelectedSponsorForTournaments(null)}
        title={selectedSponsorForTournaments ? `${selectedSponsorForTournaments.name.toUpperCase()} — TOURNAMENT CONTRACTS` : 'ACTIVATED TOURNAMENTS'}
        subtitle="Manage official tournament partnerships, manually configure term cycles and contract valuations, and review commercial rights"
        icon="emoji_events"
        maxWidth="max-w-3xl"
      >
        <div className="p-1 space-y-4">
          {/* Partner Summary Banner */}
          {selectedSponsorForTournaments && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0a0e16] border border-[#1b2336] rounded-lg p-3">
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">PARTNER</span>
                <span className="text-xs font-bold text-white truncate block">{selectedSponsorForTournaments.name}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">SECTOR</span>
                <span className="text-xs text-slate-300 truncate block">{selectedSponsorForTournaments.industry || 'Commercial'}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">ACTIVATED TOURNAMENTS</span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">{sponsorTournaments.length} Tournaments</span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">PORTFOLIO VALUATION</span>
                <span className="text-xs font-mono font-bold text-amber-400 block">
                  {formatCurrency(sponsorTournaments.reduce((acc, curr) => acc + (Number(curr.contract_value) || 0), 0))}
                </span>
              </div>
            </div>
          )}

          {/* Form to Assign to a Particular Tournament */}
          <div className="bg-[#0c101a] border border-[#1e273a] rounded-lg p-3.5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">add_circle</span>
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Assign Partner to a Tournament
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Manually determine term cycle & contract value
              </span>
            </div>

            <form onSubmit={handleAssignTournament} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Tournament <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={assignTournamentForm.tournament_id}
                  onChange={(e) => setAssignTournamentForm({ ...assignTournamentForm, tournament_id: e.target.value })}
                  className="w-full bg-[#080b11] border border-[#1f2738] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="" className="bg-[#10141e] text-slate-400">Select Tournament...</option>
                  {allTournaments.map((t) => {
                    const isAssigned = sponsorTournaments.some(st => st.tournament_id === t.tournament_id);
                    return (
                      <option key={t.tournament_id} value={t.tournament_id} className="bg-[#10141e] text-white">
                        {t.name} ({t.type}) {isAssigned ? '✓ Already Linked' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Term Cycle <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024–2026"
                  value={assignTournamentForm.term_cycle}
                  onChange={(e) => setAssignTournamentForm({ ...assignTournamentForm, term_cycle: e.target.value })}
                  className="w-full bg-[#080b11] border border-[#1f2738] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Contract ($ USD) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="45000000"
                  value={assignTournamentForm.contract_value}
                  onChange={(e) => setAssignTournamentForm({ ...assignTournamentForm, contract_value: e.target.value })}
                  className="w-full bg-[#080b11] border border-[#1f2738] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submittingTournamentContract}
                  className="w-full py-1.5 px-3 bg-[#00f59b] hover:bg-[#00d685] text-black text-xs font-mono font-bold uppercase rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Assign</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Tournament Contracts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Active Tournament Commercial Contracts ({sponsorTournaments.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Click Edit to adjust Term Cycle or Contract Value anytime
              </span>
            </div>

            {loadingTournaments ? (
              <div className="py-10 text-center text-xs text-slate-400 font-mono bg-[#0a0e16] border border-[#182030] rounded-lg">
                Loading activated tournament partnerships...
              </div>
            ) : sponsorTournaments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-mono bg-[#0a0e16] border border-[#182030] rounded-lg p-4">
                No tournament partnerships linked to this sponsor yet. Select a tournament above to establish the contract terms.
              </div>
            ) : (
              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {sponsorTournaments.map((t) => {
                  const isEditing = editingTournamentContractId === t.tournament_id;
                  const deliverables = t.deliverables || getSponsorDeliverables(selectedSponsorForTournaments?.industry, selectedSponsorForTournaments?.name);

                  return (
                    <div
                      key={t.tournament_id}
                      className="bg-[#0a0e16] border border-[#1b2336] hover:border-[#283550] transition-colors rounded-lg p-3.5 flex flex-col gap-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold uppercase border border-emerald-500/20">
                              {t.type || 'Tournament'}
                            </span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              {t.format || 'Sanctioned Event'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wide">
                            {t.name}
                          </h4>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Event Window: {formatDate(t.start_date)} — {formatDate(t.end_date)}
                          </div>
                        </div>

                        {/* Contract Details / Inline Edit */}
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2 bg-[#101622] p-2 rounded-lg border border-[#243048]">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 block">Term Cycle</span>
                              <input
                                type="text"
                                value={editingTournamentContractForm.term_cycle}
                                onChange={(e) => setEditingTournamentContractForm({ ...editingTournamentContractForm, term_cycle: e.target.value })}
                                className="w-28 bg-[#080b11] border border-[#2e3d5c] rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-500"
                                placeholder="2024–2026"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 block">Contract ($)</span>
                              <input
                                type="number"
                                value={editingTournamentContractForm.contract_value}
                                onChange={(e) => setEditingTournamentContractForm({ ...editingTournamentContractForm, contract_value: e.target.value })}
                                className="w-28 bg-[#080b11] border border-[#2e3d5c] rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-500"
                                placeholder="Value"
                              />
                            </div>
                            <div className="flex items-center gap-1 mt-3">
                              <button
                                type="button"
                                disabled={submittingTournamentContract}
                                onClick={() => handleSaveEditTournamentContract(t.tournament_id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono font-bold uppercase rounded"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTournamentContractId(null)}
                                className="px-2 py-1 bg-[#182030] hover:bg-[#202b40] text-slate-400 text-[10px] font-mono uppercase rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-left sm:text-right font-mono text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-[#162030] text-emerald-400 font-bold border border-white/10 block mb-1">
                                Term: {t.term_cycle || '2024–2026'}
                              </span>
                              <span className="font-bold text-amber-400 text-xs">
                                {formatCurrency(t.contract_value)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditTournamentContract(t)}
                                className="p-1.5 rounded-lg bg-[#121722] hover:bg-[#1e273a] text-slate-300 hover:text-white border border-[#1e273a] transition-colors"
                                title="Edit Term Cycle & Contract Value"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTournamentContract(t.tournament_id, t.name)}
                                className="p-1.5 rounded-lg bg-[#121722] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#1e273a] transition-colors"
                                title="Unlink Tournament Contract"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Commercial Rights & Deliverables */}
                      <div className="text-[11px] bg-[#06080e] border border-white/5 rounded px-2.5 py-1.5 text-slate-400 flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-slate-500 shrink-0">
                          RIGHTS & ASSETS:
                        </span>
                        <span className="text-slate-300 truncate font-mono text-[10px]">
                          {deliverables}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#182030] flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">
              Changes sync instantly across Zurich HQ tournament portfolios
            </span>
            <button
              onClick={() => setSelectedSponsorForTournaments(null)}
              className="px-4 py-2 bg-[#121722] hover:bg-[#1b2234] text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-white/5 transition-colors font-mono uppercase"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkDelete}
        count={selectedCount}
        entityName="sponsor"
        loading={bulkLoading}
      />
    </div>
  );
}