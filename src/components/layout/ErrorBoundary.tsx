
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; 
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // You could log this to an external service here
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default fallback if none is provided
      // Check if the error message seems to be the known extension issue
      if (this.state.error?.message?.toLowerCase().includes("permission error")) {
        console.warn("ErrorBoundary is rendering a minimal UI due to a caught 'permission error', likely from an extension.");
        // Render nothing or a very subtle message to avoid disrupting the user further
        // if the app can still function partially.
        return null; 
      }
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', color: '#555' }}>
          <h2>Oops! Something went wrong.</h2>
          <p>An error occurred in this part of the application. Please try refreshing the page.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', textAlign: 'left' }}>
              <summary>Error Details (for development)</summary>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
