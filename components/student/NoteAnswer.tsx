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
          className="w-full flex items-center justify-center gap-2 border border-brand-border bg-brand-surface-2 text-brand-muted rounded-xl py-3 font-semibold text-sm transition-all hover:border-brand-gold hover:text-brand-gold active:scale-95"
        >
          <Eye size={16} strokeWidth={1.5} />
          גלה תשובה
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand-surface rounded-xl p-4 border border-brand-border">
            <p className="text-xs text-brand-muted mb-2 text-center">התווים הם:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-bold text-brand-gold">
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
                  className="flex items-center justify-center gap-2 bg-brand-surface border border-green-800 text-green-400 rounded-xl py-3 font-semibold text-sm"
                >
                  <CheckCircle size={16} strokeWidth={1.5} />
                  צדקתי
                </button>
                <button
                  onClick={() => setResult("wrong")}
                  className="flex items-center justify-center gap-2 bg-brand-surface border border-red-900 text-red-400 rounded-xl py-3 font-semibold text-sm"
                >
                  <XCircle size={16} strokeWidth={1.5} />
                  טעיתי
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-3 text-center border ${
              result === "correct"
                ? "bg-green-950 border-green-800 text-green-400"
                : "bg-orange-950 border-orange-800 text-orange-400"
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
