import React from "react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>{error.message}</pre>
      <button onClick={resetErrorBoundary} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Try again
      </button>
    </div>
  );
};

export default ErrorFallback;
