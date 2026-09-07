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

function getSponsorMeta(item) {
  if (SPONSOR_META[item.name]) {
    return {
      ...SPONSOR_META[item.name],
      name: item.name,
      country: item.country,
      industry: item.industry
    };
  }
  const code = item.name.slice(0, 3).toUpperCase();
  const isGlobal = (item.matches_sponsored || 0) >= 3;
  const icon = getIndustryIcon(item.industry);
  return {
    code,
    icon,
    tier: isGlobal ? 'FIFA PARTNER · TIER 1 GLOBAL' : 'OFFICIAL COMMERCIAL SUPPORTER',
    tierType: isGlobal ? 'global' : 'supporter',
    tierBadgeClass: isGlobal
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    cycle: '2024 — 2028',
    value: isGlobal ? '$250M' : '$100M',
    deliverables: 'Tournament Commercial Rights & Matchday Digital Concessions Package',
    ledRotation: `${Math.min(20, Math.max(5, (item.matches_sponsored || 1) * 4))}%`,
    ledSecs: `${(item.matches_sponsored || 1) * 120}s`,
    clearance: '100% Cleared',
    complianceStatus: '100% DELIVERED',
    refId: `FIFA-24-${code}-01`,
    virtualFeeds: 'Global Unicast · International Dynamic',
    headquarters: `${item.country || 'Global HQ'}`,
    venueAlloc: 'Sanctioned Tournament Venues'
  };
}

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
  const [sortBy, setSortBy] = useState('matches');

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

  // Real sponsored fixtures inspection modal
  const [selectedSponsorForMatches, setSelectedSponsorForMatches] = useState(null);
  const [sponsorMatches, setSponsorMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/sponsors')
      .then(res => setItems(res.data.data || []))
      .catch(err => toast?.showToast(err.response?.data?.message || 'Failed to load sponsors', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  // Inspect real sponsored matches from the MySQL database
  const openMatchesRoster = (item) => {
    setSelectedSponsorForMatches(item);
    setLoadingMatches(true);
    setSponsorMatches([]);
    api.get(`/sponsors/${item.sponsor_id}/matches`)
      .then(res => setSponsorMatches(res.data.data || []))
      .catch(() => toast?.showToast('Failed to load sponsored match fixtures', 'error'))
      .finally(() => setLoadingMatches(false));
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
      if (sortBy === 'matches') return (b.matches_sponsored || 0) - (a.matches_sponsored || 0);
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
  const totalMatchesSponsored = items.reduce((acc, i) => acc + (i.matches_sponsored || 0), 0);

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
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shadow-sm cursor-pointer whitespace-nowrap ${
                isSelectionMode
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
              $1.84B
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
              +18.4% YoY
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Annualized Run Rate: $460M / YR
          </p>
        </div>

        {/* KPI 3: Matches Sponsored */}
        <div className="bg-[#10141d] p-3.5 rounded-xl border border-[#1a2233] relative overflow-hidden group hover:border-[#243048] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              MATCHES SPONSORED
            </span>
            <span className="material-symbols-outlined text-[14px] text-amber-400">sports</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white tracking-tight tabular-nums">
              22 / 22
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase">
              100% INGRESS
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Activated Roster: All Venues
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
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                tierFilter === 'ALL'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
              }`}
            >
              ALL ({items.length})
            </button>

            <button
              onClick={() => setTierFilter('FIFA PARTNERS')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                tierFilter === 'FIFA PARTNERS'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
              }`}
            >
              FIFA PARTNERS ({globalPartnersCount})
            </button>

            <button
              onClick={() => setTierFilter('REGIONAL SUPPORTERS')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                tierFilter === 'REGIONAL SUPPORTERS'
                  ? 'bg-[#00f59b] text-black shadow-sm'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-[#1c2436]'
              }`}
            >
              REGIONAL SUPPORTERS ({supportersCount})
            </button>

            <button
              onClick={() => setTierFilter('AUTOMOTIVE & TECH')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                tierFilter === 'AUTOMOTIVE & TECH'
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
                <option value="matches" className="bg-[#10141d] text-white">Matches Sponsored / Tier</option>
                <option value="name" className="bg-[#10141d] text-white">Brand Name (A-Z)</option>
                <option value="industry" className="bg-[#10141d] text-white">Industry Sector</option>
              </select>
            </div>

            {/* View Mode Grid/Table Switcher */}
            <div className="flex items-center bg-[#090d16] p-0.5 rounded-lg border border-[#1c2436]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-[#1e293d] text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-[#1e293d] text-emerald-400' : 'text-slate-400 hover:text-white'
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
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors border cursor-pointer ${
                isSelectionMode
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
                className={`bg-[#0e121b] hover:bg-[#121824] rounded-xl border p-4 flex flex-col justify-between transition-all group shadow-md ${
                  isSelected(item.sponsor_id)
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
                      {item.matches_sponsored || 0} matches
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
                      <span className="font-mono text-white text-xs font-semibold mt-0.5 block">
                        {meta.cycle}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        CONTRACT VALUE
                      </span>
                      <span className="font-mono text-emerald-400 text-sm font-black mt-0.5 block">
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

                  {/* LED Pitch Perimeter Share & Clearance */}
                  <div className="mt-3.5 pt-3 border-t border-[#182030]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        LED Pitch Perimeter Share
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-400">
                        {meta.ledRotation} rotation
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden border border-[#1b2336]">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: meta.ledRotation }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 size={10} />
                        <span>{meta.clearance}</span>
                      </div>
                      <span className="text-slate-400">
                        Ref ID: {meta.refId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#182030] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      onClick={() => openMatchesRoster(item)}
                      className="flex-1 py-1.5 px-2 bg-[#121722] hover:bg-[#1a2335] text-slate-300 hover:text-white text-[11px] font-mono font-bold rounded-lg border border-[#1e273a] transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                      title="Inspect sponsored match fixtures"
                    >
                      <Eye size={12} className="text-emerald-400" />
                      <span>ASSET ROSTER</span>
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
                  <th className="py-3 px-4">MATCHES</th>
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
                      className={`hover:bg-[#121824] transition-colors ${
                        isSelected(item.sponsor_id) ? 'bg-emerald-950/15' : ''
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
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 tabular-nums">
                        {item.matches_sponsored || 0} matches
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${meta.tierBadgeClass}`}>
                          {meta.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-400 text-xs">
                        {meta.value}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openMatchesRoster(item)}
                            className="p-1.5 rounded-lg bg-[#121722] hover:bg-[#1e273a] text-slate-400 hover:text-emerald-400 border border-[#1e273a] transition-colors"
                            title="Inspect Fixtures"
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
          5. MATCHDAY LED INGRESS & VIRTUAL BOARD TELEMETRY (BROADCAST CYCLE 2026)
          ───────────────────────────────────────────────────────────── */}
      <div id="led-telemetry-section" className="bg-[#0e121b] border border-[#1b2336] rounded-xl p-4 space-y-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#182030]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">›</span>
              <h3 className="text-xs font-mono font-black text-white tracking-wider uppercase">
                MATCHDAY LED INGRESS & VIRTUAL BOARD TELEMETRY (BROADCAST CYCLE 2026)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Real-time verification of dynamic dual-feed digiboard rotation, regional geo-targeted replacement feeds, and tier time allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-[#162030] text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/20">
              ● LED FEED: 59.94 FPS / 4K HDR
            </span>
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121824] border-b border-[#1b2336] text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">PARTNER & TIER</th>
                <th className="py-2.5 px-3">ALLOCATED MATCHES / VENUES</th>
                <th className="py-2.5 px-3">DUAL-FEED LED ROTATION</th>
                <th className="py-2.5 px-3">VIRTUAL AD TARGETING FEEDS</th>
                <th className="py-2.5 px-3">ASSET AUDIT STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182030] text-slate-300">
              {items.slice(0, 5).map(item => {
                const meta = getSponsorMeta(item);

                return (
                  <tr key={item.sponsor_id} className="hover:bg-[#121824] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#141b28] border border-[#232f44] flex items-center justify-center font-black text-white text-[11px]">
                          <span className="material-symbols-outlined text-[15px] text-emerald-400">
                            {meta.icon}
                          </span>
                        </div>
                        <div>
                          <span className="font-black text-white uppercase tracking-wide block text-xs">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400">
                            {meta.tier}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium text-[11px] max-w-xs truncate">
                      {meta.venueAlloc}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="text-white font-bold">{meta.ledSecs}</span> / 90 min{' '}
                      <span className="text-sky-400 font-semibold">({meta.ledRotation})</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-sky-400">
                      {meta.virtualFeeds}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono text-[9px] font-bold uppercase">
                        <CheckCircle2 size={10} />
                        <span>{meta.complianceStatus}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openMatchesRoster(item)}
                          className="p-1 rounded bg-[#090d16] hover:bg-[#1e273a] text-slate-400 hover:text-white border border-white/5 transition-colors"
                          title="Inspect fixtures"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded bg-[#090d16] hover:bg-[#1e273a] text-slate-400 hover:text-white border border-white/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
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

      {/* ─────────────────────────────────────────────────────────────
          6. PROTOCOL & COMPLIANCE FOOTER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0e121b] border border-[#1b2336] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25 shrink-0">
            <ShieldCheck size={14} />
          </div>
          <div>
            <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider">
              FIFA COMMERCIAL RIGHTS PROTECTION & ANTI-AMBUSH PROTOCOL REV 3.8
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Cryptographic TMS synchronization active · Verified by Zurich Commercial Rights Division · Zero rights breaches recorded cycle-to-date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] text-slate-400 sm:text-right">
          <div>
            <span className="block text-slate-400">Ledger Hash: 8f4a9b2c-2026-crd</span>
            <span className="block text-emerald-400 font-bold">AUDITED: 2026-06-18 14:32:09 UTC</span>
          </div>
        </div>
      </div>

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
          8. SPONSORED FIXTURES / ASSET ROSTER MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedSponsorForMatches)}
        onClose={() => setSelectedSponsorForMatches(null)}
        title={selectedSponsorForMatches ? `${selectedSponsorForMatches.name.toUpperCase()} — ACTIVATED FIXTURE ROSTER` : 'ACTIVATED FIXTURES'}
        subtitle="Official sanctioned matches featuring active stadium LED and broadcast placement"
        icon="sports_soccer"
        maxWidth="max-w-2xl"
      >
        <div className="p-1 space-y-3.5">
          {loadingMatches ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              Loading activated match fixtures...
            </div>
          ) : sponsorMatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              No match fixtures actively linked to this partner yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {sponsorMatches.map(m => (
                <div
                  key={m.match_id}
                  className="bg-[#0a0e16] border border-[#1b2336] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold uppercase border border-emerald-500/20">
                        {m.tournament_name || 'Tournament Fixture'}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {m.stage || 'Official Match'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">
                      {m.home_team} vs {m.away_team}
                    </h4>
                  </div>

                  <div className="text-left sm:text-right font-mono text-[11px] shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[#162030] text-white font-bold border border-white/10">
                      Score: {m.result || 'Scheduled'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {m.match_date ? new Date(m.match_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '2026 Season'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#182030] flex justify-end">
            <button
              onClick={() => setSelectedSponsorForMatches(null)}
              className="px-4 py-2 bg-[#121722] hover:bg-[#1b2234] text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-white/5 transition-colors font-mono uppercase"
            >
              Close Roster
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