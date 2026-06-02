"use client";
import { useState } from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";

const NOTE_NAMES_HE: Record<string, string> = {
  C: "דו", D: "רה", E: "מי", F: "פה",
  G: "סול", A: "לה", B: "סי",
};

function getNoteHebrew(note: string): string {
  const name = note.slice(0, -1);
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
          className="w-full flex items-center justify-center gap-2 bg-brand-card border border-brand-border text-brand-text rounded-xl py-3 font-semibold text-sm transition-all active:scale-95"
        >
          <Eye size={16} strokeWidth={1.5} />
          גלה תשובה
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand-card rounded-xl p-4 border border-brand-border">
            <p className="text-xs text-brand-muted mb-2 text-center">התווים הם:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-bold text-brand-text">
                    {getNoteHebrew(note)}
                  </span>
                  <span className="text-xs text-brand-muted">{note.slice(0, -1)}</span>
                </div>
              ))}
            </div>
          </div>

          {result === null ? (
            <div>
              <p className="text-xs text-center text-brand-muted mb-2">קראת נכון?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResult("correct")}
                  className="flex items-center justify-center gap-2 bg-green-50 border border-green-400 text-green-700 rounded-xl py-3 font-semibold text-sm"
                >
                  <CheckCircle size={16} strokeWidth={1.5} />
                  צדקתי
                </button>
                <button
                  onClick={() => setResult("wrong")}
                  className="flex items-center justify-center gap-2 bg-red-50 border border-red-400 text-red-700 rounded-xl py-3 font-semibold text-sm"
                >
                  <XCircle size={16} strokeWidth={1.5} />
                  טעיתי
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-3 text-center border ${
              result === "correct"
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-red-50 border-red-400 text-red-700"
            }`}>
              {result === "correct" ? (
                <p className="font-semibold">מצוין! כל הכבוד</p>
              ) : (
                <p className="font-semibold">לא נורא — תרגול עושה מושלם</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
