import React, { useRef, useState, useEffect } from "react";
import { PrismicNextImage } from "@prismicio/next";
import { ImageField } from "@prismicio/client";

interface VideoProps {
  url?: string;
  poster?: ImageField;
  aspectRatio?: string;
  autoplay?: boolean;
}

const VideoBasic: React.FC<VideoProps> = ({ url, poster, aspectRatio, autoplay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle autoplay functionality
  useEffect(() => {
    if (!autoplay || !url || !videoRef.current) return;

    const video = videoRef.current;
    
    // Function to attempt autoplay
    const tryAutoplay = () => {
      if (video && !isPlaying) {
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
          if (entry.isIntersecting && !isPlaying) {
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
  }, [autoplay, url, isPlaying]);

  // If no video URL is provided, just show the poster as an image
  if (!url) {
    return (
      <div className={`relative w-full h-full ${aspectRatio || ''}`}>
        {poster && <PrismicNextImage className="w-full h-full object-cover" field={poster} alt="" />}
      </div>
    );
  }

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

  // Mouse event handlers (simplified since we don't show pause button)
  const handleMouseMove = () => {
    // No pause button visibility logic needed
  };

  const handleMouseLeave = () => {
    // No pause button visibility logic needed
  };

  return (
    <div
      className={`relative w-full group ${aspectRatio || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full z-10 relative"
        onClick={handlePlay}
        playsInline
        controls={false}
        autoPlay={autoplay}
        muted={autoplay} // Videos need to be muted to autoplay in most browsers
        loop={autoplay} // Loop when autoplay is enabled
        poster={poster?.url || undefined}
      />
      <button
        onClick={handlePlay}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 flex items-center justify-center transition-all duration-300 p-0 border-none bg-transparent z-20 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
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
    </div>
  );
};

export default VideoBasic;
