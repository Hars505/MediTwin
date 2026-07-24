import { useRef, useEffect, useCallback } from "react";

const VELOCITY_WINDOW = 80;
const DECAY = 0.96;
const VELOCITY_THRESHOLD = 0.3;

export function useMarqueeDrag(ref, { speed = 0.5, reverse = false, enabled = true } = {}) {
  const s = useRef({
    x: 0,
    half: 0,
    rafId: null,
    active: false,
    pointerId: null,
    originX: 0,
    dragStartX: 0,
    history: [],
    momentum: null,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced =
      mq.matches || document.documentElement.dataset.reducedMotion === "on";

    const half = el.scrollWidth / 2;
    const st = s.current;
    st.x = reverse ? -half : 0;
    st.half = half;

    if (reduced) {
      el.style.transform = `translate3d(0, 0, 0)`;
      return;
    }

    el.style.transform = `translate3d(${st.x}px, 0, 0)`;
    el.style.willChange = "transform";
    el.style.touchAction = "none";

    function tick() {
      const st2 = s.current;
      if (st2.active) {
        // Just holding/dragging, x is updated in pointermove
      } else if (st2.momentum) {
        st2.momentum.vx *= DECAY;
        st2.x += st2.momentum.vx;
        if (Math.abs(st2.momentum.vx) < VELOCITY_THRESHOLD) {
          st2.momentum = null;
        }
      } else {
        if (reverse) {
          st2.x += speed;
        } else {
          st2.x -= speed;
        }
      }

      // Constrain within [-half, 0] seamlessly
      if (st2.half > 0) {
        while (st2.x > 0) st2.x -= st2.half;
        while (st2.x <= -st2.half) st2.x += st2.half;
      }

      el.style.transform = `translate3d(${st2.x}px, 0, 0)`;
      st2.rafId = requestAnimationFrame(tick);
    }
    st.rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(st.rafId);
  }, [ref, speed, reverse, enabled]);

  const onPointerDown = useCallback(
    (e) => {
      const st = s.current;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      st.active = true;
      st.pointerId = e.pointerId;
      st.originX = e.clientX;
      st.dragStartX = st.x;
      st.momentum = null;
      st.history = [{ x: e.clientX, t: performance.now() }];
      ref.current?.setPointerCapture?.(e.pointerId);
      ref.current?.classList.add("is-grabbing");
    },
    [ref],
  );

  const onPointerMove = useCallback(
    (e) => {
      const st = s.current;
      if (!st.active) return;
      const dx = e.clientX - st.originX;
      st.x = st.dragStartX + dx;
      const now = performance.now();
      st.history.push({ x: e.clientX, t: now });
      st.history = st.history.filter((h) => now - h.t < VELOCITY_WINDOW);
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    const st = s.current;
    if (!st.active) return;
    st.active = false;
    ref.current?.releasePointerCapture?.(st.pointerId);
    ref.current?.classList.remove("is-grabbing");

    let vx = 0;
    if (st.history.length >= 2) {
      const first = st.history[0];
      const last = st.history[st.history.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) {
        vx = ((last.x - first.x) / dt) * 16;
      }
    }
    st.history = [];

    if (Math.abs(vx) > VELOCITY_THRESHOLD) {
      st.momentum = { vx };
    }
  }, [ref]);

  const onPointerCancel = useCallback(() => {
    const st = s.current;
    st.active = false;
    st.momentum = null;
    st.history = [];
    ref.current?.classList.remove("is-grabbing");
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel]);

  useEffect(() => {
    const onBlur = () => {
      const st = s.current;
      st.active = false;
      st.momentum = null;
      ref.current?.classList.remove("is-grabbing");
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);
}
