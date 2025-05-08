import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';
import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';

interface ItemImage2ColumnsProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const ItemImage2Columns: React.FC<ItemImage2ColumnsProps> = (props) => {
  return (
    <div className="pop-text-one-column py-4">
      {props.image && (
        <div className='pb-8'>
          <PrismicNextImage className="rounded-2xl" field={props.image} fallbackAlt="" />
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

      {props.richtext && (
        <div className='columns-2 gap-4'>
          <PrismicRichText field={props.richtext} />
        </div>
      )}
    </div>
  );
};

export default ItemImage2Columns;
