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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          active: boolean | null
          condition: Json
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          condition: Json
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          condition?: Json
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_cache: {
        Row: {
          cost_per_km: number | null
          created_at: string | null
          driver_id: string | null
          id: string
          period_end: string
          period_start: string
          total_distance: number | null
          total_fuel_cost: number | null
          total_maintenance_cost: number | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          cost_per_km?: number | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          period_end: string
          period_start: string
          total_distance?: number | null
          total_fuel_cost?: number | null
          total_maintenance_cost?: number | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          cost_per_km?: number | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          period_end?: string
          period_start?: string
          total_distance?: number | null
          total_fuel_cost?: number | null
          total_maintenance_cost?: number | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_cache_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_cache_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: string
          entity_id: string
          entity_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          entity_id: string
          entity_type: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          entity_id?: string
          entity_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          license_expiry: string | null
          license_number: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          license_expiry?: string | null
          license_number: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          license_expiry?: string | null
          license_number?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel: {
        Row: {
          cost: number
          created_at: string | null
          date: string
          fuel_type: string | null
          id: string
          mileage: number
          notes: string | null
          station: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string
          volume: number
        }
        Insert: {
          cost: number
          created_at?: string | null
          date: string
          fuel_type?: string | null
          id?: string
          mileage: number
          notes?: string | null
          station?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id: string
          volume: number
        }
        Update: {
          cost?: number
          created_at?: string | null
          date?: string
          fuel_type?: string | null
          id?: string
          mileage?: number
          notes?: string | null
          station?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string
          item_name: string
          observations: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id: string
          item_name: string
          observations?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string
          item_name?: string
          observations?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string | null
          date: string
          driver_id: string | null
          id: string
          mileage: number | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          driver_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          driver_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          mileage: number | null
          notes: string | null
          provider: string | null
          scheduled_date: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          provider?: string | null
          scheduled_date?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          provider?: string | null
          scheduled_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          document_days_before: number | null
          email_enabled: boolean | null
          fuel_consumption_threshold: number | null
          id: string
          maintenance_days_before: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_days_before?: number | null
          email_enabled?: boolean | null
          fuel_consumption_threshold?: number | null
          id?: string
          maintenance_days_before?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_days_before?: number | null
          email_enabled?: boolean | null
          fuel_consumption_threshold?: number | null
          id?: string
          maintenance_days_before?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_update: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tours: {
        Row: {
          created_at: string | null
          driver_id: string | null
          end_date: string | null
          end_mileage: number | null
          id: string
          notes: string | null
          start_date: string
          start_mileage: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          end_date?: string | null
          end_mileage?: number | null
          id?: string
          notes?: string | null
          start_date: string
          start_mileage?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          end_date?: string | null
          end_mileage?: number | null
          id?: string
          notes?: string | null
          start_date?: string
          start_mileage?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          acquisition_date: string | null
          color: string | null
          created_at: string | null
          fuel_type: string | null
          id: string
          last_service_date: string | null
          make: string
          mileage: number | null
          model: string
          next_service_date: string | null
          notes: string | null
          registration: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          acquisition_date?: string | null
          color?: string | null
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          last_service_date?: string | null
          make: string
          mileage?: number | null
          model: string
          next_service_date?: string | null
          notes?: string | null
          registration: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          acquisition_date?: string | null
          color?: string | null
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          last_service_date?: string | null
          make?: string
          mileage?: number | null
          model?: string
          next_service_date?: string | null
          notes?: string | null
          registration?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expiring_documents: {
        Args: never
        Returns: {
          days_until_expiry: number
          document_id: string
          entity_type: string
          expiry_date: string
          title: string
        }[]
      }
      check_permission: {
        Args: { _action: string; _resource: string; _user_id: string }
        Returns: boolean
      }
      check_upcoming_maintenance: {
        Args: never
        Returns: {
          days_until_maintenance: number
          scheduled_date: string
          vehicle_id: string
          vehicle_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "commercial" | "conducteur" | "direction"
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
      app_role: ["admin", "commercial", "conducteur", "direction"],
    },
  },
} as const
