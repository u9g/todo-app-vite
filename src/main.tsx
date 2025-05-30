import { addCustomEvent, uploadRecording } from "./rrweb.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./errorboundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      onReactError={({ error, componentStack }) => {
        addCustomEvent({
          name: "error",
          data: {
            error: String(error),
            stack: String(error.stack),
            componentStack,
          },
        });
        uploadRecording("Unhandled error hit react error boundary");
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
