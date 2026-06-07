"use client";

import { useEffect, useRef, useCallback } from "react";
import { RhythmPattern, DifficultyLevel, BPM, getBeatTimestamps } from "@/lib/rhythms";

interface Props {
  pattern: RhythmPattern;
  level: DifficultyLevel;
  onComplete: (hits: boolean[]) => void;
}

export default function RhythmDisplay({ pattern, level, onComplete }: Props) {
  const bpm = BPM[level];
  const msPerQuarter = 60000 / bpm;
  const totalMs = pattern.totalDuration * msPerQuarter;
  const beatTimestamps = getBeatTimestamps(pattern, bpm);

  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundedRef = useRef<Set<number>>(new Set());
  const tapTimesRef = useRef<number[]>([]);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onCompleteRef current so animation loop always calls the latest version
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const playClick = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 900;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }, []);

  const handleTap = useCallback(() => {
    // Guard before creating AudioContext
    if (doneRef.current) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= 0) tapTimesRef.current.push(elapsed);
  }, []);

  useEffect(() => {
    doneRef.current = false;
    soundedRef.current = new Set();
    tapTimesRef.current = [];
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Move ball
      if (ballRef.current && trackRef.current) {
        const progress = Math.min(elapsed / totalMs, 1);
        const trackWidth = trackRef.current.offsetWidth - 20; // 20 = ball diameter (w-5)
        ballRef.current.style.transform = `translateX(${progress * trackWidth}px)`;
      }

      // Play clicks at each tappable beat
      beatTimestamps.forEach((t, i) => {
        if (!soundedRef.current.has(i) && elapsed >= t && pattern.beats[i].tappable) {
          soundedRef.current.add(i);
          playClick();
        }
      });

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (!doneRef.current) {
        doneRef.current = true;
        // Evaluate: each tappable beat is a "hit" if any tap fell within ±200ms
        const hits = pattern.beats.map((beat, i) => {
          if (!beat.tappable) return true; // rests auto-pass
          const expected = beatTimestamps[i];
          return tapTimesRef.current.some((t) => Math.abs(t - expected) <= 200);
        });
        onCompleteRef.current(hits);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      doneRef.current = true;
      // Close AudioContext to avoid resource leak on remount
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [pattern, level]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-5">
      {/* Beat track */}
      <div className="bg-white rounded-2xl border-2 border-brand-border p-5 shadow-sm" dir="ltr">
        {/* Note symbols */}
        <div ref={trackRef} className="relative mb-4" style={{ height: "52px" }}>
          {pattern.beats.map((beat, i) => {
            const leftPct = (beatTimestamps[i] / totalMs) * 100;
            const widthPct = (beat.duration * msPerQuarter / totalMs) * 100;
            const size = beat.duration <= 0.5 ? 32 : beat.duration >= 2 ? 52 : 40;
            return (
              <div
                key={i}
                className="absolute top-0 flex items-center justify-center"
                style={{ left: `${leftPct}%`, width: `${widthPct}%`, height: "52px" }}
              >
                <div
                  className={`flex items-center justify-center rounded-lg text-xl border-2 font-bold select-none ${
                    beat.tappable
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-red-50 border-dashed border-red-200 text-red-400"
                  }`}
                  style={{ width: `${size}px`, height: "40px" }}
                >
                  {beat.symbol}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ball track */}
        <div className="relative h-5 bg-gray-100 rounded-full">
          <div
            ref={ballRef}
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
            style={{
              left: 0,
              background: "#22c55e",
              boxShadow: "0 0 10px rgba(34,197,94,0.7)",
            }}
          />
        </div>
      </div>

      {/* Drum button */}
      <div className="flex justify-center">
        <button
          onPointerDown={handleTap}
          aria-label="הקש"
          className="w-28 h-28 rounded-full flex items-center justify-center active:scale-90 transition-transform select-none"
          style={{
            background: "linear-gradient(135deg, #0d9488, #0891b2)",
            boxShadow: "0 6px 20px rgba(13,148,136,0.4)",
          }}
        >
          <svg width="65" height="65" viewBox="0 0 60 60" fill="none">
            <ellipse cx="30" cy="38" rx="18" ry="8" fill="#7c3aed" opacity="0.9" />
            <rect x="12" y="28" width="36" height="10" rx="2" fill="#6d28d9" />
            <ellipse cx="30" cy="28" rx="18" ry="8" fill="#8b5cf6" />
            <line x1="20" y1="10" x2="28" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="10" x2="32" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="9" r="3" fill="white" />
            <circle cx="40" cy="9" r="3" fill="white" />
          </svg>
        </button>
      </div>

      <p className="text-center text-sm text-brand-muted">הקש כשהכדור מגיע לכל תו 🟢</p>
    </div>
  );
}
