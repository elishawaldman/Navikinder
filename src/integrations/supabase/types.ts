export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      child_profiles: {
        Row: {
          child_id: string
          created_at: string
          profile_id: string
          role: string
        }
        Insert: {
          child_id: string
          created_at?: string
          profile_id: string
          role: string
        }
        Update: {
          child_id?: string
          created_at?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_profiles_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          archived_at: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dose_instances: {
        Row: {
          child_id: string
          created_at: string
          dose_amount: number
          dose_unit: string
          due_datetime: string
          email_sent_at: string | null
          id: string
          medication_id: string
          schedule_id: string
          status: string
          updated_at: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          dose_amount: number
          dose_unit: string
          due_datetime: string
          email_sent_at?: string | null
          id?: string
          medication_id: string
          schedule_id: string
          status?: string
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          dose_amount?: number
          dose_unit?: string
          due_datetime?: string
          email_sent_at?: string | null
          id?: string
          medication_id?: string
          schedule_id?: string
          status?: string
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dose_instances_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dose_instances_medication"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dose_instances_schedule"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      dose_logs: {
        Row: {
          amount_given: number
          child_id: string
          created_at: string
          dose_instance_id: string | null
          given_datetime: string
          id: string
          is_prn: boolean
          medication_id: string
          notes: string | null
          reason_given: string | null
          reason_not_given: string | null
          recorded_by: string
          unit: string
          updated_at: string
          was_given: boolean
        }
        Insert: {
          amount_given: number
          child_id: string
          created_at?: string
          dose_instance_id?: string | null
          given_datetime: string
          id?: string
          is_prn: boolean
          medication_id: string
          notes?: string | null
          reason_given?: string | null
          reason_not_given?: string | null
          recorded_by: string
          unit: string
          updated_at?: string
          was_given?: boolean
        }
        Update: {
          amount_given?: number
          child_id?: string
          created_at?: string
          dose_instance_id?: string | null
          given_datetime?: string
          id?: string
          is_prn?: boolean
          medication_id?: string
          notes?: string | null
          reason_given?: string | null
          reason_not_given?: string | null
          recorded_by?: string
          unit?: string
          updated_at?: string
          was_given?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_dose_logs_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dose_logs_medication"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dose_logs_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          active_from: string
          active_to: string | null
          created_at: string
          every_x_hours: number | null
          id: string
          medication_id: string
          rule_type: string
          specific_times: Json | null
          times_per_day: number | null
          updated_at: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          every_x_hours?: number | null
          id?: string
          medication_id: string
          rule_type: string
          specific_times?: Json | null
          times_per_day?: number | null
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          every_x_hours?: number | null
          id?: string
          medication_id?: string
          rule_type?: string
          specific_times?: Json | null
          times_per_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          archived_at: string | null
          child_id: string
          created_at: string
          created_by: string
          dose_amount: number
          dose_unit: string
          end_datetime: string | null
          id: string
          is_prn: boolean
          name: string
          notes: string | null
          route: string
          start_datetime: string
          stopped_reason: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          child_id: string
          created_at?: string
          created_by: string
          dose_amount: number
          dose_unit: string
          end_datetime?: string | null
          id?: string
          is_prn: boolean
          name: string
          notes?: string | null
          route?: string
          start_datetime: string
          stopped_reason?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          child_id?: string
          created_at?: string
          created_by?: string
          dose_amount?: number
          dose_unit?: string
          end_datetime?: string | null
          id?: string
          is_prn?: boolean
          name?: string
          notes?: string | null
          route?: string
          start_datetime?: string
          stopped_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone_number: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          medication_reminders_enabled: boolean
          push_notifications_enabled: boolean
          system_alerts_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          medication_reminders_enabled?: boolean
          push_notifications_enabled?: boolean
          system_alerts_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          medication_reminders_enabled?: boolean
          push_notifications_enabled?: boolean
          system_alerts_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_child_with_relationship: {
        Args: {
          p_first_name: string
          p_date_of_birth: string
          p_profile_id: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_medication_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
