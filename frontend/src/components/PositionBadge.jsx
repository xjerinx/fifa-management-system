export default function PositionBadge({ position, size = "md" }) {
  if (!position) return null;

  const pos = position.toUpperCase().trim();
  let colorStyle = "";
  let label = pos;

  if (pos === "GK" || pos === "GOALKEEPER") {
    label = "GK";
    colorStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  } else if (
    ["DF", "DEFENDER", "CB", "LB", "RB", "RWB", "LWB", "DEF"].includes(pos)
  ) {
    label = pos === "DEFENDER" ? "DF" : pos;
    colorStyle = "bg-sky-500/15 text-sky-400 border-sky-500/30";
  } else if (
    ["MF", "MIDFIELDER", "CM", "CDM", "CAM", "LM", "RM", "MID"].includes(pos)
  ) {
    label = pos === "MIDFIELDER" ? "MF" : pos;
    colorStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  } else if (
    ["FW", "FORWARD", "ST", "CF", "LW", "RW", "ATTACKER"].includes(pos)
  ) {
    label = pos === "FORWARD" ? "FW" : pos;
    colorStyle = "bg-rose-500/15 text-rose-400 border-rose-500/30";
  } else {
    colorStyle = "bg-surface-container-high text-on-surface-variant border-outline-variant/40";
  }

  const sizeClasses =
    size === "sm"
      ? "px-1 py-0.5 text-[9px] min-w-[20px]"
      : "px-1.5 py-0.5 text-[11px] min-w-[26px]";

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold tracking-wider rounded-[2px] border ${sizeClasses} ${colorStyle}`}
    >
      {label}
    </span>
  );
}
