import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';

import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';

interface Item1ColumnProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
}

const Item1Column: React.FC<Item1ColumnProps> = (props) => {
  return (
    <div className="pop-text-one-column md:py-4">
        {props.image?.url && (
            <div className='pb-8'>
                <PrismicNextImage className="rounded-2xl" field={props.image} fallbackAlt="" />
            </div>
        )}

        {props.headline && (
            <h3 className='pb-8'>
                {props.headline}
            </h3>
        )}

        {props.richtext && props.richtext.length > 0 && (
            <div className="">
                <PrismicRichText field={props.richtext} />
            </div>
        )}

        {props.button?.text && (
            <div className='flex justify-center w-full'>
                <Button className="mt-4" field={props.button} />
            </div>
        )}
    </div>
  );
};

export default Item1Column;
