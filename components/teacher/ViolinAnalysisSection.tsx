// components/teacher/ViolinAnalysisSection.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ViolinAnalysisData {
  generated_at: string;
  avg_scores: Record<string, number>;
  difficulty_distribution: Record<string, number>;
}

interface Props {
  data: ViolinAnalysisData;
}

const SKILL_LABELS: Record<string, string> = {
  bow_control_score: "קשת",
  intonation_score: "גובה צליל",
  rhythm_score: "מקצב",
  sight_reading_score: "קריאה",
  scale_accuracy: "סולמות",
};

const SKILL_COLORS = ["#ff6b9d", "#4ecdc4", "#a29bfe", "#ff9f43", "#55efc4"];
const LEVEL_COLORS = ["#55efc4", "#74b9ff", "#fdcb6e", "#e17055", "#d63031"];

export default function ViolinAnalysisSection({ data }: Props) {
  const skillData = Object.entries(data.avg_scores).map(([key, value], i) => ({
    name: SKILL_LABELS[key] ?? key,
    value: Math.round(value),
    color: SKILL_COLORS[i % SKILL_COLORS.length],
  }));

  const diffData = Object.entries(data.difficulty_distribution).map(([level, count], i) => ({
    name: `רמה ${level}`,
    value: count,
    color: LEVEL_COLORS[i % LEVEL_COLORS.length],
  }));

  const date = new Date(data.generated_at).toLocaleDateString("he-IL");

  return (
    <div className="px-4 mb-6">
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-brand-text">📊 ניתוח כינור</h2>
          <span className="text-xs text-brand-muted">עודכן: {date}</span>
        </div>

        {/* Chart 1: avg score per skill */}
        <p className="text-xs font-semibold text-brand-muted mb-2">ממוצע ציון לכל מיומנות</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={skillData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}`, "ציון"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {skillData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Chart 2: difficulty distribution */}
        <p className="text-xs font-semibold text-brand-muted mt-4 mb-2">תלמידים לפי רמת קושי מומלצת</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={diffData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}`, "תלמידים"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {diffData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
