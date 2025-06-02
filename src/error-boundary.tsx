import { addCustomEvent, uploadRecording } from "./rrweb.tsx";
import React from "react";

export class ErrorBoundary extends React.Component {
  state: { hasError?: boolean; error?: string; errorStackTrace?: string } = {
    hasError: false,
  };
  props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error: String(error),
      errorStackTrace: error?.stack ? String(error.stack) : "<no stack>",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    addCustomEvent({
      name: "error",
      data: {
        error: error ? String(error) : "<no error given>",
        stack: error?.stack ? String(error.stack) : "<no stack>",
        componentStack: info.componentStack ?? "<no component stack>",
      },
    });
    uploadRecording("Unhandled error hit react error boundary");
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <>
          <div>Error</div>
          {"error" in this.state && (
            <>
              <br />
              <div>{this.state.error}</div>
              <br />
            </>
          )}
          {"errorStackTrace" in this.state && (
            <div>{this.state.errorStackTrace}</div>
          )}
        </>
      );
    }

    return this.props.children;
  }
}
