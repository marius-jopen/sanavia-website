"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import VideoBasic from "../../components/VideoBasic";

/**
 * Props for `PopVideo`.
 */
export type PopVideoProps = SliceComponentProps<Content.PopVideoSlice>;

/**
 * Component for "PopVideo" Slices.
 */
const PopVideo: FC<PopVideoProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  return (
    <section ref={sectionRef} className="w-full mb-4">
      <div className="relative w-10/12 rounded-r-2xl overflow-hidden">
        <VideoBasic
          url={slice.primary.video_url || undefined}
          poster={slice.primary.poster}
        />
      </div>
    </section>
  );
};

export default PopVideo;

