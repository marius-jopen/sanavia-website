import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';
import Button from '@/components/Button';

interface Item2ColumnsBigImageReversedProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const Item2ColumnsBigImageReversed: React.FC<Item2ColumnsBigImageReversedProps> = (props) => {
  return (
    <div className="pop-text-one-column flex gap-8 flex-row-reverse md:py-4">
      {props.image && (
        <div className='w-7/12 flex justify-center flex-col'>
          <PrismicNextImage className="rounded-lg" field={props.image} fallbackAlt="" />
        </div>
      )}

      <div className='w-5/12 flex justify-center flex-col'>
        {props.headline && (
          <h3 className='mb-8'>
            {props.headline}
          </h3>
        )}

        {props.richtext && props.richtext.length > 0 && (
          <div className=''>
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

export default Item2ColumnsBigImageReversed;
