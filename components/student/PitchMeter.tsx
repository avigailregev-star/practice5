"use client";

import { useEffect, useRef } from "react";
import { DetectedNote } from "@/lib/pitchDetection";

interface Props {
  detectedNote: DetectedNote | null;
  isListening: boolean;
}

/**
 * Displays a horizontal pitch meter.
 * - Needle position driven by detectedNote.cents (-50 to +50)
 * - Needle color: green when ±20 cents, amber ±20–40, red >40
 * - Smooth animation via requestAnimationFrame lerp
 */
export default function PitchMeter({ detectedNote, isListening }: Props) {
  const needleRef = useRef<HTMLDivElement>(null);
  const targetCentsRef = useRef(0);
  const currentCentsRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Update target whenever detected note changes
  useEffect(() => {
    targetCentsRef.current = detectedNote
      ? Math.max(-50, Math.min(50, detectedNote.cents))
      : 0;
  }, [detectedNote]);

  // Lerp animation loop — runs for component lifetime
  useEffect(() => {
    const animate = () => {
      // Lerp toward target (factor 0.15 = smooth but responsive)
      currentCentsRef.current +=
        (targetCentsRef.current - currentCentsRef.current) * 0.15;

      if (needleRef.current) {
        // Map -50..50 cents → 5%..95% of track width, center at 50%
        const pct = ((currentCentsRef.current + 50) / 100) * 90 + 5;
        needleRef.current.style.left = `calc(${pct}% - 8px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const cents = detectedNote?.cents ?? 0;
  const absCents = Math.abs(cents);
  const inTune = absCents <= 20;
  const needleColor = inTune
    ? "#22c55e"
    : absCents <= 40
    ? "#f59e0b"
    : "#ef4444";

  const deviationLabel = !detectedNote
    ? null
    : inTune
    ? "מדויק ✓"
    : cents < -20
    ? cents < -40
      ? "נמוך מידי"
      : "קצת נמוך"
    : cents > 40
    ? "גבוה מידי"
    : "קצת גבוה";

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-sm">
      {/* Listening indicator */}
      <div className="text-center text-xs text-brand-muted mb-3">
        {isListening ? "🎤 מאזין..." : "⏸ מושהה"}
      </div>

      {/* Meter track */}
      <div className="relative h-9 bg-gray-100 rounded-full mb-2 overflow-hidden">
        {/* Green "in-tune" zone around center */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full"
          style={{ left: "44%", right: "44%", background: "#bbf7d0" }}
        />
        {/* Center reference line */}
        <div className="absolute top-2 bottom-2 left-1/2 w-0.5 -translate-x-1/2 bg-slate-400 rounded-full z-10" />
        {/* Pitch needle */}
        <div
          ref={needleRef}
          className="absolute top-1.5 bottom-1.5 w-4 rounded-full z-20 transition-colors duration-150"
          style={{
            left: "calc(50% - 8px)",
            background: needleColor,
            boxShadow: `0 0 8px ${needleColor}80`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] px-1 mb-2 select-none">
        <span className="text-red-400">♭ נמוך</span>
        <span className="text-green-600 font-semibold">מדויק</span>
        <span className="text-red-400">גבוה ♯</span>
      </div>

      {/* Detected note label */}
      <div className="text-center text-sm font-semibold min-h-[20px]" style={{ color: needleColor }}>
        {detectedNote
          ? `${detectedNote.hebrewName} — ${deviationLabel}`
          : "שר/נגן את התו..."}
      </div>
    </div>
  );
}
