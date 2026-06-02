"use client";
import { useState } from "react";
import { startPracticeSession } from "@/app/actions/practice";

const DURATIONS = [5, 10, 15, 20] as const;
const SKILLS = [
  { value: "notes", label: "קריאת תווים", emoji: "🎼" },
  { value: "rhythm", label: "מקצבים", emoji: "🥁" },
  { value: "scales", label: "סולמות", emoji: "🎹" },
] as const;

export default function TimeSkillSelector() {
  const [duration, setDuration] = useState<number>(10);
  const [skill, setSkill] = useState<string>("notes");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const form = new FormData();
    form.set("duration", String(duration));
    form.set("skill", skill);
    await startPracticeSession(form);
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">כמה זמן יש לך?</p>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-4 rounded-2xl text-lg font-bold border-2 transition-all ${
                duration === d
                  ? "bg-brand-red text-white border-brand-red shadow-lg scale-105"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {d}
              <span className="text-sm font-normal mr-1">דקות</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">מה לתרגל?</p>
        <div className="flex flex-col gap-2">
          {SKILLS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSkill(s.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                skill === s.value
                  ? "bg-red-50 border-brand-red text-brand-red"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="font-semibold">{s.label}</span>
              {skill === s.value && <span className="mr-auto">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-red text-white rounded-2xl py-4 font-bold text-lg shadow-lg disabled:opacity-60 transition-all active:scale-95"
      >
        {loading ? "מייצר תרגול... ⏳" : "בוא נתחיל! ▶"}
      </button>
    </div>
  );
}
