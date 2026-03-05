import * as React from "react";
import { Frame } from "~/src/frame";
import { InfiniteCanvas } from "~/src/infinite-canvas";
import type { MediaItem } from "~/src/infinite-canvas/types";
import { PageLoader } from "~/src/loader";

export function App() {
  const [media, setMedia] = React.useState<MediaItem[]>([]);
  const [textureProgress, setTextureProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
 
  React.useEffect(() => {
    let canceled = false;

    const loadManifest = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use import.meta.env.BASE_URL for proper path resolution with Vite
        // Files in public folder are always served from root, so we use absolute path
        let baseUrl = import.meta.env.BASE_URL || '/';
        
        // Normalize base URL - ensure it starts with / and doesn't end with /
        if (!baseUrl.startsWith('/')) {
          baseUrl = '/' + baseUrl;
        }
        if (baseUrl !== '/' && baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
        
        // Construct manifest path - public folder files are always at root
        const manifestPath = baseUrl === '/' 
          ? '/artworks/manifest.json' 
          : `${baseUrl}/artworks/manifest.json`.replace(/\/+/g, '/');
        
        console.log('Base URL:', baseUrl);
        console.log('Loading manifest from:', manifestPath);
        console.log('Current location:', window.location.href);
        
        // Add timeout for mobile networks (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
          const response = await fetch(manifestPath, {
            signal: controller.signal,
            cache: 'default'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
          }

          console.log('Manifest response received, parsing...');
          const manifest: MediaItem[] = await response.json();
          console.log(`Manifest loaded: ${manifest.length} items`);
          
          if (!canceled) {
            setMedia(manifest);
            setIsLoading(false);
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
            throw new Error('Manifest loading timed out. Please check your network connection and try again.');
          }
          throw fetchErr;
        }
      } catch (err) {
        console.error('Manifest loading error:', err);
        if (!canceled) {
          const errorMessage = err instanceof Error 
            ? err.message 
            : "Failed to load manifest. Please refresh the page.";
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadManifest();
    }, 100);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <PageLoader progress={0} />;
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        width: "100vw",
        color: "red",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: "#ffffff",
        fontFamily: "ui-monospace, monospace"
      }}>
        <div>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>Loading Error</h2>
          <p style={{ marginBottom: "1rem", fontSize: "1rem" }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!media.length) {
    return <PageLoader progress={0} />;
  }

  return (
    <>
      <Frame />
      <PageLoader progress={textureProgress} />
      <InfiniteCanvas media={media} onTextureProgress={setTextureProgress} />
    </>
  );
}
