import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';
import VideoBasic from "../../components/VideoBasic";

interface Item2ColumnsBigImageProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const Item2ColumnsBigImage: React.FC<Item2ColumnsBigImageProps> = (props) => {
  return (
    <div className="pop-text-one-column flex gap-8 md:py-4">
      {props.image && (
        <div className='w-7/12 flex justify-center flex-col'>
          <div className='mb-4 rounded-2xl overflow-hidden'>
            <VideoBasic
            url={props.video_url || undefined}
            poster={props.image}
            className="rounded-2xl"
            />
          </div>
        </div>
      )}

      <div className='w-5/12 flex justify-center flex-col'>
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

export default Item2ColumnsBigImage;
