// src/components/shared/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught application error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-500">
                An unexpected error interrupted the application. You can reload the page or return to the home screen.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left">
                <p className="text-[11px] font-mono text-red-600 break-all line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="gap-1.5 text-xs"
              >
                <Home className="w-3.5 h-3.5" /> Go Home
              </Button>
              <Button
                size="sm"
                onClick={this.handleReset}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
