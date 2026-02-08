export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          record_date: string
          status: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          record_date?: string
          status?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          record_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_memberships: {
        Row: {
          company_id: string
          id: string
          is_active: boolean | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          assigned_to: string | null
          description: string | null
          document_category: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string
          uploaded_at: string
        }
        Insert: {
          assigned_to?: string | null
          description?: string | null
          document_category?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id: string
          uploaded_at?: string
        }
        Update: {
          assigned_to?: string | null
          description?: string | null
          document_category?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          address: string | null
          alternate_phone: string | null
          created_at: string
          email: string | null
          employee_id: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string
          relationship: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          created_at?: string
          email?: string | null
          employee_id: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone: string
          relationship: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          allowances_description: string | null
          base_salary: number
          contract_type: string
          created_at: string
          department_id: string | null
          employee_id: string
          end_date: string | null
          housing_allowance: number | null
          id: string
          job_title: string
          lunch_allowance: number | null
          notes: string | null
          other_allowances: number | null
          start_date: string
          status: string
          transport_allowance: number | null
          updated_at: string
        }
        Insert: {
          allowances_description?: string | null
          base_salary?: number
          contract_type?: string
          created_at?: string
          department_id?: string | null
          employee_id: string
          end_date?: string | null
          housing_allowance?: number | null
          id?: string
          job_title: string
          lunch_allowance?: number | null
          notes?: string | null
          other_allowances?: number | null
          start_date: string
          status?: string
          transport_allowance?: number | null
          updated_at?: string
        }
        Update: {
          allowances_description?: string | null
          base_salary?: number
          contract_type?: string
          created_at?: string
          department_id?: string | null
          employee_id?: string
          end_date?: string | null
          housing_allowance?: number | null
          id?: string
          job_title?: string
          lunch_allowance?: number | null
          notes?: string | null
          other_allowances?: number | null
          start_date?: string
          status?: string
          transport_allowance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_tasks: {
        Row: {
          assigned_by: string
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string | null
          interviewer_id: string | null
          location: string | null
          rating: number | null
          scheduled_at: string
          status: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          location?: string | null
          rating?: number | null
          scheduled_at: string
          status?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          location?: string | null
          rating?: number | null
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          role: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          role: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          role?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          applied_at: string
          cover_letter: string | null
          id: string
          job_id: string
          notes: string | null
          resume_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id: string
          notes?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          employment_type: string | null
          id: string
          is_public: boolean | null
          posted_by: string | null
          requirements: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_public?: boolean | null
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_public?: boolean | null
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          manager_id: string | null
          reason: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          manager_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          manager_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paye_brackets: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          rate: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          rate: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          rate?: number
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          base_salary: number
          bonuses: number | null
          created_at: string
          deductions: number | null
          employee_id: string
          gross_pay: number | null
          housing_allowance: number | null
          id: string
          lunch_allowance: number | null
          napsa_employee: number | null
          napsa_employer: number | null
          net_pay: number
          nhima_employee: number | null
          nhima_employer: number | null
          other_allowances: number | null
          overtime_hours: number | null
          overtime_pay: number | null
          pay_period_end: string
          pay_period_start: string
          paye: number | null
          payment_date: string | null
          payment_status: string | null
          tax: number | null
          transport_allowance: number | null
        }
        Insert: {
          base_salary: number
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          employee_id: string
          gross_pay?: number | null
          housing_allowance?: number | null
          id?: string
          lunch_allowance?: number | null
          napsa_employee?: number | null
          napsa_employer?: number | null
          net_pay: number
          nhima_employee?: number | null
          nhima_employer?: number | null
          other_allowances?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          pay_period_end: string
          pay_period_start: string
          paye?: number | null
          payment_date?: string | null
          payment_status?: string | null
          tax?: number | null
          transport_allowance?: number | null
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          employee_id?: string
          gross_pay?: number | null
          housing_allowance?: number | null
          id?: string
          lunch_allowance?: number | null
          napsa_employee?: number | null
          napsa_employer?: number | null
          net_pay?: number
          nhima_employee?: number | null
          nhima_employer?: number | null
          other_allowances?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          pay_period_end?: string
          pay_period_start?: string
          paye?: number | null
          payment_date?: string | null
          payment_status?: string | null
          tax?: number | null
          transport_allowance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          achievements: string | null
          areas_for_improvement: string | null
          comments: string | null
          created_at: string
          employee_comments: string | null
          employee_id: string
          goals: string | null
          id: string
          overall_rating: number | null
          performance_score: number | null
          review_date: string
          review_period_end: string
          review_period_start: string
          reviewer_id: string | null
          status: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_comments?: string | null
          employee_id: string
          goals?: string | null
          id?: string
          overall_rating?: number | null
          performance_score?: number | null
          review_date?: string
          review_period_end: string
          review_period_start: string
          reviewer_id?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_comments?: string | null
          employee_id?: string
          goals?: string | null
          id?: string
          overall_rating?: number | null
          performance_score?: number | null
          review_date?: string
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          first_name: string | null
          hire_date: string | null
          id: string
          last_name: string | null
          manager_id: string | null
          phone: string | null
          position: string | null
          salary: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statutory_settings: {
        Row: {
          cap_amount: number | null
          created_at: string
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          name: string
          rate: number
          updated_at: string
        }
        Insert: {
          cap_amount?: number | null
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rate: number
          updated_at?: string
        }
        Update: {
          cap_amount?: number | null
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          read_at: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          read_at?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          read_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "employee_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_companies: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_super_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_manager_of_employee: {
        Args: { _employee_profile_id: string; _manager_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee"],
    },
  },
} as const
