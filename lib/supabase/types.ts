export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'student' | 'teacher'
          avatar_url: string | null
          instrument: string | null
          level: number
          xp: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'student' | 'teacher'
          avatar_url?: string | null
          instrument?: string | null
          level?: number
          xp?: number
          created_at?: string
        }
        Update: {
          name?: string
          role?: 'student' | 'teacher'
          avatar_url?: string | null
          instrument?: string | null
          level?: number
          xp?: number
        }
      }
      practice_sessions: {
        Row: {
          id: string
          student_id: string
          duration_minutes: 5 | 10 | 15 | 20
          skill_type: 'notes' | 'rhythm' | 'scales'
          difficulty_level: number
          exercise_content: Record<string, unknown>
          completed_at: string | null
          started_at: string
          xp_earned: number
        }
        Insert: {
          id?: string
          student_id: string
          duration_minutes: 5 | 10 | 15 | 20
          skill_type: 'notes' | 'rhythm' | 'scales'
          difficulty_level?: number
          exercise_content: Record<string, unknown>
          completed_at?: string | null
          started_at?: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          xp_earned?: number
        }
      }
      achievements: {
        Row: {
          id: string
          student_id: string
          achievement_type: string
          earned_at: string
        }
        Insert: {
          id?: string
          student_id: string
          achievement_type: string
          earned_at?: string
        }
        Update: Record<string, never>
      }
      teacher_students: {
        Row: {
          teacher_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          teacher_id: string
          student_id: string
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
