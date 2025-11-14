import { PrismicNextLink } from '@prismicio/next';
import { LinkField, isFilled } from '@prismicio/client';

interface ButtonProps {
  field?: LinkField;
  className?: string; // wrapper classes
  button?: LinkField;
  onClick?: () => void;
  label?: string;
  innerClassName?: string; // classes applied to the clickable element itself
}

export default function Button({ field, className, button, onClick, label, innerClassName }: ButtonProps) {
  // If an onClick handler is provided, render a native button (modal triggers, etc.)
  if (onClick) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onClick}
          className={innerClassName || "text-white bg-black rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200"}
        >
          {label}
        </button>
      </div>
    );
  }

  // Default: render a Prismic link button
  const linkField = field || button;
  if (!isFilled.link(linkField)) return null;
  
  return (
    <div className={className}>
      <PrismicNextLink 
        field={linkField}
        className={innerClassName || "text-white bg-black rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200"}
      />
    </div>
  );
}
