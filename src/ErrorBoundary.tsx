import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
    };
  }
  componentDidCatch(err: unknown): void {
    console.error("ErrorBoundary caught:", err);
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <main aria-label="Error">
            <h1>Something went wrong</h1>
            <p>{this.state.message}</p>
            <button onClick={() => this.setState({ hasError: false, message: "" })}>Retry</button>
          </main>
        )
      );
    }
    return this.props.children;
  }
}
