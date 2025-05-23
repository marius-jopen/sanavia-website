'use client';

import { Splide, SplideSlide } from '@splidejs/react-splide';
import type { Splide as SplideInstance } from '@splidejs/splide';
import '@splidejs/react-splide/css';
import { useState } from 'react';
import { PrismicNextImage } from '@prismicio/next';
import { ImageField } from '@prismicio/client';

interface SliderProps {
  images: ImageField[];
}

export default function Slider({ images }: SliderProps) {
  const [splide, setSplide] = useState<SplideInstance | null>(null);

  const goToPrev = () => {
    if (splide) {
      splide.go('<');
    }
  };

  const goToNext = () => {
    if (splide) {
      splide.go('>');
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      <Splide
        className="overflow-visible"
        options={{
          type: 'loop',
          perPage: 1,
          perMove: 1,
          gap: '1rem',
          pagination: false,
          arrows: false,
          drag: true,
          padding: '20vw',
          wheel: false,
          releaseWheel: false,
          keyboard: 'global',
          speed: 600,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          trimSpace: false,
          focus: 0,
          omitEnd: true,
          breakpoints: {
            768: {
              perPage: 1,
              gap: '0.5rem',
              padding: '12vw'
            },
            480: {
              perPage: 1,
              gap: '0.5rem',
              padding: '8vw'
            },
          },
        }}
        onMounted={(splideInstance: SplideInstance) => setSplide(splideInstance)}
        aria-label="Image Slider"
      >
        {images.map((image, index) => (
          <SplideSlide key={index}>
            <PrismicNextImage
                field={image}
                fallbackAlt=""
                className="w-full h-auto object-cover rounded-2xl pointer-events-none"
              />
          </SplideSlide>
        ))}
      </Splide>
      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={goToPrev}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-white hover:bg-black hover:text-white transition-colors text-2xl"
          aria-label="Previous slide"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button
          onClick={goToNext}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-white hover:bg-black hover:text-white transition-colors text-2xl"
          aria-label="Next slide"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>
  );
} 