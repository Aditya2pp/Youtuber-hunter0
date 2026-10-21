/**
 * lib/scrollReveal.js
 * High-performance, silky smooth scroll reveal observer.
 * Triggers clean, hardware-accelerated glide-in animations when elements scroll into view.
 * Each element animates once on time, with zero repeated stutter.
 */

let observerInstance = null;
let parallaxBound = false;

export function initScrollReveal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Ensure js-ready class is applied
  document.documentElement.classList.add('js-ready');

  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal, [data-reveal], .reveal-pop, .reveal-on-scroll').forEach((el) => {
      el.classList.add('revealed', 'is-revealed');
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal immediately if IntersectionObserver isn't supported
    document.querySelectorAll('.reveal, [data-reveal], .reveal-pop, .reveal-on-scroll').forEach((el) => {
      el.classList.add('revealed', 'is-revealed');
    });
    return;
  }

  // Disconnect previous observer if re-initializing
  if (observerInstance) {
    observerInstance.disconnect();
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -20px 0px',
    threshold: 0.01,
  };

  observerInstance = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed', 'is-revealed');
        // Unobserve immediately so scrolling back up doesn't re-trigger it
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Find all unrevealed reveal elements
  const selector = '.reveal:not(.revealed):not(.is-revealed), [data-reveal]:not([data-reveal="none"]):not(.revealed):not(.is-revealed), .reveal-pop:not(.revealed):not(.is-revealed), .reveal-on-scroll:not(.revealed):not(.is-revealed)';
  const elements = document.querySelectorAll(selector);

  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // If element is already in or above the visible viewport, reveal immediately with zero flicker
    if (rect.top <= windowHeight && rect.bottom >= 0) {
      el.classList.add('revealed', 'is-revealed');
    } else {
      observerInstance.observe(el);
    }
  });

  // Attach gentle scroll parallax for hero floating cards on desktop (max 20-30px shift)
  if (!parallaxBound && typeof window !== 'undefined') {
    parallaxBound = true;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled < 900 && window.innerWidth >= 768) {
            const shift1 = Math.min(24, scrolled * 0.045);
            const shift2 = Math.min(20, -scrolled * 0.038);
            const shift3 = Math.min(22, scrolled * 0.035);
            const p1 = document.getElementById('hero-float-card-1');
            const p2 = document.getElementById('hero-float-card-2');
            const p3 = document.getElementById('hero-float-card-3');
            if (p1) p1.style.transform = `translateY(${shift1}px)`;
            if (p2) p2.style.transform = `translateY(${shift2}px)`;
            if (p3) p3.style.transform = `translateY(${shift3}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  return observerInstance;
}

/**
 * React hook to auto-trigger scroll reveal whenever a component mounts or updates
 */
export function useScrollReveal(dependencies = []) {
  if (typeof window === 'undefined') return;
  
  const timer = setTimeout(() => {
    initScrollReveal();
  }, 40);

  return () => clearTimeout(timer);
}
