import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-[#0a0d14] rounded-xl border border-white/10 m-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-rose-400">
              warning
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-display uppercase tracking-wide">
            Component Display Error
          </h2>
          <p className="text-xs text-slate-400 max-w-md mt-2">
            An unexpected error occurred while rendering this module. You can try refreshing the view or navigating back.
          </p>
          {this.state.error?.message && (
            <div className="mt-4 p-3 bg-[#121620] border border-rose-500/20 rounded-lg text-left max-w-lg w-full">
              <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">
                ERROR TELEMETRY
              </span>
              <p className="text-xs font-mono text-slate-300 break-words">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#00e5ff] hover:bg-[#00c5de] text-black font-bold text-xs rounded transition-colors"
            >
              Retry Display
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#162030] hover:bg-[#202d44] text-slate-200 text-xs font-semibold rounded border border-white/10 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
