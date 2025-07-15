import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import VideoBasic from "../../components/VideoBasic";

import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField } from '@prismicio/client';

interface Item1ColumnProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
  video_url?: KeyTextField;
}

const Item1Column: React.FC<Item1ColumnProps> = (props) => {
  return (
    <div className="pop-text-one-column md:py-4">
        {props.image?.url && (
            <div className='mb-4 rounded-2xl overflow-hidden'>
                <VideoBasic
                url={props.video_url || undefined}
                poster={props.image}
                />
            </div>
        )}

        {props.headline && (
            <h3 className='pb-4'>
                {props.headline}
            </h3>
        )}

        {props.richtext && props.richtext.length > 0 && (
            <div className="text-neutral-500">
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
