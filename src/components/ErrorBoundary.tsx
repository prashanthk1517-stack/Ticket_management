import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportApplicationError } from '../monitoring/errorReporter';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    reportApplicationError(error, 'react-boundary', 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
