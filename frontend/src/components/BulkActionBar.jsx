import { useEffect, useRef } from "react";

export default function BulkActionBar({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onClear,
  onDeleteClick,
  onExit,
  entityName = "records",
  isAllSelected = false,
  isIndeterminate = false,
}) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="flex items-center justify-between gap-3 bg-[#0b1222] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-xs font-mono transition-all shadow-md shadow-cyan-950/20 animate-in fade-in duration-150">
      <div className="flex items-center gap-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-200 hover:text-white">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={isAllSelected}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900/90 text-cyan-400 focus:ring-cyan-500/30 accent-cyan-400 cursor-pointer"
          />
          <span className="text-[11px] font-medium tracking-wide">
            {isAllSelected ? "Deselect All" : "Select All"}
            <span className="text-slate-400 ml-1">({totalCount})</span>
          </span>
        </label>

        {selectedCount > 0 ? (
          <span className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
            {selectedCount} selected
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">
            (Select {entityName}s to delete)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onDeleteClick}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg font-bold text-[11px] transition-all shadow-sm hover:border-rose-500/60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              <span>Delete Selected ({selectedCount})</span>
            </button>
          </>
        )}

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 cursor-pointer ml-1"
            title="Exit Multiple Deletion mode"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
