import { PrismicNextLink } from '@prismicio/next';
import { LinkField, isFilled } from '@prismicio/client';

interface ButtonProps {
  field?: LinkField;
  className?: string; // wrapper classes
  button?: LinkField;
  onClick?: () => void;
  label?: string;
  innerClassName?: string; // classes applied to the clickable element itself
  /**
   * Optional descriptive context used to turn generic CTA text
   * ("Learn more", "Read more") into something specific for SEO
   * and screen readers (e.g. "Learn more about What We Do").
   */
  context?: string;
}

const GENERIC_CTA = /^(learn|read|find out|click|see|view)\s+(more|here)$/i;

function humaniseUid(uid?: string | null) {
  if (!uid) return "";
  return uid.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveContext(linkField: LinkField, override?: string) {
  if (override) return override;
  if (linkField.link_type === "Document" && "uid" in linkField) {
    return humaniseUid(linkField.uid);
  }
  return "";
}

export default function Button({ field, className, button, onClick, label, innerClassName, context }: ButtonProps) {
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

  const linkText = linkField.text?.trim();
  const isGeneric = linkText ? GENERIC_CTA.test(linkText) : false;
  const descriptiveContext = resolveContext(linkField, context);
  const descriptiveText =
    isGeneric && descriptiveContext ? `${linkText} about ${descriptiveContext}` : null;

  const innerClass =
    innerClassName ||
    "text-white bg-black rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200";

  return (
    <div className={className}>
      {descriptiveText ? (
        <PrismicNextLink
          field={linkField}
          aria-label={descriptiveText}
          className={innerClass}
        >
          {descriptiveText}
        </PrismicNextLink>
      ) : (
        <PrismicNextLink field={linkField} className={innerClass} />
      )}
    </div>
  );
}
