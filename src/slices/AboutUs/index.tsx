"use client"
import { FC, useEffect, useRef, useState } from "react";
import { Content, KeyTextField, ImageField, RichTextField } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoBasic from "@/components/VideoBasic";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

type AboutUsItem = {
  category?: KeyTextField;
  video_url?: KeyTextField;
  image?: ImageField;
  headline?: KeyTextField;
  richtext?: RichTextField;
};

/**
 * Props for `Team`.
 */
export type AboutUsProps = SliceComponentProps<Content.AboutUsSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

const categories = ["All", "Why", "What", "How", "Who", "The Team"];

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-700 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Component for "AboutUs" Slices.
 */
const AboutUs: FC<AboutUsProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedItem, setSelectedItem] = useState<AboutUsItem | null>(null);

  // 2. Filter items by selected category
  const filteredItems = selectedCategory === "All"
    ? slice.primary.items
    : slice.primary.items?.filter((item) => item.category === selectedCategory);

  const handleItemClick = (item: AboutUsItem) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    if (!gridRef.current || !enableAnimation) return;
    setupStaggeredAnimation(gridRef.current, {
      stagger: enableStagger ? 0.2 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }, [enableStagger, enableAnimation]);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-6 w-10/12"
    >
      {/* 3. Render filter buttons */}
      <div className="flex gap-2 mb-8 justify-left">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`px-8 py-4 hover:bg-neutral-100 transition \
              ${idx < 1 ? 'rounded-l-0 rounded-r-full' : 'rounded-l-full rounded-r-full'} \
              ${selectedCategory === cat
                ? "bg-white text-black"
                : "bg-white text-neutral-500"}
            `}
            onClick={() => setSelectedCategory(cat)}
          >
            <h3>
              {cat}
            </h3>
          </button>
        ))}
      </div>
      <div>
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
            const isFirstInRow = index % 3 === 0;
            return (
              <div 
                key={index} 
                className={`flex flex-col bg-white px-4 py-4 text-center cursor-pointer transition-all duration-300 hover:bg-neutral-100 ${
                  isFirstInRow ? 'pl-6 rounded-l-0 rounded-r-2xl' : 'rounded-2xl'
                }`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(item);
                  }
                }}
              >
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                  <VideoBasic
                    url={item.video_url || undefined}
                    poster={item.image}
                  />
                </div>
                {item.headline && (
                  <h3 className="pt-2 pb-2 text-xl font-bold mb-2">{item.headline}</h3>
                )}
                {item.richtext && (
                  <div className="px-12 text-sm text-gray-500">
                    <PrismicRichText field={item.richtext} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="p-8">
            <div className="overflow-hidden rounded-2xl aspect-[16/9] mb-6">
              <VideoBasic
                url={selectedItem.video_url || undefined}
                poster={selectedItem.image}
              />
            </div>
            {selectedItem.headline && (
              <h2 className="text-2xl font-bold mb-4">{selectedItem.headline}</h2>
            )}
            {selectedItem.richtext && (
              <div className="text-gray-600">
                <PrismicRichText field={selectedItem.richtext} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
};

export default AboutUs;

