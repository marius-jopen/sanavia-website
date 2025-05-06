import { PrismicNextLink } from '@prismicio/next';
import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';

interface Item2ColumnsReversedProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const Item2ColumnsReversed: React.FC<Item2ColumnsReversedProps> = (props) => {
  return (
    <div className="pop-text-one-column flex gap-4 flex-row-reverse pb-16">
      {props.image && (
        <div className='w-1/2 flex justify-center flex-col'>
          <PrismicNextImage className="rounded-lg" field={props.image} fallbackAlt="" />
        </div>
      )}

      <div className='w-1/2 flex justify-center flex-col'>
        {props.headline && (
          <h3 className=''>
            {props.headline}
          </h3>
        )}

        {props.richtext && (
          <div className=''>
            <PrismicRichText field={props.richtext} />
          </div>
        )}
        
        {props.button && (
          <div className=''>
            <PrismicNextLink field={props.button} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Item2ColumnsReversed;
