import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Trip Narrator render error', error, info);
  }

  render(): React.ReactNode {
    const { hasError, message } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <section className="app-error-fallback" role="alert">
        <h1>We lost the narration for a moment.</h1>
        <p className="app-error-message">{message ?? 'Try refreshing the page to continue.'}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload experience
        </button>
      </section>
    );
  }
}

export default ErrorBoundary;
