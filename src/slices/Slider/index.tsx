"use client";
import { FC, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { Splide, SplideSlide } from '@splidejs/react-splide';
import type { Splide as SplideClass } from '@splidejs/splide';
import '@splidejs/react-splide/css/core';

/**
 * Props for `Slider`.
 */
export type SliderProps = SliceComponentProps<Content.SliderSlice>;

/**
 * Component for "Slider" Slices.
 */
const Slider: FC<SliderProps> = ({ slice }) => {
  const splideRef = useRef<SplideClass | null>(null);
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Splide
        ref={splideRef}
        options={{
          rewind: true,
          gap: '2rem',
          pagination: false,
          arrows: false,
          perPage: 1.5,
          breakpoints: {
            900: { gap: '1rem', padding: '0' },
            600: { gap: '0.5rem', padding: '0' },
          },
        }}
        aria-label="Image Slider"
      >
        {slice.primary?.items?.map((item, idx) => (
          <SplideSlide key={idx}>
            {item?.image?.url && (
              <PrismicNextImage
                className="rounded-2xl"
                field={item.image}
                fallbackAlt=""
              />
            )}
          </SplideSlide>
        ))}
      </Splide>
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={() => splideRef.current?.go('<')}
          className="rounded-full w-16 h-16 bg-white p-3 text-2xl hover:bg-gray-100 transition"
          aria-label="Previous slide"
          type="button"
        >
          &larr;
        </button>
        <button
          onClick={() => splideRef.current?.go('>')}
          className="rounded-full w-16 h-16 bg-white p-3 text-2xl hover:bg-gray-100 transition"
          aria-label="Next slide"
          type="button"
        >
          &rarr;
        </button>
      </div>
    </section>
  );
};

export default Slider;
