"use client";

declare global {
  interface Window {
    acsbJS?: { openMenu?: () => void };
  }
}

export default function AccessibilityButton() {
  const handleClick = () => {
    if (typeof window !== "undefined" && window.acsbJS?.openMenu) {
      window.acsbJS.openMenu();
      return;
    }
    const trigger = document.querySelector<HTMLElement>(".acsb-trigger");
    trigger?.click();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-r-2xl pl-8 pr-4 py-2 bg-white hover:bg-black hover:text-white transition-colors block w-fit mt-2"
    >
      Accessibility
    </button>
  );
}
