"use client"
import { FC, useEffect, useRef, useState } from "react";
import { Content, KeyTextField, ImageField, RichTextField } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoBasic from "@/components/VideoBasic";
import Modal from "@/components/Modal";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

type AboutUsItem = {
  category?: KeyTextField;
  video_url?: KeyTextField;
  image?: ImageField;
  headline?: KeyTextField;
  richtext?: RichTextField;
  visible?: boolean;
};

/**
 * Props for `Team`.
 */
export type AboutUsProps = SliceComponentProps<Content.AboutUsSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

const categories = ["All", "Why", "What", "How", "Who"];

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

  // Early return if not visible
  if (!((slice.primary as any).visible ?? true)) return null;


  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-6 md:w-10/12 mr-4 md:mr-0"
    >
      {/* 3. Render filter buttons */}
      <div className="hidden md:flex gap-2 mb-8 justify-left">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`px-8 py-4 hover:bg-black hover:text-white transition \
              ${idx < 1 ? 'rounded-l-0 rounded-r-full' : 'rounded-l-full rounded-r-full'} \
              ${selectedCategory === cat
                ? "bg-black text-white"
                : "bg-white text-black"}
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
                className={` flex flex-col bg-white px-4 py-4  cursor-pointer transition-all duration-300 hover:cursor-pointer ${
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
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-4 cursor-pointer">
                  <VideoBasic
                    url={item.video_url || undefined}
                    poster={item.image}
                  />
                </div>
                {item.headline && (
                  <h3 className="pt-2 pb-2 text-xl font-bold mb-2 cursor-pointer">{item.headline}</h3>
                )}
                {item.richtext && (
                  <div className=" text-sm text-gray-500 cursor-pointer text-left">
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

