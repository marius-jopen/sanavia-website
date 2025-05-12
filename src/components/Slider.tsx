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

  const goToSlide = (index: number) => {
    if (splide) {
      splide.go(index);
    }
  };

  return (
    <div className="relative">
      <Splide
        options={{
          type: 'loop',
          perPage: 1,
          perMove: 1,
          gap: '1rem',
          pagination: false,
        }}
        onMounted={(splideInstance: SplideInstance) => setSplide(splideInstance)}
        aria-label="Image Slider"
      >
        {images.map((image, index) => (
          <SplideSlide key={index}>
            <PrismicNextImage
              field={image}
              fallbackAlt="Slider image"
              className="w-full h-auto object-cover px-8 rounded-2xl overflow-hidden"
            />
          </SplideSlide>
        ))}
      </Splide>
      
      <div className="flex justify-center gap-4 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 