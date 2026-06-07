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

      {/* Dog mascot image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot-dog.png"
        alt="mascot"
        style={{ width: size, height: "auto", filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.13))" }}
      />
    </div>
  );
}
