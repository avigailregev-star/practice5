"use client";

import { useState } from "react";

const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים",
  rhythm: "מקצבים",
  scales: "סולמות",
};

const RATING_EMOJI: Record<number, string> = { 1: "😊", 2: "😐", 3: "😓" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `לפני ${days} ימים`;
  if (hours > 0) return `לפני ${hours} שעות`;
  if (minutes > 0) return `לפני ${minutes} דקות`;
  return "עכשיו";
}

function ratingBadge(avg: number): { emoji: string; label: string } {
  if (avg < 1.7) return { emoji: "😊", label: "קל בממוצע" };
  if (avg <= 2.3) return { emoji: "😐", label: "בסדר בממוצע" };
  return { emoji: "😓", label: "קשה בממוצע" };
}

interface Session {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
  self_rating: number | null;
}

interface LastSession {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
}

interface StudentCardProps {
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
  avgRating?: number;
  sessions?: Session[];
  recommendedLevel?: number | null;
}

export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
  avgRating,
  sessions = [],
  recommendedLevel,
}: StudentCardProps) {
  const [open, setOpen] = useState(false);
  const initial = name[0] ?? "?";
  const practicedToday = lastSession
    ? new Date(lastSession.completed_at).toDateString() === new Date().toDateString()
    : false;

  const badge = avgRating != null ? ratingBadge(avgRating) : null;

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
            practicedToday ? "bg-brand-teal text-white" : "bg-brand-border text-brand-muted"
          }`}>
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-brand-text">{name}</span>
              <span className="text-xs bg-brand-bg text-brand-muted border border-brand-border px-2 py-0.5 rounded-full">
                רמה {level}
              </span>
              {practicedToday && (
                <span className="text-xs bg-brand-teal/10 border border-brand-teal/20 text-brand-teal px-2 py-0.5 rounded-full">
                  תרגל היום
                </span>
              )}
              {badge && (
                <span className="text-xs bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full">
                  {badge.emoji} {badge.label}
                </span>
              )}
              {recommendedLevel != null && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  recommendedLevel > level
                    ? "bg-green-50 text-green-700 border-green-300"
                    : recommendedLevel < level
                    ? "bg-orange-50 text-orange-700 border-orange-300"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {recommendedLevel > level ? "⬆️" : recommendedLevel < level ? "⬇️" : "🟰"} רמה מומלצת: {recommendedLevel}
                </span>
              )}
            </div>

            {lastSession ? (
              <div className="text-sm text-brand-muted mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{SKILL_LABEL[lastSession.skill_type] ?? lastSession.skill_type}</span>
                <span>·</span>
                <span>{lastSession.duration_minutes} דק'</span>
                <span>·</span>
                <span>{timeAgo(lastSession.completed_at)}</span>
              </div>
            ) : (
              <p className="text-sm text-brand-muted mt-0.5">טרם תרגל</p>
            )}
          </div>

          <div className="text-center flex-shrink-0">
            <p className="text-lg font-bold text-brand-teal">{sessionCount}</p>
            <p className="text-xs text-brand-muted">תרגולים</p>
          </div>
        </div>

        {/* Toggle button */}
        {sessions.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 w-full text-xs text-brand-muted border border-brand-border rounded-xl py-1.5 hover:bg-brand-bg transition-colors"
          >
            {open ? "▲ הסתר היסטוריה" : `▼ הצג היסטוריה (${sessions.length} אימונים)`}
          </button>
        )}
      </div>

      {/* Session history */}
      {open && sessions.length > 0 && (
        <div className="border-t border-brand-border bg-brand-bg px-4 py-3 space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-brand-muted">
                <span>{SKILL_LABEL[s.skill_type] ?? s.skill_type}</span>
                <span>·</span>
                <span>{s.duration_minutes} דק'</span>
                <span>·</span>
                <span>{timeAgo(s.completed_at)}</span>
              </div>
              {s.self_rating != null && (
                <span className="text-base">{RATING_EMOJI[s.self_rating]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
