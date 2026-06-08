"use client";
import type { Exercise } from "@/lib/ai/generate-exercise";
import dynamic from "next/dynamic";
import { useState } from "react";
import NoteAnswer from "./NoteAnswer";
import { Music, Activity, Layers, Lightbulb, Check } from "lucide-react";
const MusicNotation = dynamic(() => import("./MusicNotation"), { ssr: false });
const RhythmNotation = dynamic(() => import("./RhythmNotation"), { ssr: false });

const SKILL_ICON: Record<string, React.ReactNode> = {
  notes:  <Music size={22} strokeWidth={1.5} className="text-brand-pink" />,
  rhythm: <Activity size={22} strokeWidth={1.5} className="text-brand-teal" />,
  scales: <Layers size={22} strokeWidth={1.5} className="text-brand-purple" />,
};

const SKILL_ICON_BG: Record<string, string> = {
  notes:  "bg-pink-100",
  rhythm: "bg-teal-100",
  scales: "bg-purple-100",
};

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [checked, setChecked] = useState<boolean[]>(() => exercise.steps.map(() => false));

  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const allDone = checked.every(Boolean);

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${SKILL_ICON_BG[exercise.skill_type] ?? "bg-brand-border"}`}>
          {SKILL_ICON[exercise.skill_type]}
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-brand-text">{exercise.title}</h2>
          <p className="text-sm text-brand-muted">{exercise.description}</p>
        </div>
      </div>

      {exercise.skill_type === "notes" && exercise.notes_to_show && exercise.notes_to_show.length > 0 && (
        <div className="mb-4">
          <MusicNotation notes={exercise.notes_to_show} />
          <NoteAnswer notes={exercise.notes_to_show} />
        </div>
      )}

      {exercise.skill_type === "rhythm" && exercise.rhythm_pattern && (
        <div className="mb-4">
          <RhythmNotation pattern={exercise.rhythm_pattern} />
        </div>
      )}

      {exercise.skill_type === "scales" && exercise.scale_notes && exercise.scale_notes.length > 0 && (
        <div className="mb-4">
          <MusicNotation notes={exercise.scale_notes} label="נגן את הסולם" />
        </div>
      )}

      <div className="bg-brand-card rounded-xl p-4 mb-4 border border-brand-border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-brand-muted tracking-widest">שלבים</p>
          {allDone && (
            <span className="text-xs font-bold text-green-600 animate-bounce">✅ כל הכבוד!</span>
          )}
        </div>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li
              key={i}
              onClick={() => toggle(i)}
              className={`anim-step flex gap-3 text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all active:scale-98 select-none
                ${checked[i]
                  ? "bg-green-50 border border-green-200"
                  : "hover:bg-brand-pink/8 border border-transparent"
                }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Checkbox */}
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
                ${checked[i]
                  ? "bg-green-500 scale-110"
                  : "bg-brand-pink text-white text-xs font-bold"
                }`}>
                {checked[i]
                  ? <Check size={13} strokeWidth={3} className="text-white" />
                  : <span className="text-white text-xs font-bold">{i + 1}</span>
                }
              </span>
              <span className={`pt-0.5 transition-all duration-200 ${checked[i] ? "line-through text-brand-muted" : "text-brand-text"}`}>
                {step.replace(/^שלב \d+:\s*/, "")}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-brand-card rounded-xl px-4 py-3 flex gap-3 border border-brand-border">
        <Lightbulb size={16} strokeWidth={1.5} className="text-brand-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-muted">{exercise.tip}</p>
      </div>
    </div>
  );
}
