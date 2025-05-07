export const setupFadeInAnimation = (element: HTMLElement | null, delay: number = 0) => {
  if (!element) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          }, delay);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}; 