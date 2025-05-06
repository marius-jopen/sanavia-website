import { PrismicNextLink } from '@prismicio/next';
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
    <div className="pop-text-one-column pb-16">
        {props.image && (
            <div className='pb-8'>
                <PrismicNextImage className="rounded-lg" field={props.image} fallbackAlt="" />
            </div>
        )}

        {props.headline && (
            <h3 className='pb-8'>
                {props.headline}
            </h3>
        )}

        {props.richtext && (
            <div className="pb-8">
                <PrismicRichText field={props.richtext} />
            </div>
        )}

        {props.button && (
            <div className='pb-8 md:flex justify-center'>
                <PrismicNextLink field={props.button} />
            </div>
        )}
    </div>
  );
};

export default Item1Column;
