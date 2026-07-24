import { useRef, useCallback, useEffect } from "react";

/**
 * GrabableStrip
 *
 * Wraps a horizontally-flowing strip (marquee or ribbon) and makes it drag-to-pan.
 * Push right -> the strip follows to the right. Push left -> follows to the left.
 * The CSS animation is paused on grab; the live drag offset overrides the transform.
 * On release the CSS animation resumes from the same offset, preserving direction
 * and the existing per-item tilt (a-hover-tilt is left untouched on children).
 *
 * Props:
 *   animationClass: "a-marquee" | "a-ribbon"  (the CSS animation to apply)
 *   reverse:        if true, runs the animation in reverse (e.g. bottom ribbon)
 *   speed:          seconds per loop (passed as inline animationDuration override)
 *   children:       strip content. IMPORTANT: render the items TWICE in a row so
 *                   the marquee reads as infinite, and the drag offset can wrap
 *                   smoothly without ever exposing an empty edge.
 */
export function GrabableStrip({
  animationClass = "a-marquee",
  reverse = false,
  speed,
  children,
  className = "",
}) {
  const stripRef = useRef(null);
  const drag = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    baseOffset: 0,
    currentOffset: 0,
  });

  // Build inline style: animation class + optional reverse + optional custom speed
  const baseStyle = {
    ...(reverse ? { animationDirection: "reverse" } : {}),
    ...(speed ? { animationDuration: `${speed}s` } : {}),
  };

  const onPointerDown = useCallback((e) => {
    const el = stripRef.current;
    if (!el) return;
    // Only primary button for mouse; touch/pen always grab
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current.active = true;
    drag.current.pointerId = e.pointerId;
    drag.current.startX = e.clientX;
    drag.current.baseOffset = drag.current.currentOffset;
    el.classList.add("is-dragging");
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return;
    const el = stripRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    // Push right (dx > 0) => positive offset, strip moves right under the finger.
    // Push left  (dx < 0) => negative offset, strip moves left.
    drag.current.currentOffset = drag.current.baseOffset + dx;
    el.style.transform = `translate3d(${drag.current.currentOffset}px, 0, 0)`;
  }, []);

  const onPointerEnd = useCallback((e) => {
    if (!drag.current.active) return;
    const el = stripRef.current;
    if (!el) return;
    drag.current.active = false;
    el.classList.remove("is-dragging");
    el.releasePointerCapture?.(drag.current.pointerId);
    // Clear the inline transform so the CSS animation takes over again
    el.style.transform = "";
  }, []);

  // Cancel drag if pointer leaves the window without an up event
  useEffect(() => {
    const cancel = () => {
      const el = stripRef.current;
      if (!el || !drag.current.active) return;
      drag.current.active = false;
      el.classList.remove("is-dragging");
      el.style.transform = "";
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  return (
    <div
      ref={stripRef}
      className={`flex whitespace-nowrap drag-strip ${animationClass} ${className}`}
      style={baseStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={(e) => {
        // pointerleave fires when the cursor leaves the element; if we're still
        // capturing we want to keep tracking until pointerup. Don't cancel here.
        if (drag.current.active) return;
      }}
    >
      {children}
    </div>
  );
}
