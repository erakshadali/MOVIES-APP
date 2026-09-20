import { Component } from 'react'

// Catches a crash in one page so the rest of the app (menu, footer) keeps
// working and the visitor gets a way out instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Page crashed:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="state-message error" role="alert">
        Something went wrong while showing this page.
        <br />
        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    )
  }
}
