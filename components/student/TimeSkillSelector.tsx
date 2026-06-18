"use client";
import { useState } from "react";
import { Music, Activity, Layers, ClipboardList } from "lucide-react";
import { startPracticeSession } from "@/app/actions/practice";

const DURATIONS = [5, 10] as const;
const SKILLS = [
  { value: "notes",  label: "קריאת תווים", Icon: Music,    activeBorder: "border-brand-pink",   activeBg: "bg-pink-50",   iconBg: "bg-pink-100",   iconText: "text-brand-pink",   dot: "bg-brand-pink" },
  { value: "rhythm", label: "מקצבים",      Icon: Activity, activeBorder: "border-brand-teal",   activeBg: "bg-teal-50",   iconBg: "bg-teal-100",   iconText: "text-brand-teal",   dot: "bg-brand-teal" },
  { value: "scales", label: "סולמות",       Icon: Layers,   activeBorder: "border-brand-purple", activeBg: "bg-purple-50", iconBg: "bg-purple-100", iconText: "text-brand-purple", dot: "bg-brand-purple" },
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

      {/* Assessment section — בולט למעלה */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-purple rounded-2xl p-4 shadow-lg">
        <p className="text-white font-bold text-base mb-3 text-right">🏆 בחן את הרמה שלך</p>
        <div className="flex flex-col gap-2">
          <a
            href="/practice/assess"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
          >
            <span className="text-xl">🎵</span>
            <span className="font-semibold">זיהוי תווים</span>
          </a>
          <a
            href="/practice/rhythm"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
          >
            <span className="text-xl">🥁</span>
            <span className="font-semibold">חוש קצב</span>
          </a>
          <a
            href="/practice/pitch"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
          >
            <span className="text-xl">🎤</span>
            <span className="font-semibold">גובה צליל</span>
          </a>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">כמה זמן יש לך?</p>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-4 rounded-xl text-lg font-bold border transition-all ${
                duration === d
                  ? "bg-brand-pink text-white border-brand-pink shadow-lg scale-105"
                  : "bg-brand-card border border-brand-border text-brand-muted"
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
          {SKILLS.map(({ value, label, Icon, activeBorder, activeBg, iconBg, iconText, dot }) => {
            const active = skill === value;
            return (
              <button
                key={value}
                onClick={() => setSkill(value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  active
                    ? `${activeBg} ${activeBorder} text-brand-text`
                    : "bg-brand-card border-brand-border text-brand-muted"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? iconBg : "bg-brand-border"}`}>
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={active ? iconText : "text-brand-muted"}
                  />
                </div>
                <span className="font-semibold">{label}</span>
                {active && (
                  <span className={`mr-auto w-1.5 h-1.5 rounded-full ${dot}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-brand-pink text-white font-bold rounded-xl w-full py-3 text-lg shadow-lg disabled:opacity-60 transition-all active:scale-95"
      >
        {loading ? "מייצר תרגול..." : "התחל תרגול"}
      </button>

    </div>
  );
}
