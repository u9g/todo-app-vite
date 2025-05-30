import React from "react";

type Props = {
  onReactError: (info: { error: Error; componentStack: string }) => void;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    // Show fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward to the same central reporter you use elsewhere
    this.props.onReactError({
      error,
      componentStack: info.componentStack ?? "<no component stack>",
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
