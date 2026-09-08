import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const TEAM_META = {
  Brazil: { code: "BRA", flag: "🇧🇷", confed: "CONMEBOL", color: "from-amber-400/20 to-emerald-500/20" },
  Argentina: { code: "ARG", flag: "🇦🇷", confed: "CONMEBOL", color: "from-sky-400/20 to-white/20" },
  France: { code: "FRA", flag: "🇫🇷", confed: "UEFA", color: "from-blue-600/20 to-red-500/20" },
  England: { code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confed: "UEFA", color: "from-red-500/20 to-white/20" },
  Spain: { code: "ESP", flag: "🇪🇸", confed: "UEFA", color: "from-red-600/20 to-amber-500/20" },
  Portugal: { code: "POR", flag: "🇵🇹", confed: "UEFA", color: "from-red-600/20 to-emerald-600/20" },
  Netherlands: { code: "NED", flag: "🇳🇱", confed: "UEFA", color: "from-orange-500/20 to-blue-500/20" },
  Germany: { code: "GER", flag: "🇩🇪", confed: "UEFA", color: "from-zinc-400/20 to-amber-500/20" },
  Italy: { code: "ITA", flag: "🇮🇹", confed: "UEFA", color: "from-blue-500/20 to-emerald-500/20" },
  Uruguay: { code: "URU", flag: "🇺🇾", confed: "CONMEBOL", color: "from-sky-400/20 to-zinc-400/20" },
  Japan: { code: "JPN", flag: "🇯🇵", confed: "AFC", color: "from-blue-600/20 to-white/20" },
  Senegal: { code: "SEN", flag: "🇸🇳", confed: "CAF", color: "from-emerald-500/20 to-amber-500/20" },
};

function getTeamCode(name) {
  if (!name) return "---";
  return TEAM_META[name]?.code || name.slice(0, 3).toUpperCase();
}

