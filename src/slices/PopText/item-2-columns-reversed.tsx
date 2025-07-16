import { PrismicRichText } from '@prismicio/react';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField, BooleanField } from '@prismicio/client';
import Button from '@/components/Button';
import VideoBasic from "../../components/VideoBasic";

interface Item2ColumnsReversedProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
  video_url?: KeyTextField;
  autoplay?: BooleanField;
}

const Item2ColumnsReversed: React.FC<Item2ColumnsReversedProps> = (props) => {
  return (
    <div className="pop-text-one-column flex gap-8 flex-row-reverse md:py-4">
      {props.image && (
        <div className='w-1/2 flex justify-center flex-col'>
          <div className='mb-4 rounded-2xl overflow-hidden'>
            <VideoBasic
            url={props.video_url || undefined}
            poster={props.image}
            autoplay={props.autoplay}
            />
          </div>
        </div>
      )}

      <div className='w-1/2 flex justify-center flex-col'>
        {props.headline && (
          <h3 className='mb-4'>
            {props.headline}
          </h3>
        )}

        {props.richtext && props.richtext.length > 0 && (
          <div className='text-neutral-500'>
            <PrismicRichText field={props.richtext} />
          </div>
        )}
        
        <div className='flex justify-center w-full'>
            <Button className="mt-4" field={props.button} />
        </div>
      </div>
    </div>
  );
};

export default Item2ColumnsReversed;
