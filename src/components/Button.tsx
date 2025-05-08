import { PrismicNextLink } from '@prismicio/next';
import { LinkField, isFilled } from '@prismicio/client';

interface ButtonProps {
  field?: LinkField;
  className?: string;
  button?: LinkField;
}

export default function Button({ field, className, button }: ButtonProps) {
  const linkField = field || button;
  if (!isFilled.link(linkField)) return null;
  
  return (
    <div className={className}>
      <PrismicNextLink 
        field={linkField}
        className="text-white bg-black rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200"
      />
    </div>
  );
}
