import { useEffect, useState } from "react";

/**
 * Medi Twin brand mark: two interlocking rings — a navy ring holding an ECG
 * heartbeat line, joined to a teal ring holding a medical plus.
 * In dark mode the rings shift to mint green so the logo stays visible.
 */
export function Logo({ className, inverted = false, showWordmark = true }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // In dark mode, the "navy" parts (left ring, ECG line, wordmark) flip to
  // white so the mark stays high-contrast, while the teal accent stays teal.
  // forceColors pins the brand across themes but still honors the dark-mode
  // white flip so the mark is readable on the dark navbar.
  const navy = dark && !inverted ? "#FFFFFF" : "#1E3A5F";
  const teal = dark && !inverted ? "#34d39a" : "#3CB4A8";
  const sub = inverted
    ? "rgba(255,255,255,0.65)"
    : dark
    ? "rgba(255,255,255,0.6)"
    : "#8FA3B8";
  const wordmark = inverted ? "#FFFFFF" : navy;

  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <svg
        viewBox="0 0 120 64"
        width="44"
        height="24"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Left ring */}
        <circle cx="40" cy="32" r="24" fill="none" stroke={navy} strokeWidth="6" />
        {/* Right ring */}
        <circle cx="80" cy="32" r="24" fill="none" stroke={teal} strokeWidth="6" />

        {/* ECG heartbeat line */}
        <path
          d="M20 32 H30 L34 22 L40 44 L46 20 L52 40 L56 32 H68"
          fill="none"
          stroke={navy}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Medical plus */}
        <g fill={teal}>
          <rect x="76" y="22" width="8" height="20" rx="1.5" />
          <rect x="70" y="28" width="20" height="8" rx="1.5" />
        </g>
      </svg>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="font-bold tracking-[0.14em] text-[15px]"
            style={{ color: wordmark }}
          >
            MEDI TWIN
          </span>
          <span
            className="tracking-[0.28em] text-[9px] mt-1"
            style={{ color: sub }}
          >
            MEDICAL APP
          </span>
        </span>
      )}
    </span>
  );
}