export default function FanExperience() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("matches"); // 'matches' | 'tickets'
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Selected Match for Details & Booking
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [bookingStep, setBookingStep] = useState(null); // 'details' | 'select' | 'confirmed'
  const [ticketType, setTicketType] = useState("Standard"); // 'Standard' | 'Premium'
  const [quantity, setQuantity] = useState(2);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Digital Ticket Pass modal
  const [activePass, setActivePass] = useState(null);

  const userEmail = user?.email || "fan@fifa.org";
  const userName = user?.name || "Alex Silva";

  // Fetch real matches from database
  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await api.get("/matches");
      if (res.data?.success) {
        setMatches(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load matches", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Fetch fan tickets from database
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get(`/tickets?email=${encodeURIComponent(userEmail)}`);
      if (res.data?.success) {
        setTickets(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadMatches();
    loadTickets();
  }, [userEmail]);

  // Pricing calculations (Realistic FIFA Tournament Seating)
  const pricePerTicket = ticketType === "Premium" ? 18500 : 6500;
  const totalPrice = pricePerTicket * quantity;

  // Handle booking submission
  const handleConfirmBooking = async () => {
    if (!selectedMatch) return;
    setIsSubmittingBooking(true);

    try {
      const payload = {
        match_id: selectedMatch.match_id,
        fan_name: userName,
        fan_email: userEmail,
        ticket_type: ticketType,
        quantity: quantity,
        price_per_ticket: pricePerTicket,
        total_amount: totalPrice,
      };

      const res = await api.post("/tickets", payload);
      if (res.data?.success) {
        setConfirmedBooking(res.data.data);
        setBookingStep("confirmed");
        showToast(`Booking ${res.data.data.booking_reference} confirmed!`);
        loadTickets();
      } else {
        showToast(res.data?.error || "Booking failed", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Error confirming booking", "error");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (ticketId, ref) => {
    if (!window.confirm(`Are you sure you want to cancel booking #${ref}? It will be marked as CANCELLED.`)) return;
    try {
      const res = await api.put(`/tickets/${ticketId}/cancel`);
      if (res.data?.success) {
        showToast(`Booking #${ref} has been marked as CANCELLED.`);
        loadTickets();
        if (activePass?.booking_id === ticketId) setActivePass(null);
      }
    } catch {
      showToast("Failed to cancel booking", "error");
    }
  };

  const handleDeleteBooking = async (ticketId, ref) => {
    if (!window.confirm(`Permanently remove booking #${ref} from your records?`)) return;
    try {
      const res = await api.delete(`/tickets/${ticketId}`);
      if (res.data?.success) {
        showToast(`Booking #${ref} deleted permanently.`);
        loadTickets();
        if (activePass?.booking_id === ticketId) setActivePass(null);
      }
    } catch {
      showToast("Failed to delete booking record", "error");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-200 antialiased font-body select-none flex flex-col justify-between">
      {/* ── TOP FAN HEADER ── */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-b border-[#151f33] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand & Mode */}
          <div className="flex items-center gap-4">
            <Link to="/" className="group flex items-center gap-2">
              <span className="font-headline font-black text-2xl tracking-[0.2em] text-white group-hover:text-cyan-400 transition-colors">
                FIFA
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                FAN PASS
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1 ml-4 bg-[#0d1424] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab("matches")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "matches"
                    ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
                <span>Upcoming Matches</span>
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "tickets"
                    ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                <span>My Tickets</span>
                {tickets.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#080d1a] text-cyan-400">
                    {tickets.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Controls: User Profile & Exit */}
          <div className="flex items-center gap-3">
            {/* Switch to Organization link */}
            <Link
              to="/dashboard"
              className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-sky-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Federation Ops</span>
            </Link>

            {/* User Pill */}
            <div className="flex items-center gap-2.5 bg-[#0e1628] pl-2 pr-3 py-1 rounded-full border border-white/10">
              <div className="w-7 h-7 rounded-full bg-cyan-400 text-black font-bold text-xs flex items-center justify-center">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-none">{userName}</span>
                <span className="text-[10px] text-cyan-400 font-mono">Fan Supporter</span>
              </div>
            </div>

            {/* Logout / Exit Button */}
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              title="Sign Out to Portal"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[19px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SUBNAV ── */}
      <div className="sm:hidden flex items-center justify-around bg-[#080d1a] border-b border-[#151f33] py-2 px-4">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === "matches" ? "bg-cyan-400 text-black" : "text-slate-400"
          }`}
        >
          Upcoming Matches
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === "tickets" ? "bg-cyan-400 text-black" : "text-slate-400"
          }`}
        >
          My Tickets ({tickets.length})
        </button>
      </div>

      {/* ── HERO BANNER & LIGHTWEIGHT WIDGETS ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8">
        {/* Compact Hero Headline */}
        <div className="relative rounded-2xl bg-gradient-to-r from-[#0a1122] via-[#0d172e] to-[#080d1a] border border-cyan-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                  WORLD SHOWCASE 2026/27
                </span>
              </div>
              <h1 className="font-headline font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
                DISCOVER MATCHES & BOOK TICKETS
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Official FIFA access for fans worldwide. Secure verified seats at premier host stadiums with real-time digital ticket delivery.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-[#070b16]/80 backdrop-blur-md border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Upcoming Matches</span>
                <span className="text-xl font-headline font-bold text-cyan-400">{matches.length}</span>
              </div>
              <div className="bg-[#070b16]/80 backdrop-blur-md border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">My Bookings</span>
                <span className="text-xl font-headline font-bold text-emerald-400">{tickets.length}</span>
              </div>
              <div className="bg-[#070b16]/80 backdrop-blur-md border border-white/5 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Booking Access</span>
                <span className="text-xs font-mono font-bold text-sky-300 flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  INSTANT PASS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 10: UPCOMING MATCHES ── */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">calendar_month</span>
                <h2 className="font-headline font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
                  Upcoming Matches
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Real-time Database Fixtures ({matches.length})
              </span>
            </div>

            {loadingMatches ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-12">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-48 rounded-xl bg-[#0e1628]/50 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-[#0a0f1d] rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">sports_soccer</span>
                <p className="text-sm font-semibold text-white">No upcoming fixtures found in registry.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matches.map((m) => {
                  const homeCode = getTeamCode(m.home_team);
                  const awayCode = getTeamCode(m.away_team);

                  // Date formatting
                  const d = new Date(m.match_date);
                  const dateFormatted = isNaN(d.getTime())
                    ? m.match_date
                    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

                  return (
                    <div
                      key={m.match_id}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0c1322] to-[#070b16] border border-cyan-500/20 p-5 flex flex-col justify-between hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.2)] transition-all duration-300"
                    >
                      {/* Top Pill / Tournament */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono font-semibold tracking-wider text-cyan-400/90 uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/30">
                          {m.tournament_name || "World Showcase"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Tickets Available
                        </span>
                      </div>

                      {/* Head-to-Head Teams Visual */}
                      <div className="py-3 flex items-center justify-between gap-3 text-center">
                        {/* Home Team */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="font-headline font-bold text-base sm:text-lg text-white tracking-wide truncate max-w-[125px]">
                            {m.home_team}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider mt-0.5">{homeCode}</span>
                        </div>

                        {/* VS Divider */}
                        <div className="flex flex-col items-center justify-center px-1">
                          <span className="text-xs font-mono font-black text-cyan-400 tracking-wider">VS</span>
                          <span className="text-[10px] font-mono text-slate-500 mt-0.5">{m.stage || "Fixture"}</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="font-headline font-bold text-base sm:text-lg text-white tracking-wide truncate max-w-[125px]">
                            {m.away_team}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider mt-0.5">{awayCode}</span>
                        </div>
                      </div>

                      {/* Match Details Footer */}
                      <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col gap-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400 text-[15px]">schedule</span>
                          <span className="font-mono text-slate-200">
                            {dateFormatted} · {m.match_time ? m.match_time.slice(0, 5) : "20:00"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-cyan-400 text-[15px]">stadium</span>
                          <span className="truncate">{m.stadium_name || "Lusail Iconic Stadium"}</span>
                        </div>
                      </div>

                      {/* View Match & Book Button */}
                      <button
                        onClick={() => {
                          setSelectedMatch(m);
                          setBookingStep("details");
                        }}
                        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#111a2f] hover:bg-cyan-400 hover:text-black font-headline font-bold text-xs text-cyan-300 flex items-center justify-center gap-2 transition-all duration-200 border border-cyan-500/30 group-hover:border-cyan-400"
                      >
                        <span>VIEW MATCH</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 15: MY TICKETS ── */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">confirmation_number</span>
                <h2 className="font-headline font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
                  My Booked Tickets
                </h2>
              </div>
              <button
                onClick={loadTickets}
                className="text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Refresh</span>
              </button>
            </div>

            {loadingTickets ? (
              <div className="space-y-3 py-8">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-[#0e1628]/50 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-[#0a0f1d] rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">confirmation_number</span>
                <p className="text-sm font-semibold text-white mb-1">No booked tickets yet.</p>
                <p className="text-xs text-slate-400 mb-4">Browse upcoming fixtures and secure your seat today.</p>
                <button
                  onClick={() => setActiveTab("matches")}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs hover:bg-cyan-300 transition-colors"
                >
                  Explore Upcoming Matches
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.map((t) => {
                  const d = new Date(t.match_date);
                  const dateFormatted = isNaN(d.getTime())
                    ? t.match_date
                    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

                  return (
                    <div
                      key={t.booking_id}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1324] to-[#070b16] border border-cyan-500/30 p-5 flex flex-col justify-between shadow-lg"
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                            BOOKING #{t.booking_reference}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {t.tournament_name || "World Showcase"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            t.status === "CONFIRMED"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                              : "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      {/* Match & Venue Details */}
                      <div className="py-3">
                        <h3 className="font-headline font-bold text-base sm:text-lg text-white mb-1">
                          {t.home_team} <span className="text-cyan-400 font-normal">vs</span> {t.away_team}
                        </h3>
                        <div className="text-xs text-slate-300 font-mono space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400 text-[14px]">calendar_today</span>
                            <span>{dateFormatted} · {t.match_time ? t.match_time.slice(0, 5) : "20:00"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400 text-[14px]">stadium</span>
                            <span>{t.stadium_name || "Lusail Iconic Stadium"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Specs & Price */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white">
                            {t.quantity} × {t.ticket_type}
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            Total: ₹{Number(t.total_amount || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActivePass(t)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-headline font-bold text-xs hover:bg-cyan-300 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[15px]">qr_code</span>
                            <span>VIEW TICKET</span>
                          </button>
                          {t.status === "CONFIRMED" ? (
                            <button
                              onClick={() => handleCancelBooking(t.booking_id, t.booking_reference)}
                              title="Cancel this booking"
                              className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteBooking(t.booking_id, t.booking_reference)}
                              title="Permanently remove from history"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              <span>Delete Record</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── SECTION 11 & 12: MATCH DETAILS & TICKET BOOKING MODAL ── */}
      {selectedMatch && bookingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0a101f] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#0e162a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-headline font-black text-cyan-400">FIFA</span>
                <span className="text-slate-500">/</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {bookingStep === "details"
                    ? "Match Overview"
                    : bookingStep === "select"
                    ? "Book Tickets"
                    : "Booking Confirmed"}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setBookingStep(null);
                  setConfirmedBooking(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: STEP 1: MATCH DETAILS */}
            {bookingStep === "details" && (
              <div className="p-6 space-y-5">
                {/* Team Matchup Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#0c1426] to-[#070b16] border border-cyan-500/20 flex items-center justify-between text-center">
                  <div className="flex-1">
                    <span className="font-headline font-black text-lg sm:text-xl text-white block">
                      {selectedMatch.home_team}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold block mt-0.5">
                      {getTeamCode(selectedMatch.home_team)}
                    </span>
                  </div>
                  <div className="px-3">
                    <span className="text-xs font-mono font-black text-cyan-400">VS</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-headline font-black text-lg sm:text-xl text-white block">
                      {selectedMatch.away_team}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold block mt-0.5">
                      {getTeamCode(selectedMatch.away_team)}
                    </span>
                  </div>
                </div>

                {/* Match Information Table */}
                <div className="space-y-2.5 text-xs font-body">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Tournament</span>
                    <span className="font-semibold text-white">{selectedMatch.tournament_name || "World Showcase"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Date & Kickoff</span>
                    <span className="font-mono text-cyan-300 font-medium">
                      {selectedMatch.match_date} · {selectedMatch.match_time ? selectedMatch.match_time.slice(0, 5) : "20:00"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Stadium</span>
                    <span className="font-semibold text-white">{selectedMatch.stadium_name || "Lusail Iconic Stadium"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Stage</span>
                    <span className="font-mono text-slate-300">{selectedMatch.stage || "Group Stage"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Availability</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Tickets Available Online
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      setBookingStep(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setBookingStep("select")}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-headline font-bold text-xs hover:from-cyan-300 hover:to-sky-300 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2"
                  >
                    <span>BOOK TICKETS</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 2: SELECT TICKET TYPE & QUANTITY */}
            {bookingStep === "select" && (
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <h3 className="font-headline font-bold text-lg text-white">
                    {selectedMatch.home_team} vs {selectedMatch.away_team}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedMatch.match_date} · {selectedMatch.stadium_name || "Lusail Stadium"}
                  </p>
                </div>

                {/* Ticket Types Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-medium text-slate-300">
                    1. Select Ticket Tier
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* STANDARD */}
                    <div
                      onClick={() => setTicketType("Standard")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        ticketType === "Standard"
                          ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                          : "bg-[#0d1527] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Category 2/3</span>
                      <span className="font-headline font-bold text-sm text-white block mt-1">STANDARD</span>
                      <span className="text-xs text-slate-400 block mt-0.5">Grandstand reserved seat</span>
                      <span className="font-mono text-base font-bold text-white block mt-3">₹6,500</span>
                    </div>

                    {/* PREMIUM */}
                    <div
                      onClick={() => setTicketType("Premium")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        ticketType === "Premium"
                          ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                          : "bg-[#0d1527] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-sky-400 font-bold block uppercase">Category 1 / Club</span>
                      <span className="font-headline font-bold text-sm text-white block mt-1">PREMIUM</span>
                      <span className="text-xs text-slate-400 block mt-0.5">Midfield club tier & lounge</span>
                      <span className="font-mono text-base font-bold text-white block mt-3">₹18,500</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-medium text-slate-300">
                    2. Select Quantity
                  </label>
                  <div className="flex items-center justify-between bg-[#0d1527] p-2.5 rounded-xl border border-white/10">
                    <span className="text-xs text-slate-300 font-medium pl-2">Number of Seats</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-[#151f33] text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-base text-white w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(6, quantity + 1))}
                        disabled={quantity >= 6}
                        className="w-8 h-8 rounded-lg bg-[#151f33] text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Ticket Type:</span>
                    <span className="text-white font-semibold">{ticketType}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Quantity:</span>
                    <span className="text-white">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Price per Ticket:</span>
                    <span className="text-white">₹{pricePerTicket.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold">
                    <span className="text-cyan-400">Total:</span>
                    <span className="text-white">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Confirmation CTAs */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setBookingStep("details")}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 text-slate-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isSubmittingBooking}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-headline font-bold text-xs hover:from-cyan-300 hover:to-sky-300 transition-all shadow-[0_0_20px_rgba(56,189,248,0.35)] flex items-center justify-center gap-2"
                  >
                    {isSubmittingBooking ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>CONFIRM BOOKING</span>
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 3: BOOKING CONFIRMED (Section 14) */}
            {bookingStep === "confirmed" && confirmedBooking && (
              <div className="p-6 space-y-5 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <span className="material-symbols-outlined text-3xl">check</span>
                </div>

                <div>
                  <h3 className="font-headline font-black text-2xl text-white tracking-wide uppercase">
                    BOOKING CONFIRMED
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your seats are locked and registered in the FIFA Ticket Registry.
                  </p>
                </div>

                {/* Booking Receipt Summary */}
                <div className="p-4 rounded-xl bg-[#0c1426] border border-cyan-500/20 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400 font-mono">Booking Reference:</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      #{confirmedBooking.booking_reference}
                    </span>
                  </div>

                  <div className="text-sm font-headline font-bold text-white pt-1">
                    {confirmedBooking.home_team || selectedMatch.home_team} vs{" "}
                    {confirmedBooking.away_team || selectedMatch.away_team}
                  </div>

                  <div className="text-slate-300 font-mono text-[11px]">
                    {confirmedBooking.match_date || selectedMatch.match_date} · {confirmedBooking.stadium_name || selectedMatch.stadium_name}
                  </div>

                  <div className="text-slate-300 font-mono text-[11px] pt-1 flex justify-between">
                    <span>
                      {confirmedBooking.quantity} × {confirmedBooking.ticket_type}
                    </span>
                    <span className="text-emerald-400 font-bold text-xs">
                      Total: ₹{Number(confirmedBooking.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Confirmation CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      setBookingStep(null);
                      setActiveTab("tickets");
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 text-black font-headline font-bold text-xs hover:bg-cyan-300 transition-colors shadow-lg"
                  >
                    VIEW MY TICKETS
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      setBookingStep(null);
                      setActiveTab("matches");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 text-slate-300 transition-colors"
                  >
                    BACK TO MATCHES
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DIGITAL TICKET PASS MODAL ── */}
      {activePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#0a1122] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl">
            {/* Top Pass Brand Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-sky-600 px-6 py-4 flex items-center justify-between text-black">
              <div className="flex items-center gap-2">
                <span className="font-headline font-black text-xl tracking-wider">FIFA</span>
                <span className="text-xs font-mono font-bold uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
                  PASS
                </span>
              </div>
              <button
                onClick={() => setActivePass(null)}
                className="text-black/80 hover:text-black p-1 rounded-full hover:bg-black/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Pass Content */}
            <div className="p-6 space-y-4 text-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                  {activePass.tournament_name || "World Showcase"}
                </span>
                <h3 className="font-headline font-bold text-xl text-white mt-1">
                  {activePass.home_team} <span className="text-cyan-400 font-normal">vs</span> {activePass.away_team}
                </h3>
              </div>

              <div className="bg-[#0e162a] p-3 rounded-xl border border-white/5 text-xs font-mono space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date / Time:</span>
                  <span className="text-white">{activePass.match_date} · {activePass.match_time ? activePass.match_time.slice(0, 5) : "20:00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stadium:</span>
                  <span className="text-white truncate max-w-[180px]">{activePass.stadium_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holder:</span>
                  <span className="text-cyan-300 font-semibold">{activePass.fan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seats:</span>
                  <span className="text-white font-bold">{activePass.quantity} × {activePass.ticket_type}</span>
                </div>
              </div>

              {/* Barcode / QR Simulation */}
              <div className="p-4 bg-white rounded-xl text-black flex flex-col items-center">
                {/* SVG Barcode lines */}
                <div className="flex items-center justify-center gap-1 h-12 w-full px-2">
                  {[2, 4, 1, 3, 5, 2, 1, 4, 2, 6, 1, 3, 2, 4, 1, 5, 2, 3, 1, 4, 2].map((w, i) => (
                    <span
                      key={i}
                      className="bg-black inline-block h-full"
                      style={{ width: `${w * 1.6}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold tracking-[0.2em] mt-2">
                  #{activePass.booking_reference}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 font-mono">
                Present this digital pass at turnstiles for contactless NFC / barcode entry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-[#121929] py-4 px-6 text-center text-xs font-mono text-slate-500">
        FIFA Football Experience · Fan Portal · 2026/27 Season
      </footer>
    </div>
  );
}
