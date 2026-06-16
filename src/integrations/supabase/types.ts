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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          credits: number
          id: string
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          rate_limit_per_min: number
          status: Database["public"]["Enums"]["business_status"]
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          rate_limit_per_min?: number
          status?: Database["public"]["Enums"]["business_status"]
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          rate_limit_per_min?: number
          status?: Database["public"]["Enums"]["business_status"]
        }
        Relationships: []
      }
      fraud_logs: {
        Row: {
          business_id: string | null
          created_at: string
          details: Json | null
          id: string
          kind: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kind: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kind?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      mother_api_logs: {
        Row: {
          allowed: boolean
          business_id: string | null
          created_at: string
          endpoint: string | null
          id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          allowed: boolean
          business_id?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          allowed?: boolean
          business_id?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mother_api_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      mother_api_settings: {
        Row: {
          api_url: string | null
          auth_header: string
          auth_token: string | null
          created_at: string
          enabled: boolean
          id: string
          mode: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_url?: string | null
          auth_header?: string
          auth_token?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          mode?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_url?: string | null
          auth_header?: string
          auth_token?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          mode?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          business_id: string
          created_at: string
          id: string
          message: string | null
          performed_by: string | null
          qr_payload: string | null
          recipient: string | null
          result: Database["public"]["Enums"]["tx_result"]
          tx_reference: string | null
        }
        Insert: {
          amount?: number | null
          business_id: string
          created_at?: string
          id?: string
          message?: string | null
          performed_by?: string | null
          qr_payload?: string | null
          recipient?: string | null
          result: Database["public"]["Enums"]["tx_result"]
          tx_reference?: string | null
        }
        Update: {
          amount?: number | null
          business_id?: string
          created_at?: string
          id?: string
          message?: string | null
          performed_by?: string | null
          qr_payload?: string | null
          recipient?: string | null
          result?: Database["public"]["Enums"]["tx_result"]
          tx_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_business_role: {
        Args: {
          _business_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "manager" | "cashier"
      business_status: "active" | "suspended" | "limited"
      plan_tier: "free" | "basic" | "pro"
      tx_result: "success" | "failed" | "duplicate" | "blocked"
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
      app_role: ["admin", "owner", "manager", "cashier"],
      business_status: ["active", "suspended", "limited"],
      plan_tier: ["free", "basic", "pro"],
      tx_result: ["success", "failed", "duplicate", "blocked"],
    },
  },
} as const
