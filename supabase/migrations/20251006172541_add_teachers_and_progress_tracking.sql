/*
  # Add Teachers and Progress Tracking

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `profile_image_url` (text, nullable)
      - `bio` (text, nullable)
      - `created_at` (timestamptz)
    
    - `topic_progress`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `topic_id` (uuid, references topics)
      - `completed` (boolean, default false)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - Unique constraint on (student_id, topic_id)

  2. Changes
    - Add `teacher_id` (uuid, nullable) to `subjects` table
    - Add `last_visited_term_id` (uuid, nullable) to `enrollments` table
    - Add `last_topic_id` (uuid, nullable) to `enrollments` table

  3. Security
    - Enable RLS on `teachers` table
    - Enable RLS on `topic_progress` table
    - Add policies for authenticated users to read teacher data
    - Add policies for students to manage their own progress
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  profile_image_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add teacher_id to subjects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE subjects ADD COLUMN teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create topic_progress table
CREATE TABLE IF NOT EXISTS topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, topic_id)
);

ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON topic_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own progress"
  ON topic_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON topic_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Add last visited tracking to enrollments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'last_visited_term_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN last_visited_term_id uuid REFERENCES terms(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'last_topic_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN last_topic_id uuid REFERENCES topics(id) ON DELETE SET NULL;
  END IF;
END $$;
