"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import VideoBasic from "../../components/VideoBasic";

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `Video`.
 */
export type VideoProps = SliceComponentProps<Content.VideoSlice>;

/**
 * Component for "Video" Slices.
 */
const Video: FC<VideoProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true)) return null;


  return (
    <section ref={sectionRef} className="w-full mb-4 px-4">
      <div className="relative mx-auto md:w-10/12 rounded-2xl overflow-hidden">
        <VideoBasic
          url={slice.primary.video_url || undefined}
          poster={slice.primary.poster}
          autoplay={slice.primary.autoplay}
        />
      </div>
    </section>
  );
};

export default Video;


