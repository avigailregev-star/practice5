-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  avatar_url TEXT,
  instrument TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teacher-Student relationships
CREATE TABLE teacher_students (
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, student_id)
);

-- Practice sessions
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (5, 10, 15, 20)),
  skill_type TEXT NOT NULL CHECK (skill_type IN ('notes', 'rhythm', 'scales')),
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  exercise_content JSONB NOT NULL,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_earned INTEGER NOT NULL DEFAULT 0
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: enable on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies: profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS policies: practice_sessions
CREATE POLICY "Students view own sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students insert own sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own sessions" ON practice_sessions
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers view student sessions" ON practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_id = auth.uid() AND student_id = practice_sessions.student_id
    )
  );

-- RLS policies: achievements
CREATE POLICY "Students view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers view student achievements" ON achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_id = auth.uid() AND student_id = achievements.student_id
    )
  );

-- RLS policies: teacher_students
CREATE POLICY "Teachers view their students" ON teacher_students
  FOR SELECT USING (auth.uid() = teacher_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'משתמש חדש'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
