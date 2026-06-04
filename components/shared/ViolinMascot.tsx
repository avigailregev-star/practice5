"use client";

type Mood = "happy" | "excited" | "thinking" | "encouraging";

interface ViolinMascotProps {
  mood?: Mood;
  size?: number;
  className?: string;
  message?: string;
}

const MESSAGES: Record<Mood, string[]> = {
  happy: ["יאללה נתרגל! 🎵", "בוא נשבור שיאים היום!", "מוכן לנגן? 🎻"],
  excited: ["וואו, כל הכבוד! 🌟", "אתה מדהים!", "ממש גאה בך! 🎉"],
  thinking: ["איזה תחום נתרגל היום?", "כל יום קצת — זה הסוד! 💡", "מה הלך הרוח?"],
  encouraging: ["כמעט שם, תמשיך! 💪", "כל תרגול חשוב!", "אל תוותר, אתה מתקדם! ⭐"],
};

export default function ViolinMascot({
  mood = "happy",
  size = 120,
  className = "",
  message,
}: ViolinMascotProps) {
  const msgs = MESSAGES[mood];
  const displayMsg = message ?? msgs[Math.floor(Date.now() / 10000) % msgs.length];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Speech bubble */}
      <div className="relative bg-white border border-brand-border rounded-2xl px-3 py-2 text-sm font-medium text-brand-text shadow-sm max-w-[180px] text-center">
        {displayMsg}
        {/* Bubble tail */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid white",
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[-10px] w-0 h-0"
          style={{
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: "9px solid #e5e7eb",
            zIndex: -1,
          }}
        />
      </div>

      {/* Violin SVG character */}
      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 120 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" }}
      >
        {/* ── Body of violin ── */}
        {/* Upper bout */}
        <ellipse cx="60" cy="52" rx="28" ry="26" fill="#C8860A" />
        {/* Waist */}
        <rect x="46" y="72" width="28" height="24" rx="4" fill="#B8770A" />
        {/* Lower bout */}
        <ellipse cx="60" cy="112" rx="34" ry="32" fill="#C8860A" />

        {/* Wood grain lines */}
        <path d="M50 42 Q60 36 70 42" stroke="#A06608" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M48 52 Q60 46 72 52" stroke="#A06608" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M46 108 Q60 100 74 108" stroke="#A06608" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M44 118 Q60 110 76 118" stroke="#A06608" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Outline */}
        <ellipse cx="60" cy="52" rx="28" ry="26" stroke="#7A4A00" strokeWidth="2.5" fill="none" />
        <rect x="46" y="72" width="28" height="24" rx="4" stroke="#7A4A00" strokeWidth="2.5" fill="none" />
        <ellipse cx="60" cy="112" rx="34" ry="32" stroke="#7A4A00" strokeWidth="2.5" fill="none" />

        {/* C-bouts (waist cutouts) */}
        <path d="M46 76 Q38 84 46 92" stroke="#7A4A00" strokeWidth="2" fill="none" />
        <path d="M74 76 Q82 84 74 92" stroke="#7A4A00" strokeWidth="2" fill="none" />

        {/* F-holes */}
        <path d="M53 104 Q51 108 53 114 Q54 116 53 120" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M67 104 Q69 108 67 114 Q66 116 67 120" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="53" cy="103" r="2" fill="#7A4A00" />
        <circle cx="53" cy="121" r="2" fill="#7A4A00" />
        <circle cx="67" cy="103" r="2" fill="#7A4A00" />
        <circle cx="67" cy="121" r="2" fill="#7A4A00" />

        {/* Strings */}
        <line x1="57" y1="30" x2="57" y2="140" stroke="#D4C5A0" strokeWidth="1" opacity="0.8" />
        <line x1="60" y1="30" x2="60" y2="140" stroke="#D4C5A0" strokeWidth="1" opacity="0.8" />
        <line x1="63" y1="30" x2="63" y2="140" stroke="#D4C5A0" strokeWidth="1" opacity="0.8" />

        {/* Bridge */}
        <rect x="54" y="106" width="12" height="4" rx="1" fill="#8B6914" stroke="#5C3D00" strokeWidth="1" />

        {/* Neck */}
        <rect x="54" y="20" width="12" height="34" rx="4" fill="#B8770A" stroke="#7A4A00" strokeWidth="2" />

        {/* Scroll (head) */}
        <circle cx="60" cy="18" r="8" fill="#C8860A" stroke="#7A4A00" strokeWidth="2" />
        <circle cx="60" cy="18" r="4" fill="#A06608" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pegs */}
        <line x1="50" y1="25" x2="54" y2="30" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="70" y1="25" x2="66" y2="30" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="32" x2="54" y2="36" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="70" y1="32" x2="66" y2="36" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── FACE ── */}
        {/* Eyes white */}
        <ellipse cx="50" cy="56" rx="7" ry="7.5" fill="white" stroke="#7A4A00" strokeWidth="1.5" />
        <ellipse cx="70" cy="56" rx="7" ry="7.5" fill="white" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pupils */}
        <circle cx={mood === "thinking" ? 48 : 51} cy="56" r="3.5" fill="#1a1a1a" />
        <circle cx={mood === "thinking" ? 68 : 71} cy="56" r="3.5" fill="#1a1a1a" />

        {/* Eye shine */}
        <circle cx={mood === "thinking" ? 49 : 52} cy="54.5" r="1.2" fill="white" />
        <circle cx={mood === "thinking" ? 69 : 72} cy="54.5" r="1.2" fill="white" />

        {/* Eyebrows */}
        {mood === "excited" && (
          <>
            <path d="M44 48 Q50 44 56 47" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M64 47 Q70 44 76 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {mood === "thinking" && (
          <>
            <path d="M44 48 Q50 46 56 49" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M64 46 Q70 49 76 47" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {(mood === "happy" || mood === "encouraging") && (
          <>
            <path d="M44 49 Q50 46 56 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M64 48 Q70 46 76 49" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="44" cy="63" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.5" />
        <ellipse cx="76" cy="63" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.5" />

        {/* Mouth */}
        {(mood === "happy" || mood === "encouraging") && (
          <path d="M52 67 Q60 74 68 67" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}
        {mood === "excited" && (
          <>
            <path d="M51 66 Q60 76 69 66" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <ellipse cx="60" cy="69" rx="6" ry="5" fill="#FF6B6B" stroke="#5C3D00" strokeWidth="1.5" />
          </>
        )}
        {mood === "thinking" && (
          <path d="M53 68 Q60 66 67 70" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}

        {/* Little arms */}
        <path d="M32 90 Q24 80 28 70" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M28 70 Q30 64 36 66" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M88 90 Q96 80 92 70" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M92 70 Q90 64 84 66" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Arm outlines */}
        <path d="M32 90 Q24 80 28 70 Q30 64 36 66" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M88 90 Q96 80 92 70 Q90 64 84 66" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Little legs / feet */}
        <path d="M50 140 Q46 152 42 156" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M42 156 Q38 160 34 156" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M70 140 Q74 152 78 156" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M78 156 Q82 160 86 156" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Leg outlines */}
        <path d="M50 140 Q46 152 42 156 Q38 160 34 156" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M70 140 Q74 152 78 156 Q82 160 86 156" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Music note floating */}
        {mood === "excited" && (
          <text x="90" y="40" fontSize="18" fill="#FF6B6B" opacity="0.9">♪</text>
        )}
        {mood === "happy" && (
          <text x="88" y="42" fontSize="16" fill="#F59E0B" opacity="0.9">♩</text>
        )}
      </svg>
    </div>
  );
}
