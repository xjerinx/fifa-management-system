import { useState } from "react";
import { NavLink } from "react-router-dom";

const navSections = [
  {
    title: "OVERVIEW",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "grid_view", end: true },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { to: "/associations", label: "Associations", icon: "flag" },
      { to: "/teams", label: "Teams", icon: "shield" },
      { to: "/players", label: "Players", icon: "sports_soccer" },
      { to: "/coaches", label: "Coaches", icon: "high_res" },
      { to: "/referees", label: "Referees", icon: "sports" },
    ],
  },
  {
    title: "VENUES & ASSETS",
    items: [
      { to: "/stadiums", label: "Stadiums", icon: "stadium" },
    ],
  },
  {
    title: "COMPETITIONS",
    items: [
      { to: "/tournaments", label: "Tournaments", icon: "emoji_events" },
      { to: "/matches", label: "Fixtures & Matches", icon: "calendar_month" },
      { to: "/events", label: "Match Events Timeline", icon: "timeline" },
    ],
  },
  {
    title: "COMMERCIAL",
    items: [
      { to: "/sponsors", label: "Global Partners & Sponsors", icon: "handshake" },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between bg-[#060a14] border-r border-[#131d30] py-3.5 z-40 transition-all duration-200 select-none ${collapsed ? "w-16" : "w-60"
        }`}
    >
      <div className="flex flex-col gap-3.5 min-h-0 flex-1">
        {/* Header / Brand */}
        <div className={`px-3.5 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                alt="FIFA Crest"
                className="h-7 w-7 object-contain shrink-0"
                src="/assets/fifa-ops-crest.png"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs tracking-wider text-white uppercase truncate">
                  FIFA OPS
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate -mt-0.5">
                  OPERATIONS HUB
                </span>
              </div>
            </div>
          ) : (
            <img
              alt="FIFA Crest"
              className="h-7 w-7 object-contain"
              src="/assets/fifa-ops-crest.png"
            />
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle Sidebar"
            className="p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded"
          >
            <span className="material-symbols-outlined text-[17px]">
              {collapsed ? "menu" : "menu_open"}
            </span>
          </button>
        </div>



        {/* Navigation Sections */}
        <nav className="flex-1 flex flex-col gap-3 px-2.5 overflow-y-auto pr-1">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              {!collapsed && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isActive
                      ? "bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-bold shadow-[0_0_15px_rgba(56,189,248,0.35)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium"
                    } ${collapsed ? "justify-center px-0" : ""}`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] shrink-0">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>


      {/* Footer / Status Indicator */}
      <div className="px-3.5 pt-2.5 border-t border-[#131d30]">
        <div className={`flex items-center justify-between ${collapsed ? "justify-center" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse"></span>
            {!collapsed && (
              <span className="text-[11px] font-mono font-medium text-slate-300">TMS SYNCED</span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">99.98%</span>
          )}
        </div>
      </div>
    </aside>
  );
}