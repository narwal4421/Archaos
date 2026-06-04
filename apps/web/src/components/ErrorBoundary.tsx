import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

/**
 * Production-grade React Error Boundary.
 * Catches any render-time exceptions thrown by child components and displays
 * a clean fallback UI instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you'd send this to Sentry / LogRocket etc.
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { children, fallback } = this.props

    if (error) {
      if (fallback) return fallback(error, this.reset)

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#080808',
            color: '#AAAAAA',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>⚡</div>
          <h1 style={{ color: '#EF4444', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', maxWidth: 480, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            An unexpected error occurred in the application. The error has been logged.
            You can try resetting the view or refreshing the page.
          </p>
          <pre
            style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#EF4444',
              maxWidth: 560,
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginBottom: '1.5rem',
            }}
          >
            {error.message}
          </pre>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.reset}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                color: '#888',
                border: '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}
