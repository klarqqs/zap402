import React from 'react';
import ErrorState from './ErrorState';
import { categorizeError } from '@/utils/error';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  onReset?: () => void;
  /** Passed to `ErrorState` when the default fallback is shown. */
  errorStateVariant?: 'default' | 'editorial';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const category = categorizeError(this.state.error);
      const ev = this.props.errorStateVariant ?? 'default';

      if (ev === 'editorial') {
        return (
          <div className="flex min-h-screen items-center justify-center bg-zap-bg px-4 py-12 text-zap-ink dark:bg-zinc-950">
            <ErrorState
              variant="editorial"
              category={category}
              error={this.state.error}
              onRetry={this.handleReset}
              className="py-0 sm:py-0"
            />
          </div>
        );
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <ErrorState
            category={category}
            error={this.state.error}
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
