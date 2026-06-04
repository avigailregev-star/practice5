// components/student/SelfRatingWidget.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { updateSelfRating } from "@/app/actions/rating";

interface Props {
  sessionId: string;
}

const OPTIONS: { value: 1 | 2 | 3; emoji: string; label: string }[] = [
  { value: 1, emoji: "😊", label: "קל" },
  { value: 2, emoji: "😐", label: "בסדר" },
  { value: 3, emoji: "😓", label: "קשה" },
];

export default function SelfRatingWidget({ sessionId }: Props) {
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSelect(value: 1 | 2 | 3) {
    setSelected(value);
    await updateSelfRating(sessionId, value);
    setSaved(true);
  }

  return (
    <div className="my-6 text-center">
      <p className="text-sm font-semibold text-brand-text mb-3">איך הרגשת?</p>

      <div className="flex justify-center gap-3 mb-5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={saved}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all ${
              selected === opt.value
                ? "border-brand-pink bg-brand-pink/10 scale-105"
                : "border-brand-border bg-brand-card hover:border-brand-pink/40"
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-xs font-medium text-brand-text">{opt.label}</span>
          </button>
        ))}
      </div>

      {saved ? (
        <Link
          href="/practice"
          className="block w-full bg-brand-pink text-white rounded-xl py-3 font-bold text-lg"
        >
          לתרגול הבא
        </Link>
      ) : (
        <Link
          href="/practice"
          className="block text-center text-sm text-brand-muted mt-2"
        >
          דלג
        </Link>
      )}
    </div>
  );
}
