import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('JS Duo Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131F24] flex items-center justify-center p-4 select-none">
          <div className="bg-[#1C262C] border-2 border-[#2A373F] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Ups, coś poszło nie tak</h2>
              <p className="text-sm text-gray-400 mt-1">
                Wystąpił nieoczekiwany błąd. Kliknij poniżej, aby odświeżyć aplikację.
              </p>
              {this.state.error && (
                <pre className="mt-3 p-2 bg-black/40 rounded-xl text-left text-xs text-red-300 overflow-x-auto max-h-32 border border-red-500/20">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-duo-green hover:bg-duo-green/90 text-[#131F24] font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <RefreshCw size={18} />
              <span>Odśwież aplikację</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
