"use client";
import type { Exercise } from "@/lib/ai/generate-exercise";
import dynamic from "next/dynamic";
import NoteAnswer from "./NoteAnswer";
import { Music, Activity, Layers, Lightbulb } from "lucide-react";
const MusicNotation = dynamic(() => import("./MusicNotation"), { ssr: false });
const RhythmNotation = dynamic(() => import("./RhythmNotation"), { ssr: false });

const SKILL_ICON: Record<string, React.ReactNode> = {
  notes:  <Music size={22} strokeWidth={1.5} className="text-brand-gold" />,
  rhythm: <Activity size={22} strokeWidth={1.5} className="text-brand-gold" />,
  scales: <Layers size={22} strokeWidth={1.5} className="text-brand-gold" />,
};

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0">
          {SKILL_ICON[exercise.skill_type]}
        </div>
        <div>
          <h2 className="font-bold text-lg text-white">{exercise.title}</h2>
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

      <div className="bg-brand-surface-2 rounded-xl p-4 mb-4 border border-brand-border">
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">שלבים</p>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-white">
              <span className="flex-shrink-0 w-5 h-5 bg-brand-gold text-black rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{step.replace(/^שלב \d+:\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-brand-surface-2 rounded-xl px-4 py-3 flex gap-3 border border-brand-border">
        <Lightbulb size={16} strokeWidth={1.5} className="text-brand-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-muted">{exercise.tip}</p>
      </div>
    </div>
  );
}
