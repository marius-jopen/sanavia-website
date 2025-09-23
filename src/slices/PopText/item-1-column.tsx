import Button from '@/components/Button';
import { PrismicRichText } from '@prismicio/react';
import VideoBasic from "../../components/VideoBasic";

import React from 'react';
import { KeyTextField, RichTextField, ImageField, LinkField, BooleanField } from '@prismicio/client';

interface Item1ColumnProps {
  headline?: KeyTextField;
  richtext?: RichTextField;
  image?: ImageField;
  button?: LinkField;
  video_url?: KeyTextField;
  autoplay?: BooleanField;
}

const Item1Column: React.FC<Item1ColumnProps> = (props) => {
  return (
    <div className="pop-text-one-column md:pt-4">
        {props.image?.url && (
            <div className='mb-4 rounded-2xl overflow-hidden brightness-[0.97] '>
                <VideoBasic
                url={props.video_url || undefined}
                poster={props.image}
                autoplay={props.autoplay}
                />
            </div>
        )}

        {props.headline && (
            <h3 className={(props.richtext && props.richtext.length > 0) || props.button?.text ? 'pb-4' : 'pb-0'}>
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
