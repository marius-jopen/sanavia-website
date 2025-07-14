import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';
import VideoBasic from "../../components/VideoBasic";

interface ItemImage2ColumnsProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  rich_text_2?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const ItemImage2Columns: React.FC<ItemImage2ColumnsProps> = (props) => {
  return (
    <div className="pop-text-one-column md:py-4">
      {props.image && (
        <div className='mb-4 rounded-2xl overflow-hidden'>
          {/* <PrismicNextImage className="rounded-2xl" field={props.image} fallbackAlt="" /> */}
          <VideoBasic
          url={props.video_url || undefined}
          poster={props.image}
          />
        </div>
      )}

      <div className='flex gap-4 pb-8'>
        {props.headline && (
          <h3 className='w-1/2'>
            {props.headline}
          </h3>
        )}

        <div className='flex justify-end w-full'>
          <Button className="mt-4" field={props.button} />
        </div>
      </div>

        <div className='flex flex-row gap-6'>
            {props.richtext && props.richtext.length > 0 && (
                <div className="w-1/2 text-neutral-500">
                    <PrismicRichText field={props.richtext} />
                </div>
            )}

            {props.rich_text_2 && props.rich_text_2.length > 0 && (
                <div className="w-1/2 text-neutral-500">
                    <PrismicRichText field={props.rich_text_2} />
                </div>
            )}
        </div>
    </div>
  );
};

export default ItemImage2Columns;
