import Modal from "./Modal";

export default function BulkDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  entityName = "record",
  loading = false,
}) {
  const pluralName = count === 1 ? entityName : `${entityName}s`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={`Delete ${count} selected ${pluralName}?`}
      subtitle="This action cannot be undone"
      icon="warning"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left">
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-rose-400 text-[20px] shrink-0 mt-0.5">
            delete_forever
          </span>
          <div className="text-xs text-rose-200/90 leading-relaxed">
            You are about to permanently delete{" "}
            <strong className="text-white font-bold">{count}</strong> selected{" "}
            {pluralName} from the database. This operation is safe and executed within a database transaction.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Delete ({count})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
