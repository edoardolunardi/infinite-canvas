import * as React from "react";
import { createRoot } from "react-dom/client";
import "~/src/index.css";
import { App } from "~/src/app";

// Ensure DOM is ready before initializing
if (typeof document !== "undefined") {
  // Remove initial loader
  const initialLoader = document.getElementById("initial-loader");
  if (initialLoader) {
    initialLoader.remove();
  }
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: red; padding: 2rem; text-align: center; font-family: ui-monospace, monospace;">
        <div>
          <h2>Initialization Error</h2>
          <p>Root element not found. Please check the HTML structure.</p>
        </div>
      </div>
    `;
  } else {
    try {
      console.log("Initializing React app...");
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log("React app initialized successfully");
    } catch (error) {
      console.error("Failed to initialize React app:", error);
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: red; padding: 2rem; text-align: center; font-family: ui-monospace, monospace;">
          <div>
            <h2>Initialization Error</h2>
            <p>Failed to start the application.</p>
            <p style="font-size: 0.875rem; color: #999; margin-top: 1rem;">
              ${error instanceof Error ? error.message : "Unknown error"}
            </p>
            <button 
              onclick="window.location.reload()" 
              style="padding: 0.75rem 1.5rem; margin-top: 1rem; font-size: 1rem; background-color: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer;"
            >
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
} else {
  console.error("Document is not available!");
}
