import React, { useRef, useState, useEffect } from "react";
import { PrismicNextImage } from "@prismicio/next";
import { ImageField } from "@prismicio/client";

interface VideoProps {
  url?: string;
  poster?: ImageField;
}

const VideoBasic: React.FC<VideoProps> = ({ url, poster }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPauseButton, setShowPauseButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hide pause button on mobile (touch) after tap
  useEffect(() => {
    const handleTouch = () => {
      if (isPlaying) {
        setShowPauseButton(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowPauseButton(false), 2000);
      }
    };
    const video = videoRef.current;
    if (video) {
      video.addEventListener('touchstart', handleTouch);
    }
    return () => {
      if (video) {
        video.removeEventListener('touchstart', handleTouch);
      }
    };
  }, [isPlaying]);

  // If no video URL is provided, just show the poster as an image
  if (!url) {
    return (
      <div className="relative w-full h-full">
        {poster && <PrismicNextImage className="w-full h-full object-cover" field={poster} alt="" />}
      </div>
    );
  }

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowPauseButton(false);
      } else {
        videoRef.current.play();
        setShowPauseButton(true);
        // Start the timer to hide the pause button after 2 seconds
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowPauseButton(false), 2000);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Mouse movement logic for pause button visibility
  const handleMouseMove = () => {
    if (isPlaying) {
      setShowPauseButton(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowPauseButton(false), 2000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowPauseButton(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  return (
    <div
      className="relative w-full group"
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
        poster={poster?.url || undefined}
      />
      <button
        onClick={handlePlay}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 flex items-center justify-center transition-all duration-300 p-0 border-none bg-transparent z-20 ${isPlaying && !showPauseButton ? 'opacity-0' : 'opacity-100'}`}
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
        {isPlaying && (
          <div className="flex gap-2">
            <div className="w-5 h-12 bg-white rounded-sm" />
            <div className="w-5 h-12 bg-white rounded-sm" />
          </div>
        )}
      </button>
    </div>
  );
};

export default VideoBasic;
