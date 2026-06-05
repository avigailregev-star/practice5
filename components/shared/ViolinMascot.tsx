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
        style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.13))" }}
      >
        {/* ── Body — wobbly organic paths ── */}
        {/* Upper bout */}
        <path d="M34 52 C32 38 38 26 60 26 C82 26 88 38 86 52 C88 62 82 70 74 72 L46 72 C38 70 32 62 34 52 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2.2" strokeLinejoin="round" />

        {/* Waist */}
        <path d="M46 72 C40 78 40 86 46 92 L74 92 C80 86 80 78 74 72 Z"
          fill="#B8770A" stroke="#7A4A00" strokeWidth="2.2" />

        {/* Lower bout */}
        <path d="M26 112 C24 94 38 90 46 92 L74 92 C82 90 96 94 94 112 C96 130 80 140 60 140 C40 140 24 130 26 112 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2.2" strokeLinejoin="round" />

        {/* C-bouts */}
        <path d="M46 76 Q37 84 46 90" stroke="#7A4A00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M74 76 Q83 84 74 90" stroke="#7A4A00" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Wood grain */}
        <path d="M50 40 Q60 35 70 40" stroke="#A06608" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M48 108 Q60 103 72 108" stroke="#A06608" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M44 120 Q60 114 76 120" stroke="#A06608" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* F-holes */}
        <path d="M52 103 Q50 108 52 114 Q53 117 52 121" stroke="#7A4A00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M68 103 Q70 108 68 114 Q67 117 68 121" stroke="#7A4A00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="52" cy="102" r="2" fill="#7A4A00" />
        <circle cx="52" cy="122" r="2" fill="#7A4A00" />
        <circle cx="68" cy="102" r="2" fill="#7A4A00" />
        <circle cx="68" cy="122" r="2" fill="#7A4A00" />

        {/* Strings */}
        <line x1="57" y1="28" x2="57" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />
        <line x1="60" y1="28" x2="60" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />
        <line x1="63" y1="28" x2="63" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />

        {/* Bridge */}
        <path d="M54 107 Q60 104 66 107 L66 111 Q60 114 54 111 Z" fill="#8B6914" stroke="#5C3D00" strokeWidth="1" />

        {/* Neck — slightly wonky */}
        <path d="M53 22 Q52 40 54 72 L66 72 Q68 40 67 22 Z"
          fill="#B8770A" stroke="#7A4A00" strokeWidth="2" />

        {/* Scroll */}
        <path d="M52 20 Q54 10 60 9 Q66 10 68 20 Q66 24 60 24 Q54 24 52 20 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2" />
        <path d="M56 19 Q58 14 60 13 Q62 14 64 19 Q62 22 60 22 Q58 22 56 19 Z"
          fill="#A06608" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pegs */}
        <line x1="50" y1="26" x2="54" y2="32" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="70" y1="26" x2="66" y2="32" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="49" y1="33" x2="54" y2="38" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="71" y1="33" x2="66" y2="38" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── FACE ── */}
        {/* Eye whites — slightly uneven for charm */}
        <path d="M42 53 Q44 47 50 47 Q56 47 57 53 Q57 60 50 60 Q43 60 42 53 Z"
          fill="white" stroke="#7A4A00" strokeWidth="1.5" />
        <path d="M63 53 Q64 47 70 47 Q76 47 78 53 Q78 60 70 60 Q63 60 63 53 Z"
          fill="white" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pupils */}
        <circle cx={mood === "thinking" ? 48 : 51} cy="54" r="3.5" fill="#1a1a1a" />
        <circle cx={mood === "thinking" ? 68 : 71} cy="54" r="3.5" fill="#1a1a1a" />

        {/* Eye shine */}
        <circle cx={mood === "thinking" ? 49 : 52} cy="52.5" r="1.3" fill="white" />
        <circle cx={mood === "thinking" ? 69 : 72} cy="52.5" r="1.3" fill="white" />

        {/* Eyebrows — expressive */}
        {mood === "excited" && (
          <>
            <path d="M43 46 Q50 42 57 45" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 45 Q70 42 77 46" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {mood === "thinking" && (
          <>
            <path d="M43 47 Q50 45 57 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 45 Q70 48 77 46" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {(mood === "happy" || mood === "encouraging") && (
          <>
            <path d="M43 48 Q50 44 57 47" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 47 Q70 44 77 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="43" cy="62" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.45" />
        <ellipse cx="77" cy="62" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.45" />

        {/* Mouth */}
        {(mood === "happy" || mood === "encouraging") && (
          <path d="M52 67 Q60 74 68 67" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}
        {mood === "excited" && (
          <>
            <path d="M51 66 Q60 76 69 66" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M54 68 Q60 74 66 68 Q60 76 54 68 Z" fill="#FF6B6B" />
          </>
        )}
        {mood === "thinking" && (
          <path d="M53 68 Q60 66 67 70" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}

        {/* Arms — loose squiggly */}
        <path d="M32 88 C22 82 20 72 27 67 C30 63 36 64 36 64"
          stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M32 88 C22 82 20 72 27 67 C30 63 36 64 36 64"
          stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        <path d="M88 88 C98 82 100 72 93 67 C90 63 84 64 84 64"
          stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M88 88 C98 82 100 72 93 67 C90 63 84 64 84 64"
          stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Legs */}
        <path d="M50 138 C46 150 42 155 38 157" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M38 157 C34 159 32 156 34 154" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 138 C46 150 42 155 38 157 C34 159 32 156 34 154" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        <path d="M70 138 C74 150 78 155 82 157" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M82 157 C86 159 88 156 86 154" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M70 138 C74 150 78 155 82 157 C86 159 88 156 86 154" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Music notes floating */}
        {mood === "excited" && (
          <text x="90" y="38" fontSize="18" fill="#FF6B6B" opacity="0.9">♪</text>
        )}
        {mood === "happy" && (
          <text x="88" y="40" fontSize="16" fill="#F59E0B" opacity="0.9">♩</text>
        )}
      </svg>
    </div>
  );
}
