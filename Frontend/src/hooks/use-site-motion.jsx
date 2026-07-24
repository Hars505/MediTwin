import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight reveal-on-scroll wrapper using IntersectionObserver.
 * Adds the `a-fade-up` class once the element enters the viewport.
 */
export function Reveal({ children, delay = 0, as: As = 'div', className = '', style = {}, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <As
      ref={ref}
      className={`${on ? 'a-fade-up' : ''} ${className}`.trim()}
      style={on ? { animationDelay: `${delay}s`, ...style } : { opacity: 0, ...style }}
      {...rest}
    >
      {children}
    </As>
  );
}

/**
 * Drives a seamless infinite horizontal scroll using requestAnimationFrame.
 * Moves left (or right when `reverse`) at `speed` px/frame and wraps at
 * ±50% scrollWidth so duplicated content creates an invisible loop.
 */
export function useInfiniteScroll(ref, { speed = 0.5, reverse = false, enabled = true } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = mq.matches || document.documentElement.dataset.reducedMotion === 'on';
    if (reduced) return;

    const half = el.scrollWidth / 2;
    let x = reverse ? -half : 0;
    let id = 0;

    el.style.transform = `translate3d(${x}px, 0, 0)`;
    el.style.willChange = 'transform';

    const step = () => {
      if (reverse) {
        x += speed;
        if (x >= 0) x -= half;
      } else {
        x -= speed;
        if (x <= -half) x += half;
      }
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [ref, speed, reverse, enabled]);
}

/**
 * Locomotive-style scroll parallax + momentum-hover follow.
 * Reads `data-scroll-speed`, `data-scroll-rotate`, `data-momentum`
 * attributes and updates CSS custom properties accordingly.
 */
export function useSiteMotion() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parallaxEls = Array.from(document.querySelectorAll('[data-scroll-speed]'));
    const rotateEls = Array.from(document.querySelectorAll('[data-scroll-rotate]'));
    const momentumEls = Array.from(document.querySelectorAll('[data-momentum]'));

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches || document.documentElement.dataset.reducedMotion === 'on';
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        for (const el of parallaxEls) {
          const speed = parseFloat(el.dataset.scrollSpeed || '0');
          const rect = el.getBoundingClientRect();
          const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
          el.style.setProperty('--py', reduced ? '0px' : `${progress * speed * 140}px`);
        }
        ticking = false;
      });
    };

    const rotateStates = new Map();
    for (const el of rotateEls) rotateStates.set(el, { current: 0, target: 0, velocity: 0 });
    let rafId = 0;
    const spring = { k: 0.08, d: 0.82 };
    const animateRotation = () => {
      const vh = window.innerHeight;
      for (const el of rotateEls) {
        const speed = parseFloat(el.dataset.scrollRotate || '0');
        const state = rotateStates.get(el);
        const rect = el.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        state.target = progress * speed;
        const force = (state.target - state.current) * spring.k;
        state.velocity = (state.velocity + force) * spring.d;
        state.current += state.velocity;
        el.style.setProperty('--rot', reduced ? '0deg' : `${state.current}deg`);
      }
      rafId = requestAnimationFrame(animateRotation);
    };
    animateRotation();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const cleanups = [];
    for (const el of momentumEls) {
      const strength = parseFloat(el.dataset.momentum || '18');
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        el.style.setProperty('--mx', `${cx}px`);
        el.style.setProperty('--my', `${cy}px`);
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(loop);
        else raf = 0;
      };
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        tx = px * strength;
        ty = py * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        if (raf) cancelAnimationFrame(raf);
      });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      cleanups.forEach((c) => c());
    };
  }, []);
}
