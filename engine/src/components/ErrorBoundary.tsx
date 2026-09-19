import { Component, type ReactNode, type ErrorInfo } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('client_errors').insert({
        message: error.message.slice(0, 2000),
        stack: error.stack?.slice(0, 8000) ?? null,
        component_stack: info.componentStack?.slice(0, 8000) ?? null,
        url: window.location.href.slice(0, 2000),
        user_agent: navigator.userAgent.slice(0, 500),
        user_id: user?.id ?? null,
      });
    } catch {
      // Swallow — the UI already shows the fallback; don't mask the original error.
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl font-bold text-surface-800 mb-4">Oops</div>
            <h1 className="text-xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-surface-400 mb-6 text-sm leading-relaxed">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
