import React, { useRef, useState, useEffect } from "react";
import { PrismicNextImage } from "@prismicio/next";
import { ImageField } from "@prismicio/client";

interface VideoProps {
  url?: string;
  poster?: ImageField;
  aspectRatio?: string;
  autoplay?: boolean;
  classes?: string;
  wrapperClasses?: string;
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
  mozFullScreenElement?: Element | null;
  mozCancelFullScreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
};

// iOS Safari exposes special fullscreen APIs on HTMLVideoElement
type IOSVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => Promise<void> | void;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitSupportsFullscreen?: boolean;
  webkitDisplayingFullscreen?: boolean;
};

const VideoBasic: React.FC<VideoProps> = ({ url, poster, aspectRatio, autoplay, classes, wrapperClasses }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showPosterOverlay, setShowPosterOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const hideControlsTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force rounded corners on Safari by mirroring wrapper border radii via clip-path
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    const computed = window.getComputedStyle(container);
    const tl = computed.getPropertyValue('border-top-left-radius') || '0px';
    const tr = computed.getPropertyValue('border-top-right-radius') || '0px';
    const br = computed.getPropertyValue('border-bottom-right-radius') || '0px';
    const bl = computed.getPropertyValue('border-bottom-left-radius') || '0px';
    const values = [tl, tr, br, bl].map(v => v.trim()).join(' ');
    // Apply both standard and webkit prefixed just in case
    video.style.clipPath = `inset(0 round ${values})`;
    // Nudge Safari’s compositor
    video.style.setProperty('-webkit-clip-path', `inset(0 round ${values})`);
    // Make sure the wrapper actually clips
    container.style.overflow = container.style.overflow || 'hidden';
  }, [wrapperClasses]);

  // Handle autoplay functionality
  useEffect(() => {
    // initialize poster overlay visibility based on props
    setShowPosterOverlay(Boolean(url) && Boolean(poster));

    if (!autoplay || !url || !videoRef.current) return;

    const video = videoRef.current;
    
    // Function to attempt autoplay
    const tryAutoplay = () => {
      if (video && video.paused) {
        // Check if video is visible
        const rect = video.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((error) => {
            console.log('Autoplay failed:', error);
          });
        }
      }
    };

    // Try autoplay immediately
    tryAutoplay();

    // Set up intersection observer to detect when video becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video.paused) {
            tryAutoplay();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(video);

    // Also listen for resize events (accordion opening might trigger this)
    const handleResize = () => {
      setTimeout(tryAutoplay, 100); // Small delay to ensure layout is updated
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [autoplay, url]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearHideControlsTimer = () => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  };

  const scheduleHideControls = () => {
    clearHideControlsTimer();
    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handleMouseMove = () => {
    if (!isPlaying) return; // Only show overlay controls while playing
    setShowControls(true);
    scheduleHideControls();
  };

  const handleMouseLeave = () => {
    clearHideControlsTimer();
    setShowControls(false);
  };

  const seek = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const nextTime = Math.min(Math.max(0, (video.currentTime || 0) + deltaSeconds), video.duration || Infinity);
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current as FullscreenElement | null;
    const video = videoRef.current as IOSVideoElement | null;
    if (!container || !video) return;

    const doc = document as FullscreenDocument;

    const isDocFullscreen = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    // iOS Safari inline video fullscreen detection
    const isIOSVideoFullscreen = Boolean(video.webkitDisplayingFullscreen);
    const isCurrentlyFullscreen = isDocFullscreen || isIOSVideoFullscreen;

    if (!isCurrentlyFullscreen) {
      // Prefer requesting fullscreen on the video element itself
      if (video.requestFullscreen) {
        video.requestFullscreen().catch(() => {
          // fall back if request fails
          if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
          else if (container.requestFullscreen) container.requestFullscreen();
          else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
          else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
          else if (container.msRequestFullscreen) container.msRequestFullscreen();
        });
      } else if (video.webkitEnterFullscreen) {
        // iOS Safari
        video.webkitEnterFullscreen();
      } else if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (isDocFullscreen) {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
      } else if (video.webkitExitFullscreen) {
        // iOS Safari
        video.webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as FullscreenDocument;
      const fsElement =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    document.addEventListener("msfullscreenchange", onFsChange as EventListener);
    document.addEventListener("mozfullscreenchange", onFsChange as EventListener);

    // iOS Safari specific video fullscreen events
    const video = videoRef.current as IOSVideoElement | null;
    const onBeginIOSFs = () => setIsFullscreen(true);
    const onEndIOSFs = () => setIsFullscreen(false);
    if (video) {
      video.addEventListener('webkitbeginfullscreen', onBeginIOSFs as EventListener);
      video.addEventListener('webkitendfullscreen', onEndIOSFs as EventListener);
    }

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);
      document.removeEventListener("msfullscreenchange", onFsChange as EventListener);
      document.removeEventListener("mozfullscreenchange", onFsChange as EventListener);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', onBeginIOSFs as EventListener);
        video.removeEventListener('webkitendfullscreen', onEndIOSFs as EventListener);
      }
    };
  }, []);

  // Sync duration and current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };
    const handleTimeUpdate = () => {
      const time = video.currentTime || 0;
      setCurrentTime(time);
      if (time > 0 && showPosterOverlay) setShowPosterOverlay(false);
    };
    const handlePlayEvent = () => {
      setIsPlaying(true);
      if (showPosterOverlay) setShowPosterOverlay(false);
    };
    const handlePauseEvent = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('durationchange', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('durationchange', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
    };
  }, [url, showPosterOverlay]);

  // Compute an aspect ratio to prevent layout jumps before metadata loads
  const cssAspectRatio = (() => {
    if (aspectRatio && aspectRatio.includes('/')) return aspectRatio;
    const w = poster?.dimensions?.width;
    const h = poster?.dimensions?.height;
    if (w && h) return `${w} / ${h}`;
    return '16 / 9';
  })();

  const handleScrub = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration <= 0) return;
    const clamped = Math.max(0, Math.min(value, duration));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // If no video URL is provided, just show the poster as an image
  if (!url) {
    return (
      <div className={`relative w-full h-full ${aspectRatio || ''}`} style={{ aspectRatio: cssAspectRatio }}>
        {poster && <PrismicNextImage className="w-full h-full object-cover" field={poster} alt="" />}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full group overflow-hidden safari-mask ${aspectRatio || ''} ${wrapperClasses || ''}`}
      style={{ aspectRatio: cssAspectRatio }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => { setShowControls(true); scheduleHideControls(); }}
    >
      {/* Poster overlay above the video, hidden once playback starts */}
      {poster && showPosterOverlay && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <PrismicNextImage className="w-full h-full object-cover" field={poster} alt="" />
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        className={`w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover'} z-0 relative block ${classes || ''}`}
        onClick={handlePlay}
        playsInline
        controls={false}
        autoPlay={autoplay}
        muted={autoplay} // Videos need to be muted to autoplay in most browsers
        loop={autoplay} // Loop when autoplay is enabled
        poster={undefined}
        style={{ borderRadius: 'inherit' }}
      />
      {/* Hover/active controls */}
      <div
        className={`pointer-events-none absolute left-0 right-0 bottom-0 z-30 transition-opacity duration-200 ${(showControls && isPlaying) ? 'opacity-100' : 'opacity-0'}`}
        onMouseMove={handleMouseMove}
      >
        {/* Progress / Scrub bar */}
        <div className="pointer-events-auto px-3 pt-3">
          {
            // Calculate played percentage for gradient background
          }
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Number.isFinite(currentTime) ? currentTime : 0}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            onMouseDown={() => setShowControls(true)}
            onTouchStart={() => setShowControls(true)}
            className="video-scrub w-full cursor-pointer"
            aria-label="Seek"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,1) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.5) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.5) 100%)`,
            }}
          />
        </div>
        <div className="pointer-events-auto flex items-center gap-3 p-3 pb-4 bg-gradient-to-t from-black/60 to-transparent">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="text-white/90 hover:text-white focus:outline-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              // Pause icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              // Play icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); seek(-10); }}
            className="text-white/90 hover:text-white focus:outline-none"
            aria-label="Rewind 10 seconds"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 6L4 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); seek(10); }}
            className="text-white/90 hover:text-white focus:outline-none"
            aria-label="Forward 10 seconds"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="text-white/90 hover:text-white focus:outline-none"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              // Exit fullscreen icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10V4h6v2h-4v4h-2zM10 10H8V6H4V4h6v6zM14 14h2v4h4v2h-6v-6zM10 14v6H4v-2h4v-4h2z"/>
              </svg>
            ) : (
              // Enter fullscreen icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 4h6v6h-2V6h-4V4zM4 4h6v2H6v4H4V4zm16 16h-6v-2h4v-4h2v6zM10 20H4v-6h2v4h4v2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <button
        onClick={handlePlay}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 flex items-center justify-center transition-all duration-300 p-0 border-none bg-transparent z-40 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        style={{ outline: 'none' }}
        tabIndex={0}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        {!isPlaying && (
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 12 Q18 36 18 60 Q18 66 24 63 L60 39 Q66 36 60 33 L24 9 Q18 6 18 12 Z"
              fill="white"
              stroke="white"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>
      {/* Scoped styles for the custom scrub bar */}
      <style jsx>{`
        .safari-mask {
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
        }
        .video-scrub {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          outline: none;
        }
        .video-scrub::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent; /* actual background set on input element */
        }
        .video-scrub::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: none;
          margin-top: -4px; /* center the thumb */
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
        }
        /* Firefox */
        .video-scrub::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.5);
        }
        .video-scrub::-moz-range-progress {
          height: 6px;
          border-radius: 9999px;
          background: rgba(255,255,255,1);
        }
        .video-scrub::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: none;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default VideoBasic;
