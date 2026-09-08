import { useState, useRef } from "react";
import api from "../api/axios";
import { useToast } from "./Toast";
import { parseCSV, mapCSVToSchema } from "../utils/csvParser";
import { IMPORT_SCHEMAS } from "../utils/importSchemas";

export default function CsvImportModal({
  isOpen,
  onClose,
  entityKey = "players",
  onSuccess,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [selectedEntity, setSelectedEntity] = useState(entityKey);
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const schema = IMPORT_SCHEMAS[selectedEntity] || IMPORT_SCHEMAS.players;

  const handleEntityChange = (newEntity) => {
    setSelectedEntity(newEntity);
    if (file && parseResult?.rawMatrix) {
      const mapped = mapCSVToSchema(parseResult.rawMatrix, IMPORT_SCHEMAS[newEntity] || schema);
      setParseResult({
        ...mapped,
        rawMatrix: parseResult.rawMatrix,
      });
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid .csv file.");
      return;
    }

    setError("");
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const matrix = parseCSV(text);
        if (!matrix || matrix.length < 2) {
          setError("The selected CSV file appears to be empty or missing data rows.");
          setParseResult(null);
          return;
        }

        const mapped = mapCSVToSchema(matrix, schema);
        setParseResult({
          ...mapped,
          rawMatrix: matrix,
        });
      } catch (err) {
        setError(`Failed to read CSV file: ${err.message || "Unknown error"}`);
        setParseResult(null);
      }
    };
    reader.onerror = () => {
      setError("Error reading the selected file from disk.");
      setParseResult(null);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const resetFile = () => {
    setFile(null);
    setParseResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.rows.length) {
      setError("No valid records found to import.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.post(schema.apiEndpoint, { rows: parseResult.rows });
      toast?.showToast(res.data?.message || `Successfully imported ${parseResult.totalRows} records!`);
      resetFile();
      onClose();
      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Bulk import failed. Please review your file.";
      setError(msg);
      toast?.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101b] border border-cyan-500/20 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070b14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">
                upload_file
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                  Batch CSV Importer
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-semibold">
                  UNIVERSAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                TARGET TABLE: <span className="text-white font-semibold">{schema.title.toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Entity switcher */}
            <select
              value={selectedEntity}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="bg-[#121826] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-medium"
            >
              {Object.keys(IMPORT_SCHEMAS).map((key) => (
                <option key={key} value={key}>
                  {IMPORT_SCHEMAS[key].title}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                resetFile();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Upload / Dropzone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#080d17]/50 hover:bg-[#0c1322]/80 flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition-transform flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-cyan-400 text-[28px]">
                  cloud_upload
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                Click to browse or drag & drop your CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Columns matching {schema.title} will be populated. Missing columns will be set to <code className="text-cyan-400 font-mono">NULL</code>, and extra unknown columns will be automatically ignored.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-[#121929] border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-[24px]">
                  description
                </span>
                <div>
                  <p className="text-xs font-bold text-white font-mono">{file.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB · {parseResult?.totalRows || 0} rows detected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetFile}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                Change File
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Parse Verification Telemetry */}
          {parseResult && (
            <div className="space-y-4">
              {/* Telemetry Pills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Matched */}
                <div className="p-3 bg-[#0c1322] border border-cyan-500/20 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 font-semibold">MATCHED COLUMNS</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {parseResult.matchedColumns.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {parseResult.matchedColumns.map((c) => (
                      <span
                        key={c.key}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                      >
                        {c.key}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing (Set to NULL) */}
                <div className="p-3 bg-[#0c1322] border border-amber-500/20 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-semibold">MISSING (SET TO NULL)</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {parseResult.missingColumns.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {parseResult.missingColumns.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">None (All present)</span>
                    ) : (
                      parseResult.missingColumns.map((c) => (
                        <span
                          key={c.key}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30"
                        >
                          {c.key} = NULL
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Ignored Extra Columns */}
                <div className="p-3 bg-[#0c1322] border border-slate-700/40 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 font-semibold">EXTRA COLUMNS (IGNORED)</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                      {parseResult.ignoredColumns.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {parseResult.ignoredColumns.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">None</span>
                    ) : (
                      parseResult.ignoredColumns.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-white/5 line-through opacity-75"
                        >
                          {c}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white">Parsed Sample Preview</span>
                  <span className="font-mono text-[11px]">
                    Showing first {Math.min(parseResult.rows.length, 5)} of {parseResult.totalRows} rows
                  </span>
                </div>
                <div className="border border-white/10 rounded-xl overflow-x-auto bg-[#080d17]">
                  <table className="w-full text-left text-xs text-slate-300 divide-y divide-white/10">
                    <thead className="bg-[#101726] text-[10px] font-mono uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-2 w-10">#</th>
                        {schema.fields.map((f) => (
                          <th key={f.key} className="px-3 py-2 whitespace-nowrap">
                            {f.key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {parseResult.rows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-slate-500">{rIdx + 1}</td>
                          {schema.fields.map((f) => {
                            const val = row[f.key];
                            return (
                              <td key={f.key} className="px-3 py-2 whitespace-nowrap">
                                {val === null || val === undefined ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : (
                                  <span className="text-slate-200">{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#070b14] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              resetFile();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parseResult || !parseResult.rows.length || loading}
            onClick={handleImport}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
              !parseResult || !parseResult.rows.length || loading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                : "bg-cyan-400 hover:bg-cyan-300 text-black border border-cyan-300 cursor-pointer shadow-cyan-500/20"
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  publish
                </span>
                <span>
                  Confirm & Import ({parseResult?.totalRows || 0} Records)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
