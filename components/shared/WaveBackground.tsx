// components/shared/WaveBackground.tsx
export default function WaveBackground() {
  const bars = [
    { h: 28, dur: 0.8,  delay: 0 },
    { h: 52, dur: 1.1,  delay: 0.1 },
    { h: 22, dur: 0.7,  delay: 0.2 },
    { h: 68, dur: 1.3,  delay: 0.05 },
    { h: 38, dur: 0.9,  delay: 0.3 },
    { h: 58, dur: 1.0,  delay: 0.15 },
    { h: 18, dur: 0.6,  delay: 0.25 },
    { h: 75, dur: 1.4,  delay: 0.4 },
    { h: 32, dur: 0.85, delay: 0.1 },
    { h: 48, dur: 1.2,  delay: 0.35 },
    { h: 25, dur: 0.75, delay: 0.2 },
    { h: 62, dur: 1.1,  delay: 0.05 },
    { h: 35, dur: 0.95, delay: 0.3 },
    { h: 55, dur: 1.05, delay: 0.45 },
    { h: 20, dur: 0.65, delay: 0.15 },
    { h: 45, dur: 1.15, delay: 0 },
    { h: 30, dur: 0.88, delay: 0.25 },
    { h: 60, dur: 1.25, delay: 0.1 },
    { h: 40, dur: 0.92, delay: 0.35 },
    { h: 24, dur: 0.72, delay: 0.2 },
  ];

  return (
    <>
      <style>{`
        @keyframes wave-bar {
          from { height: 4px; }
          to   { height: var(--bar-h); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "3px",
          padding: "0 16px",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: "3px 3px 0 0",
              background: i % 2 === 0
                ? "linear-gradient(to top, #c9a84c, transparent)"
                : "linear-gradient(to top, #e8c96d, transparent)",
              animation: `wave-bar ${bar.dur}s ease-in-out ${bar.delay}s infinite alternate`,
              ["--bar-h" as string]: `${bar.h}px`,
            }}
          />
        ))}
      </div>
    </>
  );
}
