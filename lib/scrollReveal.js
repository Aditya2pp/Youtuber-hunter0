/**
 * lib/scrollReveal.js
 * High-performance, silky smooth scroll reveal observer.
 * Triggers clean, hardware-accelerated animations when elements scroll into view.
 */

let observerInstance = null;

export function initScrollReveal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal], .reveal-on-scroll').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal everything immediately if IntersectionObserver isn't supported
    document.querySelectorAll('[data-reveal], .reveal-on-scroll').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  // Disconnect previous observer if re-initializing
  if (observerInstance) {
    observerInstance.disconnect();
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px', // Trigger slightly before coming fully into view
    threshold: 0.08,
  };

  observerInstance = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        // Once revealed, keep it visible and unobserve to save CPU/battery
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Find all unrevealed reveal elements
  const elements = document.querySelectorAll(
    '[data-reveal]:not(.is-revealed), .reveal-on-scroll:not(.is-revealed)'
  );

  elements.forEach((el) => {
    // If element is already in the viewport on scene mount, mark revealed immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-revealed');
    } else {
      // Below the fold: observe so it glides in on scroll (one-time only)
      observerInstance.observe(el);
    }
  });

  return observerInstance;
}

/**
 * React hook to auto-trigger scroll reveal whenever a component mounts or updates
 */
export function useScrollReveal(dependencies = []) {
  if (typeof window === 'undefined') return;
  
  // Call on mount & when dependencies change
  const timer = setTimeout(() => {
    initScrollReveal();
  }, 60);

  return () => clearTimeout(timer);
}
