"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import VideoBasic from "../../components/VideoBasic";
import { PrismicNextImage } from "@prismicio/next";

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

  return (
    <section ref={sectionRef} className="w-full mb-4">
      <div className="relative mx-auto w-10/12 rounded-2xl overflow-hidden">
        <VideoBasic
          url={slice.primary.video_url || ''}
          poster={slice.primary.poster}
        />
      </div>
    </section>
  );
};

export default Video;


