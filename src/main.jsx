import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Error boundary to catch any runtime crashes gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "system-ui, sans-serif", maxWidth: 600, margin: "60px auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12, color: "#ff3b30" }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
            An unexpected error occurred. Try clearing your browser data for this site, or click the button below to reset the app.
          </p>
          <pre style={{ background: "#f5f5f7", padding: 16, borderRadius: 8, fontSize: 12, overflow: "auto", marginBottom: 16 }}>
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ padding: "10px 20px", background: "#0071e3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reset App & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
