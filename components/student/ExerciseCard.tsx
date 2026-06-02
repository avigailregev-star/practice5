"use client";
import type { Exercise } from "@/lib/ai/generate-exercise";
import dynamic from "next/dynamic";
import NoteAnswer from "./NoteAnswer";
const MusicNotation = dynamic(() => import("./MusicNotation"), { ssr: false });

const SKILL_EMOJI: Record<string, string> = {
  notes: "🎼",
  rhythm: "🥁",
  scales: "🎹",
};

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{SKILL_EMOJI[exercise.skill_type]}</span>
        <div>
          <h2 className="font-bold text-lg text-gray-900">{exercise.title}</h2>
          <p className="text-sm text-gray-500">{exercise.description}</p>
        </div>
      </div>

      {exercise.skill_type === "notes" && exercise.notes_to_show && exercise.notes_to_show.length > 0 && (
        <div className="mb-4">
          <MusicNotation notes={exercise.notes_to_show} />
          <NoteAnswer notes={exercise.notes_to_show} />
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">שלבים</p>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 bg-brand-red text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{step.replace(/^שלב \d+:\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-yellow-50 rounded-2xl px-4 py-3 flex gap-2">
        <span>💡</span>
        <p className="text-sm text-yellow-800">{exercise.tip}</p>
      </div>
    </div>
  );
}
