import React, { useEffect, useRef, useState } from "react";
import { PrismicNextImage } from "@prismicio/next";
import { ImageField } from "@prismicio/client";

interface VideoMinimalProps {
  url?: string;
  poster?: ImageField;
  classes?: string;
  wrapperClasses?: string;
  autoplay?: boolean;
}

const VideoMinimal: React.FC<VideoMinimalProps> = ({ url, poster, classes, wrapperClasses, autoplay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Mirror wrapper border radius to video on Safari to ensure proper clipping
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    const computed = window.getComputedStyle(container);
    const tl = computed.getPropertyValue("border-top-left-radius") || "0px";
    const tr = computed.getPropertyValue("border-top-right-radius") || "0px";
    const br = computed.getPropertyValue("border-bottom-right-radius") || "0px";
    const bl = computed.getPropertyValue("border-bottom-left-radius") || "0px";
    const values = [tl, tr, br, bl].map((v) => v.trim()).join(" ");
    video.style.clipPath = `inset(0 round ${values})`;
    video.style.setProperty("-webkit-clip-path", `inset(0 round ${values})`);
    container.style.overflow = container.style.overflow || "hidden";
  }, [wrapperClasses]);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play()
      .then(() => {
        setIsPlaying(true);
        if (!hasStarted) setHasStarted(true);
      })
      .catch(() => {});
  };

  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
  };

  // Autoplay when requested (e.g., inside a modal)
  useEffect(() => {
    if (autoplay && url) {
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, url]);

  // If no video, just render the image in the enforced aspect ratio
  if (!url) {
    return (
      <div ref={containerRef} className={`relative w-full aspect-[5/4] overflow-hidden ${wrapperClasses || ""}`}>
        {poster && (
          <PrismicNextImage field={poster} fallbackAlt="" className="absolute inset-0 object-cover" fill />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[5/4] overflow-hidden ${wrapperClasses || ""}`}
      onMouseEnter={autoplay ? undefined : play}
      onMouseLeave={autoplay ? undefined : stop}
      onTouchStart={autoplay ? undefined : (() => (isPlaying ? stop() : play()))}
    >
      {poster && !hasStarted && (
        <PrismicNextImage field={poster} fallbackAlt="" className="absolute inset-0 object-cover z-10 pointer-events-none" fill />
      )}
      <video
        ref={videoRef}
        src={url}
        className={`absolute inset-0 w-full h-full object-cover ${classes || ""}`}
        playsInline
        muted
        controls={false}
        preload="metadata"
        poster={poster?.url || undefined}
        style={{ borderRadius: "inherit" }}
      />
    </div>
  );
};

export default VideoMinimal;
