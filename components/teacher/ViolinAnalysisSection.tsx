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

interface SkillStat {
  skill: string;
  avgRating: number;
  count: number;
}

interface ViolinAnalysisData {
  skillStats: SkillStat[];
  difficultyDistribution: { level: number; count: number }[];
  totalSessions: number;
}

interface Props {
  data: ViolinAnalysisData;
}

const SKILL_COLORS = ["#ff6b9d", "#4ecdc4", "#a29bfe"];
const LEVEL_COLORS = ["#55efc4", "#74b9ff", "#fdcb6e", "#e17055", "#d63031"];

// Convert avg self_rating (1=easy,2=ok,3=hard) to 0-100 score (inverted: easy=high)
function ratingToScore(avg: number): number {
  return Math.round(((3 - avg) / 2) * 100);
}

export default function ViolinAnalysisSection({ data }: Props) {
  const skillData = data.skillStats.map((s, i) => ({
    name: s.skill,
    value: ratingToScore(s.avgRating),
    color: SKILL_COLORS[i % SKILL_COLORS.length],
    count: s.count,
  }));

  const diffData = data.difficultyDistribution.map((d, i) => ({
    name: `רמה ${d.level}`,
    value: d.count,
    color: LEVEL_COLORS[i % LEVEL_COLORS.length],
  }));

  if (data.totalSessions === 0) return null;

  return (
    <div className="px-4 mb-6">
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-brand-text">📊 סטטיסטיקות תרגול</h2>
          <span className="text-xs text-brand-muted">{data.totalSessions} תרגולים</span>
        </div>

        {skillData.length > 0 && (
          <>
            <p className="text-xs font-semibold text-brand-muted mb-2">רמת קושי ממוצעת לפי מיומנות</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={skillData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, _, props) => [`${v}/100`, `${props.payload.count} דירוגים`]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {skillData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {diffData.length > 0 && (
          <>
            <p className="text-xs font-semibold text-brand-muted mt-4 mb-2">תלמידים לפי רמת קושי</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={diffData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}`, "תרגולים"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {diffData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
