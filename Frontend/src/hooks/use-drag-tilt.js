import { useRef, useCallback, useEffect } from "react";

const VELOCITY_WINDOW = 80;
const MAX_TILT = 14;
const TILT_FACTOR = 0.07;
const DECAY = 0.96;
const VELOCITY_THRESHOLD = 0.3;

export function useDragTilt(ref, { alternate = false } = {}) {
  const s = useRef({
    active: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    offsetX: 0,
    startTime: 0,
    history: [],
    momentum: null,
    rafId: null,
    settling: false,
  });

  function applyTransform(x, tilt) {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, 0, 0) rotate(${tilt}deg)`;
  }

  function clearAnimation() {
    const d = s.current;
    if (d.rafId) cancelAnimationFrame(d.rafId);
    d.rafId = null;
    d.momentum = null;
  }

  function settle() {
    const d = s.current;
    if (d.settling) return;
    d.settling = true;
    const el = ref.current;
    if (!el) return;
    el.style.transition =
      "transform 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    el.style.transform = "";
    setTimeout(() => {
      const el2 = ref.current;
      if (!el2) return;
      el2.style.transition = "";
      el2.classList.remove("is-dragging");
      d.settling = false;
    }, 580);
  }

  function startMomentum(vx) {
    const d = s.current;
    clearAnimation();
    d.momentum = { vx, px: d.offsetX };
    const alt = alternate ? -1 : 1;

    function tick() {
      const m = d.momentum;
      if (!m) return;
      m.vx *= DECAY;
      m.px += m.vx;
      d.offsetX = m.px;

      const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, m.vx * TILT_FACTOR)) * alt;
      applyTransform(m.px, tilt);

      if (Math.abs(m.vx) > VELOCITY_THRESHOLD) {
        d.rafId = requestAnimationFrame(tick);
      } else {
        clearAnimation();
        settle();
      }
    }
    d.rafId = requestAnimationFrame(tick);
  }

  const onPointerDown = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearAnimation();
    const d = s.current;
    d.active = true;
    d.pointerId = e.pointerId;
    d.originX = e.clientX;
    d.offsetX = 0;
    d.history = [{ x: e.clientX, t: performance.now() }];
    el.classList.add("is-dragging");
    el.style.transition = "none";
    el.setPointerCapture?.(e.pointerId);
  }, [ref]);

  const onPointerMove = useCallback((e) => {
    const d = s.current;
    if (!d.active) return;
    const dx = e.clientX - d.originX;
    d.offsetX = dx;

    const now = performance.now();
    d.history.push({ x: e.clientX, t: now });
    d.history = d.history.filter((h) => now - h.t < VELOCITY_WINDOW);

    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * TILT_FACTOR)) * (alternate ? -1 : 1);
    applyTransform(dx, tilt);
  }, [ref, alternate]);

  const onPointerUp = useCallback(() => {
    const d = s.current;
    if (!d.active) return;
    const el = ref.current;
    if (!el) return;
    d.active = false;
    el.releasePointerCapture?.(d.pointerId);

    const history = d.history;
    let vx = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) {
        vx = ((last.x - first.x) / dt) * 16;
      }
    }

    el.style.transition = "";

    if (Math.abs(vx) > 0.4) {
      startMomentum(vx);
    } else {
      settle();
    }
  }, [ref]);

  const onPointerCancel = useCallback(() => {
    const d = s.current;
    if (!d.active) return;
    d.active = false;
    clearAnimation();
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-dragging");
    el.style.transition = "";
    el.style.transform = "";
  }, [ref]);

  useEffect(() => {
    const d = s.current;
    const cancel = () => {
      if (!d.active) return;
      d.active = false;
      clearAnimation();
      const el = ref.current;
      if (!el) return;
      el.classList.remove("is-dragging");
      el.style.transition = "";
      el.style.transform = "";
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pointercancel", cancel);
      clearAnimation();
    };
  }, [ref]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
