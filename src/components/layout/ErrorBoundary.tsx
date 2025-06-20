
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
      const errorMessage = this.state.error ? this.state.error.toString() : "An unknown error occurred.";
      const componentStack = this.state.errorInfo ? this.state.errorInfo.componentStack : "No component stack available.";

      // Always show a more detailed error message when ErrorBoundary is tripped
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'sans-serif', 
          color: '#333', 
          backgroundColor: '#f9f9f9', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          margin: '20px auto', 
          maxWidth: '800px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: '#d9534f', 
            borderBottom: '1px solid #eee', 
            paddingBottom: '10px', 
            marginBottom: '15px', 
            fontSize: '1.5em' 
          }}>
            Application Error Encountered
          </h2>
          <p style={{ 
            fontSize: '1.1em', 
            color: '#c9302c', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            wordBreak: 'break-word'
          }}>
            Error: {errorMessage}
          </p>
          <details style={{ 
            whiteSpace: 'pre-wrap', 
            marginTop: '15px', 
            textAlign: 'left', 
            fontSize: '0.9em', 
            backgroundColor: '#fff', 
            border: '1px solid #eee', 
            padding: '15px', 
            borderRadius: '4px',
            maxHeight: '300px',
            overflowY: 'auto',
            lineHeight: '1.6'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>Component Stack Trace</summary>
            <code style={{ display: 'block', marginTop: '5px', fontFamily: 'monospace' }}>{componentStack}</code>
          </details>
          <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555' }}>
            We apologize for the inconvenience. Please try refreshing the page. If the issue persists, note down the error message and contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

