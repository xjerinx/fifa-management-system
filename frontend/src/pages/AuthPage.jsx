import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const roleParam = searchParams.get("role") === "org" ? "organization" : "fan";
  const [role, setRole] = useState(roleParam);
  const isFan = role === "fan";

  // Form state
  const [email, setEmail] = useState(isFan ? "fan@fifa.org" : "ops@fifa.org");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync state when URL param changes
  useEffect(() => {
    const r = searchParams.get("role") === "org" ? "organization" : "fan";
    setRole(r);
    setEmail(r === "fan" ? "fan@fifa.org" : "ops@fifa.org");
  }, [searchParams]);

  const switchRole = (newRole) => {
    setRole(newRole);
    setSearchParams({ role: newRole === "organization" ? "org" : "fan" });
    setEmail(newRole === "fan" ? "fan@fifa.org" : "ops@fifa.org");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login({
        email: email.trim(),
        role: role,
        name: fullName || (isFan ? "Alex Silva" : "C. Del Piero"),
      });

      showToast(
        isSignUp
          ? `Welcome to FIFA! Account created for ${email}`
          : `Signed in successfully as ${isFan ? "Fan" : "Federation Official"}`
      );

      setLoading(false);
      if (isFan) {
        navigate("/fan");
      } else {
        navigate("/dashboard");
      }
    }, 450);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      login({
        email: isFan ? "fan.google@fifa.org" : "ops.google@fifa.org",
        role: role,
        name: isFan ? "Google Fan User" : "Commissioner Google",
      });
      showToast("Google authentication verified");
      setLoading(false);
      if (isFan) navigate("/fan");
      else navigate("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-white flex flex-col lg:flex-row select-none">
      {/* ── LEFT SIDE: CINEMATIC VISUAL PANEL ── */}
      <div className="relative w-full lg:w-[52%] xl:w-[55%] min-h-[380px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-12">
        {/* Background Visual Asset */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{
            backgroundImage: `url('${
              isFan ? "/assets/fan-player-stadium.jpg" : "/assets/org-manager-tactics.jpg"
            }')`,
          }}
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-[#050811]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#050811]/20 to-[#050811]" />
        
        {/* Subtle Brand Lighting Glow */}
        <div
          className={`absolute bottom-10 left-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ${
            isFan ? "bg-cyan-500/20" : "bg-sky-600/20"
          }`}
        />

        {/* Top Header of Visual Panel */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-slate-300 hover:text-cyan-400 transition-colors bg-[#080d1a]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Home</span>
          </Link>

          {/* Quick toggle between Fan & Org view */}
          <div className="flex items-center gap-1 bg-[#090e1c]/80 backdrop-blur-md border border-white/10 rounded-full p-1 text-xs">
            <button
              onClick={() => switchRole("fan")}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                isFan
                  ? "bg-cyan-400 text-black font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Fan View
            </button>
            <button
              onClick={() => switchRole("organization")}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                !isFan
                  ? "bg-sky-400 text-black font-bold shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Organization View
            </button>
          </div>
        </div>

        {/* Bottom Editorial Content of Visual Panel */}
        <div className="relative z-10 max-w-xl space-y-4 pt-16 lg:pt-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-cyan-400 uppercase font-bold">
              {isFan ? "FIFA FOOTBALL EXPERIENCE" : "FIFA FOOTBALL MANAGEMENT"}
            </span>
          </div>

          <h2 className="font-headline font-black text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[1.05]">
            {isFan ? (
              <>
                <span className="text-white block">MORE THAN</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 block drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]">
                  JUST A GAME
                </span>
              </>
            ) : (
              <>
                <span className="text-white block">MANAGE TODAY.</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 block drop-shadow-[0_0_25px_rgba(14,165,233,0.3)]">
                  BUILD TOMORROW.
                </span>
              </>
            )}
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md">
            {isFan
              ? "Connect with matches, teams, players and the football community. Be part of a global platform built for fans."
              : "Powering football organizations with the tools to manage teams, players, coaches, matches and tournaments — all in one place."}
          </p>

          {/* Feature indicators */}
          <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 font-mono">
            {isFan ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">sports_soccer</span>
                  <span>Watch Matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">confirmation_number</span>
                  <span>Get Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">groups</span>
                  <span>Join Community</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[18px]">shield</span>
                  <span>Manage Teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[18px]">person</span>
                  <span>Track Players</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[18px]">strategy</span>
                  <span>Plan Tactics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[18px]">emoji_events</span>
                  <span>Tournaments</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: CLEAN AUTHENTICATION PANEL ── */}
      <div className="relative w-full lg:w-[48%] xl:w-[45%] flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#070b16] border-t lg:border-t-0 lg:border-l border-[#141b2c]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md space-y-7">
          {/* FIFA Brand Mark */}
          <div className="flex items-center justify-between">
            <Link to="/" className="font-headline font-black text-3xl tracking-[0.2em] text-white hover:text-cyan-400 transition-colors">
              FIFA
            </Link>
            <span
              className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border ${
                isFan
                  ? "bg-cyan-950/60 text-cyan-400 border-cyan-800/50"
                  : "bg-sky-950/60 text-sky-400 border-sky-800/50"
              }`}
            >
              {isFan ? "Fan Portal" : "Federation Operations"}
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-white">
              Welcome Back,{" "}
              <span className={isFan ? "text-cyan-400" : "text-sky-400"}>
                {isFan ? "Fan" : "Organization"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {isFan
                ? "Sign in to your account and never miss a moment."
                : "Sign in to your organization account and manage your football operations."}
            </p>
          </div>

          {/* Sign In / Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isFan ? "Alex Silva" : "Director of Competitions"}
                    className="w-full bg-[#0c1220] border border-[#1d273b] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isFan ? "fan@fifa.org" : "ops@fifa.org"}
                  className="w-full bg-[#0c1220] border border-[#1d273b] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#0c1220] border border-[#1d273b] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#1d273b] bg-[#0c1220] text-cyan-400 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => showToast("Password reset link dispatched to demo inbox.")}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-headline font-bold text-sm text-black flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                isFan
                  ? "bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.35)]"
                  : "bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 shadow-[0_0_25px_rgba(14,165,233,0.35)]"
              }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#070b16] px-3 text-slate-500 text-xs font-mono uppercase">or</span>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center text-xs text-slate-400">
            <span>{isSignUp ? "Already have an account? " : "Don't have an account? "}</span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
