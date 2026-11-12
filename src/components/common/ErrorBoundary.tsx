import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

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
    console.error('[ErrorBoundary] Uncaught application render error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-card p-6 sm:p-8 shadow-soft text-center space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-control bg-status-escalated-bg text-status-escalated-text flex items-center justify-center mx-auto border border-status-escalated-text/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-20 font-heading font-semibold tracking-tight text-text">
                Something went wrong
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected interface error occurred during render. You can reload the page or return to the society noticeboard.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-control bg-surface-2 border border-border text-left overflow-x-auto text-[11px] font-mono text-muted max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={this.handleReload}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  this.handleReset();
                  window.location.href = '/';
                }}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
