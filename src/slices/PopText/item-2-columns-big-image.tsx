import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';

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
          <PrismicNextImage className="rounded-2xl" field={props.image} fallbackAlt="" />
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
