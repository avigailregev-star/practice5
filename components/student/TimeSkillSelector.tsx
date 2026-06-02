"use client";
import { useState } from "react";
import { Music, Activity, Layers } from "lucide-react";
import { startPracticeSession } from "@/app/actions/practice";

const DURATIONS = [5, 10, 15, 20] as const;
const SKILLS = [
  { value: "notes",  label: "קריאת תווים", Icon: Music },
  { value: "rhythm", label: "מקצבים",      Icon: Activity },
  { value: "scales", label: "סולמות",       Icon: Layers },
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
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">כמה זמן יש לך?</p>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-4 rounded-xl text-lg font-bold border transition-all ${
                duration === d
                  ? "bg-brand-gold text-black border-brand-gold shadow-lg scale-105"
                  : "bg-brand-surface-2 text-brand-muted border-brand-border"
              }`}
            >
              {d}
              <span className="text-sm font-normal mr-1">דק'</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">מה לתרגל?</p>
        <div className="flex flex-col gap-2">
          {SKILLS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setSkill(value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                skill === value
                  ? "bg-brand-surface border-brand-gold text-white"
                  : "bg-brand-surface-2 border-brand-border text-brand-muted"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                className={skill === value ? "text-brand-gold" : "text-brand-muted"}
              />
              <span className="font-semibold">{label}</span>
              {skill === value && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-gold text-black rounded-xl py-4 font-bold text-lg shadow-lg disabled:opacity-60 transition-all active:scale-95"
      >
        {loading ? "מייצר תרגול..." : "התחל תרגול"}
      </button>
    </div>
  );
}
