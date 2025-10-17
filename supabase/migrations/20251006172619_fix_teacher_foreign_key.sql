/*
  # Fix Teacher Foreign Key

  1. Changes
    - Drop incorrect foreign key constraint on subjects.teacher_id
    - Add correct foreign key constraint referencing teachers.id instead of users.id
*/

-- Drop the incorrect constraint
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_teacher_id_fkey;

-- Add the correct constraint
ALTER TABLE subjects ADD CONSTRAINT subjects_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
