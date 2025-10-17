export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          stage: 'A-Level' | 'O-Level' | 'JS'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          stage: 'A-Level' | 'O-Level' | 'JS'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          stage?: 'A-Level' | 'O-Level' | 'JS'
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          exam_board: 'ZIMSEC' | 'Cambridge'
          teacher_id: string | null
          syllabus_url: string | null
          school: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          exam_board: 'ZIMSEC' | 'Cambridge'
          teacher_id?: string | null
          syllabus_url?: string | null
          school?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          exam_board?: 'ZIMSEC' | 'Cambridge'
          teacher_id?: string | null
          syllabus_url?: string | null
          school?: string | null
          created_at?: string
        }
      }
      terms: {
        Row: {
          id: string
          name: string
          subject_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          subject_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject_id?: string
          created_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          name: string
          term_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          term_id: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          term_id?: string
          order_index?: number
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          name: string
          chapter_id: string
          type: 'video' | 'pdf'
          duration: number
          file_url: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          chapter_id: string
          type: 'video' | 'pdf'
          duration?: number
          file_url?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          chapter_id?: string
          type?: 'video' | 'pdf'
          duration?: number
          file_url?: string | null
          order_index?: number
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          topic_id: string | null
          chapter_id: string | null
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          topic_id?: string | null
          chapter_id?: string | null
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string | null
          chapter_id?: string | null
          name?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          order_index?: number
          created_at?: string
        }
      }
      options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          is_correct?: boolean
          created_at?: string
        }
      }
      student_progress: {
        Row: {
          id: string
          student_id: string
          topic_id: string | null
          quiz_id: string | null
          completed: boolean
          time_spent: number
          quiz_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          topic_id?: string | null
          quiz_id?: string | null
          completed?: boolean
          time_spent?: number
          quiz_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          topic_id?: string | null
          quiz_id?: string | null
          completed?: boolean
          time_spent?: number
          quiz_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      past_papers: {
        Row: {
          id: string
          subject_id: string
          year: number
          paper_number: number
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          year: number
          paper_number: number
          file_url: string
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          year?: number
          paper_number?: number
          file_url?: string
          created_at?: string
        }
      }
      past_paper_completions: {
        Row: {
          id: string
          student_id: string
          past_paper_id: string
          completed: boolean
          completed_at: string
        }
        Insert: {
          id?: string
          student_id: string
          past_paper_id: string
          completed?: boolean
          completed_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          past_paper_id?: string
          completed?: boolean
          completed_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          enrolled_at: string
          last_visited_term_id: string | null
          last_chapter_id: string | null
          last_topic_id: string | null
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          enrolled_at?: string
          last_visited_term_id?: string | null
          last_chapter_id?: string | null
          last_topic_id?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          enrolled_at?: string
          last_visited_term_id?: string | null
          last_chapter_id?: string | null
          last_topic_id?: string | null
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string | null
          name: string
          profile_image_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          profile_image_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          profile_image_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      topic_progress: {
        Row: {
          id: string
          student_id: string
          topic_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          topic_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          topic_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      student_enrollment_requests: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
