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
      bookings: {
        Row: {
          amount_cents: number | null
          completed_at: string | null
          created_at: string
          distance_tier: string | null
          dropoff_address: string | null
          end_date: string
          id: string
          message: string | null
          owner_id: string
          payment_status: string
          payout_released: boolean
          payout_released_at: string | null
          pet_id: string | null
          pickup_address: string | null
          platform_fee_cents: number | null
          return_datetime: string | null
          service: string
          service_category: string | null
          sitter_id: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          total_estimate: number | null
          transport_notes: string | null
          trip_type: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          completed_at?: string | null
          created_at?: string
          distance_tier?: string | null
          dropoff_address?: string | null
          end_date: string
          id?: string
          message?: string | null
          owner_id: string
          payment_status?: string
          payout_released?: boolean
          payout_released_at?: string | null
          pet_id?: string | null
          pickup_address?: string | null
          platform_fee_cents?: number | null
          return_datetime?: string | null
          service: string
          service_category?: string | null
          sitter_id: string
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_estimate?: number | null
          transport_notes?: string | null
          trip_type?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          completed_at?: string | null
          created_at?: string
          distance_tier?: string | null
          dropoff_address?: string | null
          end_date?: string
          id?: string
          message?: string | null
          owner_id?: string
          payment_status?: string
          payout_released?: boolean
          payout_released_at?: string | null
          pet_id?: string | null
          pickup_address?: string | null
          platform_fee_cents?: number | null
          return_datetime?: string | null
          service?: string
          service_category?: string | null
          sitter_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_estimate?: number | null
          transport_notes?: string | null
          trip_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_requests: {
        Row: {
          accuracy_m: number | null
          booking_id: string
          captured_at: string | null
          created_at: string
          expires_at: string
          id: string
          latitude: number | null
          longitude: number | null
          owner_id: string
          responded_at: string | null
          sitter_id: string
          status: string
        }
        Insert: {
          accuracy_m?: number | null
          booking_id: string
          captured_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          owner_id: string
          responded_at?: string | null
          sitter_id: string
          status?: string
        }
        Update: {
          accuracy_m?: number | null
          booking_id?: string
          captured_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          owner_id?: string
          responded_at?: string | null
          sitter_id?: string
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_intake_forms: {
        Row: {
          age_years: number | null
          booking_id: string
          breed: string | null
          cameras_disclosure: string | null
          cleaning_supplies_location: string | null
          created_at: string
          dhpp_current: boolean | null
          emergency_care_authorized: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          feeding_schedule: string | null
          house_rules: string | null
          id: string
          medications: string | null
          microchip: string | null
          normal_behavior: string | null
          owner_id: string
          parking_instructions: string | null
          pet_id: string | null
          pet_name: string | null
          prone_to_bolting: boolean | null
          rabies_current: boolean | null
          red_flags: string | null
          sitter_id: string
          treat_restrictions: string | null
          trigger_notes: string | null
          update_frequency: string | null
          updated_at: string
          vet_name: string | null
          vet_phone: string | null
          walk_routine: string | null
          weight_lbs: number | null
        }
        Insert: {
          age_years?: number | null
          booking_id: string
          breed?: string | null
          cameras_disclosure?: string | null
          cleaning_supplies_location?: string | null
          created_at?: string
          dhpp_current?: boolean | null
          emergency_care_authorized?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          feeding_schedule?: string | null
          house_rules?: string | null
          id?: string
          medications?: string | null
          microchip?: string | null
          normal_behavior?: string | null
          owner_id: string
          parking_instructions?: string | null
          pet_id?: string | null
          pet_name?: string | null
          prone_to_bolting?: boolean | null
          rabies_current?: boolean | null
          red_flags?: string | null
          sitter_id: string
          treat_restrictions?: string | null
          trigger_notes?: string | null
          update_frequency?: string | null
          updated_at?: string
          vet_name?: string | null
          vet_phone?: string | null
          walk_routine?: string | null
          weight_lbs?: number | null
        }
        Update: {
          age_years?: number | null
          booking_id?: string
          breed?: string | null
          cameras_disclosure?: string | null
          cleaning_supplies_location?: string | null
          created_at?: string
          dhpp_current?: boolean | null
          emergency_care_authorized?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          feeding_schedule?: string | null
          house_rules?: string | null
          id?: string
          medications?: string | null
          microchip?: string | null
          normal_behavior?: string | null
          owner_id?: string
          parking_instructions?: string | null
          pet_id?: string | null
          pet_name?: string | null
          prone_to_bolting?: boolean | null
          rabies_current?: boolean | null
          red_flags?: string | null
          sitter_id?: string
          treat_restrictions?: string | null
          trigger_notes?: string | null
          update_frequency?: string | null
          updated_at?: string
          vet_name?: string | null
          vet_phone?: string | null
          walk_routine?: string | null
          weight_lbs?: number | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          age_years: number | null
          breed: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          photos: string[]
          size: Database["public"]["Enums"]["dog_size"]
          updated_at: string
        }
        Insert: {
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          photos?: string[]
          size?: Database["public"]["Enums"]["dog_size"]
          updated_at?: string
        }
        Update: {
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          photos?: string[]
          size?: Database["public"]["Enums"]["dog_size"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_cats: boolean
          accepts_dogs: boolean
          address_line: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          hide_past_pets: boolean
          id: string
          inactive: boolean
          is_sitter: boolean
          latitude: number | null
          longitude: number | null
          max_pet_weight_lbs: number | null
          phone: string | null
          sitter_extra_stop_fee_cents: number | null
          sitter_gallery: string[] | null
          sitter_headline: string | null
          sitter_rate: number | null
          sitter_services: string[] | null
          sitter_test_passed_at: string | null
          sitter_transport_enabled: boolean
          sitter_transport_has_crate: boolean
          sitter_transport_has_vehicle: boolean
          sitter_transport_multi_pet: boolean
          sitter_transport_prices_by_tier: Json
          sitter_waiting_fee_per_hour_cents: number | null
          sitter_years_experience: number | null
          state: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean
          tracking_premium: boolean
          updated_at: string
          verification_doc_path: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          zip: string | null
        }
        Insert: {
          accepts_cats?: boolean
          accepts_dogs?: boolean
          address_line?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          hide_past_pets?: boolean
          id: string
          inactive?: boolean
          is_sitter?: boolean
          latitude?: number | null
          longitude?: number | null
          max_pet_weight_lbs?: number | null
          phone?: string | null
          sitter_extra_stop_fee_cents?: number | null
          sitter_gallery?: string[] | null
          sitter_headline?: string | null
          sitter_rate?: number | null
          sitter_services?: string[] | null
          sitter_test_passed_at?: string | null
          sitter_transport_enabled?: boolean
          sitter_transport_has_crate?: boolean
          sitter_transport_has_vehicle?: boolean
          sitter_transport_multi_pet?: boolean
          sitter_transport_prices_by_tier?: Json
          sitter_waiting_fee_per_hour_cents?: number | null
          sitter_years_experience?: number | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          tracking_premium?: boolean
          updated_at?: string
          verification_doc_path?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          zip?: string | null
        }
        Update: {
          accepts_cats?: boolean
          accepts_dogs?: boolean
          address_line?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          hide_past_pets?: boolean
          id?: string
          inactive?: boolean
          is_sitter?: boolean
          latitude?: number | null
          longitude?: number | null
          max_pet_weight_lbs?: number | null
          phone?: string | null
          sitter_extra_stop_fee_cents?: number | null
          sitter_gallery?: string[] | null
          sitter_headline?: string | null
          sitter_rate?: number | null
          sitter_services?: string[] | null
          sitter_test_passed_at?: string | null
          sitter_transport_enabled?: boolean
          sitter_transport_has_crate?: boolean
          sitter_transport_has_vehicle?: boolean
          sitter_transport_multi_pet?: boolean
          sitter_transport_prices_by_tier?: Json
          sitter_waiting_fee_per_hour_cents?: number | null
          sitter_years_experience?: number | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          tracking_premium?: boolean
          updated_at?: string
          verification_doc_path?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          body: string | null
          booking_id: string | null
          created_at: string
          hidden: boolean
          id: string
          rating: number
          sitter_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          rating: number
          sitter_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          rating?: number
          sitter_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sitter_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          sitter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          sitter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          sitter_id?: string
          status?: string
        }
        Relationships: []
      }
      sitter_test_results: {
        Row: {
          created_at: string
          id: string
          passed: boolean
          score: number
          sitter_id: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          passed: boolean
          score: number
          sitter_id: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          passed?: boolean
          score?: number
          sitter_id?: string
          total?: number
        }
        Relationships: []
      }
      tracking_consents: {
        Row: {
          booking_id: string
          consented: boolean
          consented_at: string | null
          created_at: string
          id: string
          owner_id: string
          revoked_at: string | null
          sitter_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          consented?: boolean
          consented_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          revoked_at?: string | null
          sitter_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          consented?: boolean
          consented_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          revoked_at?: string | null
          sitter_id?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      public_profiles: {
        Row: {
          accepts_cats: boolean | null
          accepts_dogs: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          full_name: string | null
          hide_past_pets: boolean | null
          id: string | null
          inactive: boolean | null
          is_sitter: boolean | null
          max_pet_weight_lbs: number | null
          sitter_extra_stop_fee_cents: number | null
          sitter_gallery: string[] | null
          sitter_headline: string | null
          sitter_rate: number | null
          sitter_services: string[] | null
          sitter_test_passed_at: string | null
          sitter_transport_enabled: boolean | null
          sitter_transport_has_crate: boolean | null
          sitter_transport_has_vehicle: boolean | null
          sitter_transport_multi_pet: boolean | null
          sitter_transport_prices_by_tier: Json | null
          sitter_waiting_fee_per_hour_cents: number | null
          sitter_years_experience: number | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          accepts_cats?: boolean | null
          accepts_dogs?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          hide_past_pets?: boolean | null
          id?: string | null
          inactive?: boolean | null
          is_sitter?: boolean | null
          max_pet_weight_lbs?: number | null
          sitter_extra_stop_fee_cents?: number | null
          sitter_gallery?: string[] | null
          sitter_headline?: string | null
          sitter_rate?: number | null
          sitter_services?: string[] | null
          sitter_test_passed_at?: string | null
          sitter_transport_enabled?: boolean | null
          sitter_transport_has_crate?: boolean | null
          sitter_transport_has_vehicle?: boolean | null
          sitter_transport_multi_pet?: boolean | null
          sitter_transport_prices_by_tier?: Json | null
          sitter_waiting_fee_per_hour_cents?: number | null
          sitter_years_experience?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          accepts_cats?: boolean | null
          accepts_dogs?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          hide_past_pets?: boolean | null
          id?: string | null
          inactive?: boolean | null
          is_sitter?: boolean | null
          max_pet_weight_lbs?: number | null
          sitter_extra_stop_fee_cents?: number | null
          sitter_gallery?: string[] | null
          sitter_headline?: string | null
          sitter_rate?: number | null
          sitter_services?: string[] | null
          sitter_test_passed_at?: string | null
          sitter_transport_enabled?: boolean | null
          sitter_transport_has_crate?: boolean | null
          sitter_transport_has_vehicle?: boolean | null
          sitter_transport_multi_pet?: boolean | null
          sitter_transport_prices_by_tier?: Json | null
          sitter_waiting_fee_per_hour_cents?: number | null
          sitter_years_experience?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_set_verification: {
        Args: { _notes?: string; _status: string; _user_id: string }
        Returns: undefined
      }
      get_my_profile: {
        Args: never
        Returns: {
          accepts_cats: boolean
          accepts_dogs: boolean
          address_line: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          hide_past_pets: boolean
          id: string
          inactive: boolean
          is_sitter: boolean
          latitude: number | null
          longitude: number | null
          max_pet_weight_lbs: number | null
          phone: string | null
          sitter_extra_stop_fee_cents: number | null
          sitter_gallery: string[] | null
          sitter_headline: string | null
          sitter_rate: number | null
          sitter_services: string[] | null
          sitter_test_passed_at: string | null
          sitter_transport_enabled: boolean
          sitter_transport_has_crate: boolean
          sitter_transport_has_vehicle: boolean
          sitter_transport_multi_pet: boolean
          sitter_transport_prices_by_tier: Json
          sitter_waiting_fee_per_hour_cents: number | null
          sitter_years_experience: number | null
          state: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean
          tracking_premium: boolean
          updated_at: string
          verification_doc_path: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          zip: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "completed"
        | "awaiting_payment"
        | "confirmed"
      dog_size: "small" | "medium" | "large" | "xlarge"
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
      app_role: ["admin", "user"],
      booking_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "completed",
        "awaiting_payment",
        "confirmed",
      ],
      dog_size: ["small", "medium", "large", "xlarge"],
    },
  },
} as const
