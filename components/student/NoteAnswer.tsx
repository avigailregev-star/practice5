"use client";
import { useState } from "react";

const NOTE_NAMES_HE: Record<string, string> = {
  C: "דו",
  D: "רה",
  E: "מי",
  F: "פה",
  G: "סול",
  A: "לה",
  B: "סי",
};

function getNoteHebrew(note: string): string {
  const name = note.slice(0, -1); // "C" from "C4"
  return NOTE_NAMES_HE[name] ?? name;
}

export default function NoteAnswer({ notes }: { notes: string[] }) {
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  return (
    <div className="mt-3">
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full border-2 border-brand-red text-brand-red rounded-2xl py-3 font-semibold text-sm transition-all active:scale-95"
        >
          גלה תשובה 👁️
        </button>
      ) : (
        <div className="space-y-3">
          {/* Note names */}
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-2 text-center">התווים הם:</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-bold text-green-700">
                    {getNoteHebrew(note)}
                  </span>
                  <span className="text-xs text-gray-400">{note.slice(0, -1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Self assessment */}
          {result === null ? (
            <div>
              <p className="text-xs text-center text-gray-500 mb-2">קראת נכון?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResult("correct")}
                  className="bg-green-100 text-green-700 rounded-2xl py-3 font-semibold text-sm border-2 border-green-200"
                >
                  צדקתי ✅
                </button>
                <button
                  onClick={() => setResult("wrong")}
                  className="bg-red-50 text-red-600 rounded-2xl py-3 font-semibold text-sm border-2 border-red-100"
                >
                  טעיתי ❌
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl p-3 text-center ${result === "correct" ? "bg-green-100" : "bg-orange-50"}`}>
              {result === "correct" ? (
                <p className="font-semibold text-green-700">מצוין! כל הכבוד 🌟</p>
              ) : (
                <p className="font-semibold text-orange-700">לא נורא — תרגול עושה מושלם! 💪</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
