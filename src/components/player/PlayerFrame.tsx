import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Maximize, AlertTriangle, Loader2 } from 'lucide-react';
import { usePlayerEvents } from './usePlayerEvents';

interface PlayerFrameProps {
  src: string;
  title?: string;
  onEnded?: () => void;
  onProgress?: (event: any) => void;
  className?: string;
}

// Keep all third-party embeds isolated; never grant popup or top-level navigation permissions.
const PLAYER_SANDBOX = 'allow-scripts allow-same-origin allow-forms';

export const PlayerFrame: React.FC<PlayerFrameProps> = ({
  src,
  title = 'Anime Player',
  onEnded,
  onProgress,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Re-trigger loading when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src, key]);

  usePlayerEvents({
    onEnded,
    onProgress,
    onError: (err) => {
      console.warn('Player event error:', err);
    },
  });

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Error attempting to enable full-screen mode:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Error attempting to exit full-screen mode:', err);
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-ink-700 shadow-2xl group/player ${className}`}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-canvas text-ink-300 gap-3 pointer-events-none">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-medium text-ink-500">Loading player stream...</p>
        </div>
      )}

      {/* Error Notice */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-canvas p-6 text-center text-ink-300 gap-3">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <h4 className="text-base font-bold text-surface-primary">Stream temporarily unavailable</h4>
          <p className="text-xs text-ink-500 max-w-sm">
            The video source could not be loaded. Some providers are incompatible with protected playback.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReload}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Reload Player
            </button>
          </div>
        </div>
      )}

      {/* Third-party player: no popups, top navigation or intrusive modal permissions. */}
      <iframe
        key={key}
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0 absolute inset-0"
        sandbox={PLAYER_SANDBOX}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      <span className="sr-only">Protected player: popup and top-level redirect permissions are disabled. In-player advertising may still appear.</span>

      {/* Quick Player Action Overlay on Top Right (Hover) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-0 group-hover/player:opacity-100 transition-opacity bg-surface-canvas/85 p-1 rounded-xl border border-ink-500/60 shadow-lg">
        <button
          type="button"
          onClick={handleReload}
          className="p-1.5 text-ink-300 hover:text-white rounded-lg hover:bg-ink-700 transition-colors cursor-pointer"
          title="Reload Player Stream"
          aria-label="Reload Player"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-1.5 text-ink-300 hover:text-white rounded-lg hover:bg-ink-700 transition-colors cursor-pointer"
          title="Toggle Fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
