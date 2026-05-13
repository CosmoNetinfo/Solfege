export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          notes: string | null
          school_id: string
          status: string
          student_id: string
          voto: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          notes?: string | null
          school_id: string
          status: string
          student_id: string
          voto?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          notes?: string | null
          school_id?: string
          status?: string
          student_id?: string
          voto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean | null
          anno_scolastico: string | null
          colore_calendario: string | null
          created_at: string
          day_of_week: number | null
          duration_min: number | null
          id: string
          instrument_id: string | null
          level: Database["public"]["Enums"]["livello_corso"] | null
          max_students: number | null
          name: string
          price: number | null
          price_model: Database["public"]["Enums"]["price_model"]
          room_id: string | null
          school_id: string
          start_time: string | null
          type: Database["public"]["Enums"]["tipo_corso"]
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          anno_scolastico?: string | null
          colore_calendario?: string | null
          created_at?: string
          day_of_week?: number | null
          duration_min?: number | null
          id?: string
          instrument_id?: string | null
          level?: Database["public"]["Enums"]["livello_corso"] | null
          max_students?: number | null
          name: string
          price?: number | null
          price_model?: Database["public"]["Enums"]["price_model"]
          room_id?: string | null
          school_id: string
          start_time?: string | null
          type: Database["public"]["Enums"]["tipo_corso"]
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          anno_scolastico?: string | null
          colore_calendario?: boolean | null
          created_at?: string
          day_of_week?: number | null
          duration_min?: number | null
          id?: string
          instrument_id?: string | null
          level?: Database["public"]["Enums"]["livello_corso"] | null
          max_students?: number | null
          name?: string
          price?: number | null
          price_model?: Database["public"]["Enums"]["price_model"]
          room_id?: string | null
          school_id?: string
          start_time?: string | null
          type?: Database["public"]["Enums"]["tipo_corso"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilita_insegnanti: {
        Row: {
          giorno: Database["public"]["Enums"]["giorno_settimana"]
          id: string
          ora_fine: string
          ora_inizio: string
          school_id: string
          teacher_id: string
        }
        Insert: {
          giorno: Database["public"]["Enums"]["giorno_settimana"]
          id?: string
          ora_fine: string
          ora_inizio: string
          school_id: string
          teacher_id: string
        }
        Update: {
          giorno?: Database["public"]["Enums"]["giorno_settimana"]
          id?: string
          ora_fine?: string
          ora_inizio?: string
          school_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilita_insegnanti_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilita_insegnanti_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          discount_pct: number | null
          end_date: string | null
          id: string
          notes: string | null
          price_override: number | null
          school_id: string
          start_date: string
          status: string | null
          student_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          discount_pct?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          price_override?: number | null
          school_id: string
          start_date: string
          status?: string | null
          student_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          discount_pct?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          price_override?: number | null
          school_id?: string
          start_date?: string
          status?: string | null
          student_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          data_ora_fine: string
          data_ora_inizio: string
          id: string
          lezione_recupero_di: string | null
          note_docente: string | null
          room_id: string | null
          school_id: string
          status: Database["public"]["Enums"]["stato_lezione"] | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          data_ora_fine: string
          data_ora_inizio: string
          id?: string
          lezione_recupero_di?: string | null
          note_docente?: string | null
          room_id?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["stato_lezione"] | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          data_ora_fine?: string
          data_ora_inizio?: string
          id?: string
          lezione_recupero_di?: string | null
          note_docente?: string | null
          room_id?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["stato_lezione"] | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_lezione_recupero_di_fkey"
            columns: ["lezione_recupero_di"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_attesa: {
        Row: {
          course_id: string
          created_at: string
          id: string
          school_id: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          school_id: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_attesa_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_attesa_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_attesa_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          enrollment_id: string | null
          id: string
          method: Database["public"]["Enums"]["metodo_pagamento"] | null
          notes: string | null
          numero_ricevuta: string | null
          paid_date: string | null
          school_id: string
          status: Database["public"]["Enums"]["stato_pagamento"] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          enrollment_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["metodo_pagamento"] | null
          notes?: string | null
          numero_ricevuta?: string | null
          paid_date?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["stato_pagamento"] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          enrollment_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["metodo_pagamento"] | null
          notes?: string | null
          numero_ricevuta?: string | null
          paid_date?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["stato_pagamento"] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          attrezzature: string[] | null
          capacity: number | null
          created_at: string
          id: string
          insonorizzata: boolean | null
          name: string
          school_id: string
        }
        Insert: {
          attrezzature?: string[] | null
          capacity?: number | null
          created_at?: string
          id?: string
          insonorizzata?: boolean | null
          name: string
          school_id: string
        }
        Update: {
          attrezzature?: string[] | null
          capacity?: number | null
          created_at?: string
          id?: string
          insonorizzata?: boolean | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string | null
          slug: string
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
          website: string | null
          current_academic_year: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          slug: string
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          current_academic_year?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          slug?: string
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          current_academic_year?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean | null
          address: string | null
          cap: string | null
          city: string | null
          created_at: string
          dob: string | null
          email: string | null
          enrolled_at: string | null
          first_name: string
          fiscal_code: string | null
          id: string
          last_name: string
          note_mediche: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_surname: string | null
          phone: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          cap?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          enrolled_at?: string | null
          first_name: string
          fiscal_code?: string | null
          id?: string
          last_name: string
          note_mediche?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_surname?: string | null
          phone?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          cap?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          enrolled_at?: string | null
          first_name?: string
          fiscal_code?: string | null
          id?: string
          last_name?: string
          note_mediche?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_surname?: string | null
          phone?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_compensations: {
        Row: {
          created_at: string
          hours_group: number | null
          hours_individual: number | null
          id: string
          month: number
          notes: string | null
          paid: boolean | null
          paid_date: string | null
          school_id: string
          teacher_id: string
          total_amount: number | null
          year: number
        }
        Insert: {
          created_at?: string
          hours_group?: number | null
          hours_individual?: number | null
          id?: string
          month: number
          notes?: string | null
          paid?: boolean | null
          paid_date?: string | null
          school_id: string
          teacher_id: string
          total_amount?: number | null
          year: number
        }
        Update: {
          created_at?: string
          hours_group?: number | null
          hours_individual?: number | null
          id?: string
          month?: number
          notes?: string | null
          paid?: boolean | null
          paid_date?: string | null
          school_id?: string
          teacher_id?: string
          total_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_compensations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_compensations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          active: boolean | null
          created_at: string
          data_assunzione: string | null
          email: string | null
          first_name: string
          fiscal_code: string | null
          iban: string | null
          id: string
          last_name: string
          note_contratto: string | null
          phone: string | null
          profile_id: string | null
          rate_group: number | null
          rate_individual: number | null
          school_id: string
          specializzazioni: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          data_assunzione?: string | null
          email?: string | null
          first_name: string
          fiscal_code?: string | null
          iban?: string | null
          id?: string
          last_name: string
          note_contratto?: string | null
          phone?: string | null
          profile_id?: string | null
          rate_group?: number | null
          rate_individual?: number | null
          school_id: string
          specializzazioni?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          data_assunzione?: string | null
          email?: string | null
          first_name?: string
          fiscal_code?: string | null
          iban?: string | null
          id?: string
          last_name?: string
          note_contratto?: string | null
          phone?: string | null
          profile_id?: string | null
          rate_group?: number | null
          rate_individual?: number | null
          school_id?: string
          specializzazioni?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      tessere: {
        Row: {
          anno_scolastico: string
          created_at: string
          data_pagamento: string | null
          id: string
          importo: number | null
          numero_tessera: string | null
          pagata: boolean | null
          school_id: string
          student_id: string
          tipo: string | null
        }
        Insert: {
          anno_scolastico: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          importo?: number | null
          numero_tessera?: string | null
          pagata?: boolean | null
          school_id: string
          student_id: string
          tipo?: string | null
        }
        Update: {
          anno_scolastico?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          importo?: number | null
          numero_tessera?: string | null
          pagata?: boolean | null
          school_id?: string
          student_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tessere_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tessere_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      giorno_settimana:
        | "lunedi"
        | "martedi"
        | "mercoledi"
        | "giovedi"
        | "venerdi"
        | "sabato"
        | "domenica"
      livello_corso: "principiante" | "intermedio" | "avanzato" | "professionale"
      metodo_pagamento: "contanti" | "carta" | "bonifico" | "altro"
      price_model: "mensile" | "pacchetto" | "annuale"
      stato_lezione: "programmata" | "completata" | "cancellata" | "recupero"
      stato_pagamento:
        | "in_attesa"
        | "pagato"
        | "in_ritardo"
        | "rimborsato"
        | "annullato"
      tipo_corso: "individuale" | "collettivo" | "online"
      user_role: "admin" | "segreteria" | "insegnante"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
