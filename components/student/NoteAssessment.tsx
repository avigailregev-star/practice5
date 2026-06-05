"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import StaffDisplay from "./StaffDisplay";
import ViolinMascot from "@/components/shared/ViolinMascot";
import {
  DifficultyLevel,
  NoteData,
  NoteName,
  generateChoices,
  pickRandomNote,
  scoreLabel,
} from "@/lib/notes";

type AnimState = "idle" | "correct" | "wrong" | "levelup" | "leveldown";

interface Props {
  studentId: string;
  initialLevel: DifficultyLevel;
}

function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#ff6b9d", "#4ecdc4", "#a29bfe", "#ff9f43", "#51cf66"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{
            left: `${10 + (i * 5) % 85}%`,
            top: "-10px",
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${0.8 + (i % 4) * 0.15}s ease ${(i % 5) * 0.08}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function Sparkles() {
  const stars = ["✨", "⭐", "🌟", "💫"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute text-xl"
          style={{
            left: `${20 + i * 18}%`,
            top: `${15 + (i % 2) * 25}%`,
            animation: `sparkle 0.7s ease ${i * 0.1}s forwards`,
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

export default function NoteAssessment({ studentId, initialLevel }: Props) {
  const clampLevel = (l: number): DifficultyLevel =>
    (Math.max(1, Math.min(3, l)) as DifficultyLevel);

  const [level, setLevel] = useState<DifficultyLevel>(clampLevel(initialLevel));
  const [currentNote, setCurrentNote] = useState<NoteData>(() =>
    pickRandomNote(clampLevel(initialLevel))
  );
  const [choices, setChoices] = useState<NoteName[]>(() =>
    generateChoices(pickRandomNote(clampLevel(initialLevel)))
  );
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [maxLevel, setMaxLevel] = useState<DifficultyLevel>(clampLevel(initialLevel));
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteAnimClass, setNoteAnimClass] = useState("anim-slide-in");

  const nextQuestion = useCallback((newLevel: DifficultyLevel, prevSymbol: string) => {
    setNoteAnimClass("anim-slide-out");
    setTimeout(() => {
      const note = pickRandomNote(newLevel, prevSymbol);
      setCurrentNote(note);
      setChoices(generateChoices(note));
      setNoteAnimClass("anim-slide-in");
    }, 300);
  }, []);

  const handleAnswer = useCallback(
    (chosen: NoteName) => {
      if (animState !== "idle") return;

      const isCorrect = chosen === currentNote.name;
      const newAnswered = totalAnswered + 1;
      const newCorrect = isCorrect ? totalCorrect + 1 : totalCorrect;
      setTotalAnswered(newAnswered);
      setTotalCorrect(newCorrect);

      if (isCorrect) {
        const newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        setWrongStreak(0);

        if (newStreak >= 3 && level < 3) {
          const newLevel = clampLevel(level + 1);
          setLevel(newLevel);
          setMaxLevel((prev) => clampLevel(Math.max(prev, newLevel)));
          setCorrectStreak(0);
          setAnimState("levelup");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(newLevel, currentNote.abcSymbol);
          }, 1800);
        } else {
          setAnimState("correct");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(level, currentNote.abcSymbol);
          }, 700);
        }
      } else {
        const newWrongStreak = wrongStreak + 1;
        setWrongStreak(newWrongStreak);
        setCorrectStreak(0);

        if (newWrongStreak >= 2 && level > 1) {
          const newLevel = clampLevel(level - 1);
          setLevel(newLevel);
          setWrongStreak(0);
          setAnimState("leveldown");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(newLevel, currentNote.abcSymbol);
          }, 1500);
        } else {
          setAnimState("wrong");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(level, currentNote.abcSymbol);
          }, 700);
        }
      }
    },
    [animState, currentNote, correctStreak, wrongStreak, level, totalAnswered, totalCorrect, nextQuestion]
  );

  const handleFinish = useCallback(async () => {
    if (totalAnswered === 0) { setIsDone(true); return; }
    setSaving(true);
    const score = Math.round((totalCorrect / totalAnswered) * 100);
    const supabase = createClient();
    await supabase.from("assessments").insert({
      student_id: studentId,
      type: "notes",
      score,
      max_level: maxLevel,
      total_correct: totalCorrect,
      total_answered: totalAnswered,
    });
    setSaving(false);
    setIsDone(true);
  }, [studentId, totalAnswered, totalCorrect, maxLevel]);

  const score = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <ViolinMascot
          mood={score >= 70 ? "excited" : "encouraging"}
          size={100}
          message={scoreLabel(score)}
        />
        <div className="bg-white rounded-2xl border border-brand-border p-6 w-full text-center shadow-sm">
          <p className="text-4xl font-extrabold text-brand-teal">{score}%</p>
          <p className="text-sm text-brand-muted mt-1">
            {totalCorrect} נכונות מתוך {totalAnswered}
          </p>
          <p className="text-sm text-brand-muted">רמה מקסימלית שהגעת: {maxLevel}</p>
        </div>
        <a
          href="/practice"
          className="w-full bg-brand-teal text-white font-bold py-3 rounded-2xl text-center block"
        >
          חזרה לתרגול
        </a>
      </div>
    );
  }

  const mascotMood =
    animState === "levelup" ? "excited"
    : animState === "leveldown" ? "encouraging"
    : animState === "correct" ? "happy"
    : "thinking";

  const mascotMessage =
    animState === "levelup" ? "וואו! עלית רמה! 🎉"
    : animState === "leveldown" ? "בסדר, ננסה שוב 💪"
    : animState === "correct" ? "כל הכבוד! ⭐"
    : animState === "wrong" ? "כמעט... נסה שוב!"
    : undefined;

  const levelLabels: Record<DifficultyLevel, string> = {
    1: "קל",
    2: "בינוני",
    3: "קשה",
  };

  return (
    <div
      className={`flex flex-col gap-4 px-4 py-4 relative ${
        animState === "wrong" ? "anim-screen-shake" : ""
      }`}
    >
      {animState === "levelup" && <Confetti />}
      {animState === "correct" && <Sparkles />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="text-sm text-brand-muted border border-brand-border rounded-xl px-3 py-1.5"
        >
          {saving ? "שומר..." : "סיום מבחן"}
        </button>
        <div className="text-center">
          <p className="text-xs text-brand-muted">רמה</p>
          <p className="font-bold text-brand-text">{levelLabels[level]}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted">ניקוד</p>
          <p className="font-bold text-brand-teal">{totalCorrect}/{totalAnswered}</p>
        </div>
      </div>

      {/* Streak indicator */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < correctStreak ? "bg-brand-teal scale-110" : "bg-brand-border"
            }`}
          />
        ))}
      </div>

      {/* Staff */}
      <StaffDisplay
        abcSymbol={currentNote.abcSymbol}
        animClass={noteAnimClass}
      />

      {/* Question */}
      <p className="text-center font-semibold text-brand-text">
        איזה תו זה?
      </p>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3">
        {choices.map((name) => {
          const isCorrect = name === currentNote.name;
          const showResult = animState === "correct" || animState === "wrong";
          return (
            <button
              key={name}
              onClick={() => handleAnswer(name)}
              disabled={animState !== "idle"}
              className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                showResult && isCorrect
                  ? "bg-green-100 border-green-400 text-green-700 anim-note-bounce"
                  : showResult && !isCorrect
                  ? "bg-red-50 border-red-300 text-red-400 opacity-60"
                  : "bg-white border-brand-border text-brand-text active:scale-95"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center mt-2">
        <ViolinMascot mood={mascotMood} size={80} message={mascotMessage} />
      </div>
    </div>
  );
}
