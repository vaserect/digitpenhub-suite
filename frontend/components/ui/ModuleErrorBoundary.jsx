'use client';

import React from 'react';

export default class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Module crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel">
          <div className="state-viewport" style={{ minHeight: 'auto', padding: '40px 0' }}>
            <div className="state-panel is-danger is-compact">
              <div className="state-icon">⚠️</div>
              <h2 className="state-title">Something went wrong</h2>
              <p className="state-description">
                This module encountered an error. The team has been notified.
              </p>
              <div className="state-action">
                <button className="btn-primary" onClick={() => this.setState({ hasError: false })}>
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
