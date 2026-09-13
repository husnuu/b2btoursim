/**
 * Supabase şemasından üretildi — ELLE DÜZENLEME.
 * Yenilemek için: Supabase MCP `generate_typescript_types` ya da
 * `npx supabase gen types typescript --project-id kyanueyvzwzibxqqekaz`.
 */
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
      accommodation_night: {
        Row: {
          accommodation_name: string
          id: string
          night_no: number
          plan_id: string
          tenant_id: string
        }
        Insert: {
          accommodation_name: string
          id?: string
          night_no: number
          plan_id: string
          tenant_id: string
        }
        Update: {
          accommodation_name?: string
          id?: string
          night_no?: number
          plan_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_night_plan_fk"
            columns: ["tenant_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "accommodation_plan"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "accommodation_night_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_plan: {
        Row: {
          id: string
          name: string
          price: number
          tenant_id: string
          tour_id: string
        }
        Insert: {
          id?: string
          name: string
          price?: number
          tenant_id: string
          tour_id: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_plan_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_plan_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      agency: {
        Row: {
          created_at: string
          credit_limit: number
          currency: string
          id: string
          name: string
          parent_agency_id: string | null
          payment_term_days: number
          tenant_id: string
          type: Database["public"]["Enums"]["agency_type"]
        }
        Insert: {
          created_at?: string
          credit_limit?: number
          currency: string
          id?: string
          name: string
          parent_agency_id?: string | null
          payment_term_days?: number
          tenant_id: string
          type: Database["public"]["Enums"]["agency_type"]
        }
        Update: {
          created_at?: string
          credit_limit?: number
          currency?: string
          id?: string
          name?: string
          parent_agency_id?: string | null
          payment_term_days?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["agency_type"]
        }
        Relationships: [
          {
            foreignKeyName: "agency_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "agency_parent_fk"
            columns: ["tenant_id", "parent_agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "agency_parent_fk"
            columns: ["tenant_id", "parent_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "agency_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user: {
        Row: {
          agency_id: string | null
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_seen_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          tenant_id: string
        }
        Insert: {
          agency_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_seen_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id: string
        }
        Update: {
          agency_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "app_user_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "app_user_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          at: string
          before: Json | null
          entity_id: string
          entity_type: string
          id: number
          ip: unknown
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id: string
          entity_type: string
          id?: never
          ip?: unknown
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id?: string
          entity_type?: string
          id?: never
          ip?: unknown
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat: {
        Row: {
          agency_id: string
          bed_count: number
          brand_model: string
          build_year: number | null
          cabin_count: number
          cancellation_policy_id: string | null
          captain_fee: number | null
          captain_fee_unit: Database["public"]["Enums"]["captain_fee_unit"]
          captain_language: string
          captain_option: Database["public"]["Enums"]["captain_option"]
          captain_payment_method: Database["public"]["Enums"]["captain_payment_method"]
          category_id: string | null
          collect_emergency_contact: boolean
          collect_passenger_list: boolean
          contract_text: string | null
          contract_updated_at: string | null
          contract_version: number
          created_at: string
          currency: string
          deposit_block_timing: Database["public"]["Enums"]["deposit_block_timing"]
          deposit_refund_timing: Database["public"]["Enums"]["deposit_refund_timing"]
          description: string
          engine_info: string
          excludes: string[]
          fuel_policy_included: boolean
          has_fire_extinguisher: boolean
          has_life_raft: boolean
          hourly_rate: number | null
          id: string
          includes: string[]
          internal_short_name: string
          legal_capacity: number
          length_meters: number | null
          lifejacket_count: number
          main_marina_id: string | null
          main_marina_kind: Database["public"]["Enums"]["location_point_kind"]
          min_rental_hours: number
          multiday_max_units: number | null
          multiday_min_units: number | null
          multiday_unit: Database["public"]["Enums"]["multiday_unit"] | null
          multiday_unit_price: number | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          per_person_min_group: number | null
          per_person_price: number | null
          pricing_model: Database["public"]["Enums"]["boat_pricing_model"]
          require_captain_license: boolean
          safety_notes: string
          security_deposit: number
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
          video_url: string | null
          weather_cancellation_enabled: boolean
          what_to_bring: string
        }
        Insert: {
          agency_id: string
          bed_count?: number
          brand_model?: string
          build_year?: number | null
          cabin_count?: number
          cancellation_policy_id?: string | null
          captain_fee?: number | null
          captain_fee_unit?: Database["public"]["Enums"]["captain_fee_unit"]
          captain_language?: string
          captain_option?: Database["public"]["Enums"]["captain_option"]
          captain_payment_method?: Database["public"]["Enums"]["captain_payment_method"]
          category_id?: string | null
          collect_emergency_contact?: boolean
          collect_passenger_list?: boolean
          contract_text?: string | null
          contract_updated_at?: string | null
          contract_version?: number
          created_at?: string
          currency: string
          deposit_block_timing?: Database["public"]["Enums"]["deposit_block_timing"]
          deposit_refund_timing?: Database["public"]["Enums"]["deposit_refund_timing"]
          description?: string
          engine_info?: string
          excludes?: string[]
          fuel_policy_included?: boolean
          has_fire_extinguisher?: boolean
          has_life_raft?: boolean
          hourly_rate?: number | null
          id?: string
          includes?: string[]
          internal_short_name?: string
          legal_capacity: number
          length_meters?: number | null
          lifejacket_count?: number
          main_marina_id?: string | null
          main_marina_kind?: Database["public"]["Enums"]["location_point_kind"]
          min_rental_hours?: number
          multiday_max_units?: number | null
          multiday_min_units?: number | null
          multiday_unit?: Database["public"]["Enums"]["multiday_unit"] | null
          multiday_unit_price?: number | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          per_person_min_group?: number | null
          per_person_price?: number | null
          pricing_model?: Database["public"]["Enums"]["boat_pricing_model"]
          require_captain_license?: boolean
          safety_notes?: string
          security_deposit?: number
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
          video_url?: string | null
          weather_cancellation_enabled?: boolean
          what_to_bring?: string
        }
        Update: {
          agency_id?: string
          bed_count?: number
          brand_model?: string
          build_year?: number | null
          cabin_count?: number
          cancellation_policy_id?: string | null
          captain_fee?: number | null
          captain_fee_unit?: Database["public"]["Enums"]["captain_fee_unit"]
          captain_language?: string
          captain_option?: Database["public"]["Enums"]["captain_option"]
          captain_payment_method?: Database["public"]["Enums"]["captain_payment_method"]
          category_id?: string | null
          collect_emergency_contact?: boolean
          collect_passenger_list?: boolean
          contract_text?: string | null
          contract_updated_at?: string | null
          contract_version?: number
          created_at?: string
          currency?: string
          deposit_block_timing?: Database["public"]["Enums"]["deposit_block_timing"]
          deposit_refund_timing?: Database["public"]["Enums"]["deposit_refund_timing"]
          description?: string
          engine_info?: string
          excludes?: string[]
          fuel_policy_included?: boolean
          has_fire_extinguisher?: boolean
          has_life_raft?: boolean
          hourly_rate?: number | null
          id?: string
          includes?: string[]
          internal_short_name?: string
          legal_capacity?: number
          length_meters?: number | null
          lifejacket_count?: number
          main_marina_id?: string | null
          main_marina_kind?: Database["public"]["Enums"]["location_point_kind"]
          min_rental_hours?: number
          multiday_max_units?: number | null
          multiday_min_units?: number | null
          multiday_unit?: Database["public"]["Enums"]["multiday_unit"] | null
          multiday_unit_price?: number | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          per_person_min_group?: number | null
          per_person_price?: number | null
          pricing_model?: Database["public"]["Enums"]["boat_pricing_model"]
          require_captain_license?: boolean
          safety_notes?: string
          security_deposit?: number
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          weather_cancellation_enabled?: boolean
          what_to_bring?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "boat_cancellation_fk"
            columns: ["tenant_id", "cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policy"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_category_fk"
            columns: ["tenant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "boat_category"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "boat_marina_fk"
            columns: ["tenant_id", "main_marina_id", "main_marina_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "boat_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_booking_detail: {
        Row: {
          assigned_captain_name: string
          boat_id: string
          booking_item_id: string
          captain_option: Database["public"]["Enums"]["captain_option"]
          from_date: string
          from_time: string
          is_blocking: boolean
          operation_status: Database["public"]["Enums"]["operation_status"]
          security_deposit: number
          security_deposit_status: Database["public"]["Enums"]["security_deposit_status"]
          tenant_id: string
          to_date: string
          to_time: string
        }
        Insert: {
          assigned_captain_name?: string
          boat_id: string
          booking_item_id: string
          captain_option: Database["public"]["Enums"]["captain_option"]
          from_date: string
          from_time: string
          is_blocking?: boolean
          operation_status?: Database["public"]["Enums"]["operation_status"]
          security_deposit?: number
          security_deposit_status?: Database["public"]["Enums"]["security_deposit_status"]
          tenant_id: string
          to_date: string
          to_time: string
        }
        Update: {
          assigned_captain_name?: string
          boat_id?: string
          booking_item_id?: string
          captain_option?: Database["public"]["Enums"]["captain_option"]
          from_date?: string
          from_time?: string
          is_blocking?: boolean
          operation_status?: Database["public"]["Enums"]["operation_status"]
          security_deposit?: number
          security_deposit_status?: Database["public"]["Enums"]["security_deposit_status"]
          tenant_id?: string
          to_date?: string
          to_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_booking_detail_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_detail_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_detail_item_fk"
            columns: ["tenant_id", "booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_item"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      boat_category: {
        Row: {
          id: string
          slug: string
          tenant_id: string
          title: string
        }
        Insert: {
          id?: string
          slug: string
          tenant_id: string
          title: string
        }
        Update: {
          id?: string
          slug?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_extra: {
        Row: {
          currency: string
          id: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Insert: {
          currency: string
          id?: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Update: {
          currency?: string
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["charge_type"]
        }
        Relationships: [
          {
            foreignKeyName: "boat_extra_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "boat_extra_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_extra_link: {
        Row: {
          boat_id: string
          extra_id: string
          required: boolean
          sell_phase: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
        }
        Insert: {
          boat_id: string
          extra_id: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
        }
        Update: {
          boat_id?: string
          extra_id?: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_extra_link_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_extra_link_extra_fk"
            columns: ["tenant_id", "extra_id"]
            isOneToOne: false
            referencedRelation: "boat_extra"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_extra_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_feature: {
        Row: {
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_feature_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_feature_link: {
        Row: {
          boat_id: string
          feature_id: string
          tenant_id: string
        }
        Insert: {
          boat_id: string
          feature_id: string
          tenant_id: string
        }
        Update: {
          boat_id?: string
          feature_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_feature_link_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_feature_link_feature_fk"
            columns: ["tenant_id", "feature_id"]
            isOneToOne: false
            referencedRelation: "boat_feature"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_feature_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_hourly_tier: {
        Row: {
          after_hours: number
          boat_id: string
          discount_pct: number
          id: string
          tenant_id: string
        }
        Insert: {
          after_hours: number
          boat_id: string
          discount_pct: number
          id?: string
          tenant_id: string
        }
        Update: {
          after_hours?: number
          boat_id?: string
          discount_pct?: number
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_hourly_tier_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_hourly_tier_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_translation: {
        Row: {
          auto: boolean
          boat_id: string
          description: string
          excludes: string[]
          includes: string[]
          locale: string
          tenant_id: string
          title: string
          updated_at: string
          what_to_bring: string
        }
        Insert: {
          auto?: boolean
          boat_id: string
          description?: string
          excludes?: string[]
          includes?: string[]
          locale: string
          tenant_id: string
          title?: string
          updated_at?: string
          what_to_bring?: string
        }
        Update: {
          auto?: boolean
          boat_id?: string
          description?: string
          excludes?: string[]
          includes?: string[]
          locale?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          what_to_bring?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_translation_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "boat_translation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      booking: {
        Row: {
          agency_id: string
          applied_pricing_rule_id: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          contract_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          fx_rate_locked: number | null
          id: string
          listing_id: string | null
          note: string | null
          ref: string
          source_channel: Database["public"]["Enums"]["source_channel"]
          status: Database["public"]["Enums"]["booking_status"]
          supplier_agency_name: string | null
          supplier_id: string | null
          tenant_id: string
          travel_date: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          applied_pricing_rule_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          contract_id?: string | null
          created_at?: string
          currency: string
          customer_id?: string | null
          fx_rate_locked?: number | null
          id?: string
          listing_id?: string | null
          note?: string | null
          ref: string
          source_channel?: Database["public"]["Enums"]["source_channel"]
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_agency_name?: string | null
          supplier_id?: string | null
          tenant_id: string
          travel_date?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          applied_pricing_rule_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          fx_rate_locked?: number | null
          id?: string
          listing_id?: string | null
          note?: string | null
          ref?: string
          source_channel?: Database["public"]["Enums"]["source_channel"]
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_agency_name?: string | null
          supplier_id?: string | null
          tenant_id?: string
          travel_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "booking_applied_pricing_rule_id_fkey"
            columns: ["applied_pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contract"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_settlement"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "booking_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "booking_customer_fk"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_supplier_fk"
            columns: ["tenant_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_answer: {
        Row: {
          booking_item_id: string
          field_id: string | null
          id: string
          label_snapshot: string
          participant_no: number | null
          tenant_id: string
          value: string
        }
        Insert: {
          booking_item_id: string
          field_id?: string | null
          id?: string
          label_snapshot: string
          participant_no?: number | null
          tenant_id: string
          value?: string
        }
        Update: {
          booking_item_id?: string
          field_id?: string | null
          id?: string
          label_snapshot?: string
          participant_no?: number | null
          tenant_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_answer_field_fk"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "customer_info_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_answer_item_fk"
            columns: ["tenant_id", "booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_item"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_answer_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_item: {
        Row: {
          boat_id: string | null
          booking_id: string
          contract_snapshot: string | null
          currency: string
          id: string
          item_kind: Database["public"]["Enums"]["booking_item_kind"]
          margin_pct: number
          quantity: number
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          supplier_reference: string | null
          supplier_variant_id: string | null
          tenant_id: string
          title_snapshot: string
          tour_departure_id: string | null
          tour_id: string | null
          unit_net_price: number
          variant_name_snapshot: string | null
          vehicle_id: string | null
          villa_id: string | null
          visa_product_id: string | null
        }
        Insert: {
          boat_id?: string | null
          booking_id: string
          contract_snapshot?: string | null
          currency: string
          id?: string
          item_kind: Database["public"]["Enums"]["booking_item_kind"]
          margin_pct?: number
          quantity: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_reference?: string | null
          supplier_variant_id?: string | null
          tenant_id: string
          title_snapshot: string
          tour_departure_id?: string | null
          tour_id?: string | null
          unit_net_price: number
          variant_name_snapshot?: string | null
          vehicle_id?: string | null
          villa_id?: string | null
          visa_product_id?: string | null
        }
        Update: {
          boat_id?: string | null
          booking_id?: string
          contract_snapshot?: string | null
          currency?: string
          id?: string
          item_kind?: Database["public"]["Enums"]["booking_item_kind"]
          margin_pct?: number
          quantity?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_reference?: string | null
          supplier_variant_id?: string | null
          tenant_id?: string
          title_snapshot?: string
          tour_departure_id?: string | null
          tour_id?: string | null
          unit_net_price?: number
          variant_name_snapshot?: string | null
          vehicle_id?: string | null
          villa_id?: string | null
          visa_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_item_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals"
            referencedColumns: ["tenant_id", "booking_id"]
          },
          {
            foreignKeyName: "booking_item_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "booking_item_departure_fk"
            columns: ["tenant_id", "tour_departure_id"]
            isOneToOne: false
            referencedRelation: "tour_departure"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_variant_fk"
            columns: ["tenant_id", "supplier_variant_id"]
            isOneToOne: false
            referencedRelation: "supplier_product_variant"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_item_visa_fk"
            columns: ["tenant_id", "visa_product_id"]
            isOneToOne: false
            referencedRelation: "visa_product"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: number
          reason: string | null
          tenant_id: string
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          reason?: string | null
          tenant_id: string
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          reason?: string | null
          tenant_id?: string
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals"
            referencedColumns: ["tenant_id", "booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_cutoff: {
        Row: {
          days_before: number
          id: string
          policy_id: string
          refund_pct: number
          tenant_id: string
        }
        Insert: {
          days_before: number
          id?: string
          policy_id: string
          refund_pct: number
          tenant_id: string
        }
        Update: {
          days_before?: number
          id?: string
          policy_id?: string
          refund_pct?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_cutoff_policy_fk"
            columns: ["tenant_id", "policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policy"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "cancellation_cutoff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policy: {
        Row: {
          created_at: string
          custom_text: string
          id: string
          no_show_no_refund: boolean
          template: Database["public"]["Enums"]["cancellation_template"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          custom_text?: string
          id?: string
          no_show_no_refund?: boolean
          template?: Database["public"]["Enums"]["cancellation_template"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          custom_text?: string
          id?: string
          no_show_no_refund?: boolean
          template?: Database["public"]["Enums"]["cancellation_template"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_policy_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rule: {
        Row: {
          agency_id: string
          currency: string | null
          id: string
          rule_type: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id: string
          valid_from: string
          valid_to: string | null
          value: number
        }
        Insert: {
          agency_id: string
          currency?: string | null
          id?: string
          rule_type: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id: string
          valid_from: string
          valid_to?: string | null
          value: number
        }
        Update: {
          agency_id?: string
          currency?: string | null
          id?: string
          rule_type?: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id?: string
          valid_from?: string
          valid_to?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rule_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "commission_rule_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "commission_rule_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "commission_rule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      currency: {
        Row: {
          code: string
          is_base: boolean
          name: string
        }
        Insert: {
          code: string
          is_base?: boolean
          name: string
        }
        Update: {
          code?: string
          is_base?: boolean
          name?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          agency_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          passport_no_encrypted: string | null
          phone: string | null
          tenant_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          passport_no_encrypted?: string | null
          phone?: string | null
          tenant_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          passport_no_encrypted?: string | null
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "customer_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_info_field: {
        Row: {
          id: string
          label: string
          position: number
          required: boolean
          scope: Database["public"]["Enums"]["customer_field_scope"]
          tenant_id: string
          tour_id: string
          type: Database["public"]["Enums"]["form_field_type"]
        }
        Insert: {
          id?: string
          label: string
          position: number
          required?: boolean
          scope?: Database["public"]["Enums"]["customer_field_scope"]
          tenant_id: string
          tour_id: string
          type: Database["public"]["Enums"]["form_field_type"]
        }
        Update: {
          id?: string
          label?: string
          position?: number
          required?: boolean
          scope?: Database["public"]["Enums"]["customer_field_scope"]
          tenant_id?: string
          tour_id?: string
          type?: Database["public"]["Enums"]["form_field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "customer_info_field_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_info_field_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      fx_rate: {
        Row: {
          base_code: string
          fetched_at: string
          id: string
          quote_code: string
          rate: number
          source_id: string
          valid_from: string
        }
        Insert: {
          base_code: string
          fetched_at?: string
          id?: string
          quote_code: string
          rate: number
          source_id: string
          valid_from: string
        }
        Update: {
          base_code?: string
          fetched_at?: string
          id?: string
          quote_code?: string
          rate?: number
          source_id?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "fx_rate_base_code_fkey"
            columns: ["base_code"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fx_rate_quote_code_fkey"
            columns: ["quote_code"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fx_rate_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "fx_source"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_source: {
        Row: {
          code: string
          id: string
          is_selected: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          id?: string
          is_selected?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          id?: string
          is_selected?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      idempotency_key: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          key: string
          request_hash: string
          response_body: Json | null
          status_code: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          key: string
          request_hash: string
          response_body?: Json | null
          status_code?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          key?: string
          request_hash?: string
          response_body?: Json | null
          status_code?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_key_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          quantity_available: number
          stop_sale: boolean
          tenant_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          quantity_available?: number
          stop_sale?: boolean
          tenant_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          quantity_available?: number
          stop_sale?: boolean
          tenant_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_fk"
            columns: ["tenant_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "supplier_product_variant"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "supplier_product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          agency_id: string
          amount: number
          created_at: string
          currency: string
          due_date: string
          e_invoice_ref: string | null
          id: string
          number: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number
          tenant_id: string
        }
        Insert: {
          agency_id: string
          amount: number
          created_at?: string
          currency: string
          due_date: string
          e_invoice_ref?: string | null
          id?: string
          number: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          tenant_id: string
        }
        Update: {
          agency_id?: string
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string
          e_invoice_ref?: string | null
          id?: string
          number?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "invoice_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "invoice_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "invoice_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_stop: {
        Row: {
          description: string
          duration_minutes: number
          id: string
          name: string
          position: number
          tenant_id: string
          tour_id: string
        }
        Insert: {
          description?: string
          duration_minutes?: number
          id?: string
          name: string
          position: number
          tenant_id: string
          tour_id: string
        }
        Update: {
          description?: string
          duration_minutes?: number
          id?: string
          name?: string
          position?: number
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_stop_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_stop_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      km_formula: {
        Row: {
          base_fare: number
          currency: string
          enabled: boolean
          per_km: number
          private_multiplier: number
          shuttle_multiplier: number
          tenant_id: string
        }
        Insert: {
          base_fare?: number
          currency: string
          enabled?: boolean
          per_km?: number
          private_multiplier?: number
          shuttle_multiplier?: number
          tenant_id: string
        }
        Update: {
          base_fare?: number
          currency?: string
          enabled?: boolean
          per_km?: number
          private_multiplier?: number
          shuttle_multiplier?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "km_formula_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "km_formula_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entry: {
        Row: {
          account: string
          agency_id: string
          created_at: string
          credit: number
          currency: string
          debit: number
          description: string
          entry_date: string
          id: number
          reference_id: string
          reference_type: Database["public"]["Enums"]["ledger_reference_type"]
          tenant_id: string
        }
        Insert: {
          account: string
          agency_id: string
          created_at?: string
          credit?: number
          currency: string
          debit?: number
          description?: string
          entry_date?: string
          id?: never
          reference_id: string
          reference_type: Database["public"]["Enums"]["ledger_reference_type"]
          tenant_id: string
        }
        Update: {
          account?: string
          agency_id?: string
          created_at?: string
          credit?: number
          currency?: string
          debit?: number
          description?: string
          entry_date?: string
          id?: never
          reference_id?: string
          reference_type?: Database["public"]["Enums"]["ledger_reference_type"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entry_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "ledger_entry_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "ledger_entry_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ledger_entry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      location_point: {
        Row: {
          address: string
          city: string | null
          country: string | null
          created_at: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["location_point_kind"]
          lat: number | null
          lng: number | null
          name: string
          tenant_id: string
        }
        Insert: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          kind: Database["public"]["Enums"]["location_point_kind"]
          lat?: number | null
          lng?: number | null
          name: string
          tenant_id: string
        }
        Update: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["location_point_kind"]
          lat?: number | null
          lng?: number | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_point_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      map_zone: {
        Row: {
          city_country: string
          id: string
          keywords: string
          name: string
          tenant_id: string
        }
        Insert: {
          city_country: string
          id?: string
          keywords?: string
          name: string
          tenant_id: string
        }
        Update: {
          city_country?: string
          id?: string
          keywords?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_zone_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_rule: {
        Row: {
          agency_id: string | null
          default_margin_pct: number
          id: string
          product_type: Database["public"]["Enums"]["product_type"] | null
          supplier_id: string | null
          tenant_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          agency_id?: string | null
          default_margin_pct: number
          id?: string
          product_type?: Database["public"]["Enums"]["product_type"] | null
          supplier_id?: string | null
          tenant_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          agency_id?: string | null
          default_margin_pct?: number
          id?: string
          product_type?: Database["public"]["Enums"]["product_type"] | null
          supplier_id?: string | null
          tenant_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_rule_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "margin_rule_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "margin_rule_supplier_fk"
            columns: ["tenant_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "margin_rule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_access: {
        Row: {
          active: boolean
          agency_id: string
          tenant_id: string
          valid_until: string | null
          via_plan: string | null
        }
        Insert: {
          active?: boolean
          agency_id: string
          tenant_id: string
          valid_until?: string | null
          via_plan?: string | null
        }
        Update: {
          active?: boolean
          agency_id?: string
          tenant_id?: string
          valid_until?: string | null
          via_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_access_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_access_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "marketplace_access_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_access_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency_balance"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "marketplace_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_contract: {
        Row: {
          agreed_pricing_rule_id: string | null
          decided_at: string | null
          id: string
          message: string | null
          requested_at: string
          seller_agency_id: string
          seller_tenant_id: string
          status: Database["public"]["Enums"]["contract_status"]
          supplier_agency_id: string
          supplier_tenant_id: string
        }
        Insert: {
          agreed_pricing_rule_id?: string | null
          decided_at?: string | null
          id?: string
          message?: string | null
          requested_at?: string
          seller_agency_id: string
          seller_tenant_id: string
          status?: Database["public"]["Enums"]["contract_status"]
          supplier_agency_id: string
          supplier_tenant_id: string
        }
        Update: {
          agreed_pricing_rule_id?: string | null
          decided_at?: string | null
          id?: string
          message?: string | null
          requested_at?: string
          seller_agency_id?: string
          seller_tenant_id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          supplier_agency_id?: string
          supplier_tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_contract_agreed_pricing_rule_id_fkey"
            columns: ["agreed_pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contract_seller_fk"
            columns: ["seller_tenant_id", "seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_contract_seller_fk"
            columns: ["seller_tenant_id", "seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "marketplace_contract_seller_tenant_id_fkey"
            columns: ["seller_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contract_supplier_fk"
            columns: ["supplier_tenant_id", "supplier_agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_contract_supplier_fk"
            columns: ["supplier_tenant_id", "supplier_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "marketplace_contract_supplier_tenant_id_fkey"
            columns: ["supplier_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_contract_listing: {
        Row: {
          added_at: string
          contract_id: string
          listing_id: string
        }
        Insert: {
          added_at?: string
          contract_id: string
          listing_id: string
        }
        Update: {
          added_at?: string
          contract_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_contract_listing_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contract"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contract_listing_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_settlement"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "marketplace_contract_listing_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listing: {
        Row: {
          currency: string
          destination: string
          id: string
          image_tone: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          list_price: number
          pricing_rule_id: string
          shared_at: string
          supplier_agency_id: string
          supplier_tenant_id: string
          title: string
          tour_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          currency: string
          destination?: string
          id?: string
          image_tone?: string | null
          is_active?: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          list_price: number
          pricing_rule_id: string
          shared_at?: string
          supplier_agency_id: string
          supplier_tenant_id: string
          title: string
          tour_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          currency?: string
          destination?: string
          id?: string
          image_tone?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          list_price?: number
          pricing_rule_id?: string
          shared_at?: string
          supplier_agency_id?: string
          supplier_tenant_id?: string
          title?: string
          tour_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_agency_fk"
            columns: ["supplier_tenant_id", "supplier_agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_listing_agency_fk"
            columns: ["supplier_tenant_id", "supplier_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "marketplace_listing_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "marketplace_listing_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_supplier_tenant_id_fkey"
            columns: ["supplier_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_tour_fk"
            columns: ["supplier_tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_listing_vehicle_fk"
            columns: ["supplier_tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      marketplace_pricing_rule: {
        Row: {
          commission_pct: number | null
          created_at: string
          currency: string
          id: string
          model: Database["public"]["Enums"]["marketplace_pricing_model"]
          net_amount: number | null
          owner_tenant_id: string
        }
        Insert: {
          commission_pct?: number | null
          created_at?: string
          currency: string
          id?: string
          model: Database["public"]["Enums"]["marketplace_pricing_model"]
          net_amount?: number | null
          owner_tenant_id: string
        }
        Update: {
          commission_pct?: number | null
          created_at?: string
          currency?: string
          id?: string
          model?: Database["public"]["Enums"]["marketplace_pricing_model"]
          net_amount?: number | null
          owner_tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_pricing_rule_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "marketplace_pricing_rule_owner_tenant_id_fkey"
            columns: ["owner_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_profile: {
        Row: {
          agency_id: string
          city: string
          contact_email: string | null
          contact_phone: string | null
          country: string
          default_pricing_rule_id: string | null
          description: string
          is_visible: boolean
          setup_completed_at: string | null
          tenant_id: string
        }
        Insert: {
          agency_id: string
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          default_pricing_rule_id?: string | null
          description?: string
          is_visible?: boolean
          setup_completed_at?: string | null
          tenant_id: string
        }
        Update: {
          agency_id?: string
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          default_pricing_rule_id?: string | null
          description?: string
          is_visible?: boolean
          setup_completed_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_profile_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "marketplace_profile_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "marketplace_profile_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_profile_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency_balance"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "marketplace_profile_default_pricing_rule_id_fkey"
            columns: ["default_pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      media_asset: {
        Row: {
          alt: string
          boat_id: string | null
          created_at: string
          external_url: string | null
          id: string
          is_cover: boolean
          kind: Database["public"]["Enums"]["media_kind"]
          position: number
          storage_path: string | null
          tenant_id: string
          tone: string | null
          tour_id: string | null
          vehicle_id: string | null
          villa_id: string | null
        }
        Insert: {
          alt?: string
          boat_id?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_cover?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          storage_path?: string | null
          tenant_id: string
          tone?: string | null
          tour_id?: string | null
          vehicle_id?: string | null
          villa_id?: string | null
        }
        Update: {
          alt?: string
          boat_id?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_cover?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          storage_path?: string | null
          tenant_id?: string
          tone?: string | null
          tour_id?: string | null
          vehicle_id?: string | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_boat_fk"
            columns: ["tenant_id", "boat_id"]
            isOneToOne: false
            referencedRelation: "boat"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "media_asset_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "media_asset_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "media_asset_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          gateway_reference: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency: string
          gateway_reference?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          gateway_reference?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "payment_booking_fk"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals"
            referencedColumns: ["tenant_id", "booking_id"]
          },
          {
            foreignKeyName: "payment_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "payment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          agency_quota: number
          booking_quota: number
          code: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          supplier_quota: number
        }
        Insert: {
          agency_quota: number
          booking_quota: number
          code: string
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean
          monthly_price: number
          name: string
          supplier_quota: number
        }
        Update: {
          agency_quota?: number
          booking_quota?: number
          code?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          supplier_quota?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
        ]
      }
      plan_feature: {
        Row: {
          code: string
          id: string
          label: string
          plan_id: string
        }
        Insert: {
          code: string
          id?: string
          label: string
          plan_id: string
        }
        Update: {
          code?: string
          id?: string
          label?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_route: {
        Row: {
          currency: string
          description: string
          duration_minutes: number
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          end_point_id: string | null
          end_point_kind: Database["public"]["Enums"]["location_point_kind"]
          end_zone_id: string | null
          id: string
          kind: Database["public"]["Enums"]["route_scope"]
          price_override: number | null
          slug: string
          start_point_id: string | null
          start_point_kind: Database["public"]["Enums"]["location_point_kind"]
          start_zone_id: string | null
          tenant_id: string
          title: string
          use_custom_title_in_listing: boolean
        }
        Insert: {
          currency: string
          description?: string
          duration_minutes?: number
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          end_point_id?: string | null
          end_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          end_zone_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["route_scope"]
          price_override?: number | null
          slug: string
          start_point_id?: string | null
          start_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          start_zone_id?: string | null
          tenant_id: string
          title?: string
          use_custom_title_in_listing?: boolean
        }
        Update: {
          currency?: string
          description?: string
          duration_minutes?: number
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          end_point_id?: string | null
          end_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          end_zone_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["route_scope"]
          price_override?: number | null
          slug?: string
          start_point_id?: string | null
          start_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          start_zone_id?: string | null
          tenant_id?: string
          title?: string
          use_custom_title_in_listing?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "popular_route_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "popular_route_end_point_fk"
            columns: ["tenant_id", "end_point_id", "end_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "popular_route_end_zone_fk"
            columns: ["tenant_id", "end_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "popular_route_start_point_fk"
            columns: ["tenant_id", "start_point_id", "start_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "popular_route_start_zone_fk"
            columns: ["tenant_id", "start_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "popular_route_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_route_vehicle: {
        Row: {
          route_id: string
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          route_id: string
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          route_id?: string
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popular_route_vehicle_route_fk"
            columns: ["tenant_id", "route_id"]
            isOneToOne: false
            referencedRelation: "popular_route"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "popular_route_vehicle_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popular_route_vehicle_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      rental_point: {
        Row: {
          point_id: string
          point_kind: Database["public"]["Enums"]["location_point_kind"]
          role: Database["public"]["Enums"]["rental_point_role"]
          tenant_id: string
        }
        Insert: {
          point_id: string
          point_kind?: Database["public"]["Enums"]["location_point_kind"]
          role: Database["public"]["Enums"]["rental_point_role"]
          tenant_id: string
        }
        Update: {
          point_id?: string
          point_kind?: Database["public"]["Enums"]["location_point_kind"]
          role?: Database["public"]["Enums"]["rental_point_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_point_point_fk"
            columns: ["tenant_id", "point_id", "point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "rental_point_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: true
            referencedRelation: "location_point"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_point_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      role_scope: {
        Row: {
          role: Database["public"]["Enums"]["user_role"]
          scope: string
        }
        Insert: {
          role: Database["public"]["Enums"]["user_role"]
          scope: string
        }
        Update: {
          role?: Database["public"]["Enums"]["user_role"]
          scope?: string
        }
        Relationships: []
      }
      seasonal_rule: {
        Row: {
          adjustment_pct: number
          end_date: string
          id: string
          start_date: string
          tenant_id: string
          tour_id: string
        }
        Insert: {
          adjustment_pct: number
          end_date: string
          id?: string
          start_date: string
          tenant_id: string
          tour_id: string
        }
        Update: {
          adjustment_pct?: number
          end_date?: string
          id?: string
          start_date?: string
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_rule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasonal_rule_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      supplier: {
        Row: {
          adapter_type: Database["public"]["Enums"]["adapter_type"]
          code: string
          created_at: string
          credentials_ref: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["supplier_status"]
          tenant_id: string
        }
        Insert: {
          adapter_type: Database["public"]["Enums"]["adapter_type"]
          code: string
          created_at?: string
          credentials_ref?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["supplier_status"]
          tenant_id: string
        }
        Update: {
          adapter_type?: Database["public"]["Enums"]["adapter_type"]
          code?: string
          created_at?: string
          credentials_ref?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["supplier_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_health_snapshot: {
        Row: {
          avg_latency_ms: number
          error_rate_pct: number
          id: string
          supplier_id: string
          tenant_id: string
          uptime_pct: number
          window_end: string
          window_start: string
        }
        Insert: {
          avg_latency_ms: number
          error_rate_pct: number
          id?: string
          supplier_id: string
          tenant_id: string
          uptime_pct: number
          window_end: string
          window_start: string
        }
        Update: {
          avg_latency_ms?: number
          error_rate_pct?: number
          id?: string
          supplier_id?: string
          tenant_id?: string
          uptime_pct?: number
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_health_snapshot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_health_supplier_fk"
            columns: ["tenant_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      supplier_product: {
        Row: {
          address: string | null
          cached_at: string
          cancellation_hours_before: number | null
          cancellation_type: Database["public"]["Enums"]["cancellation_type"]
          destination: string
          duration_minutes: number | null
          excludes: string[]
          id: string
          image_tone: string | null
          includes: string[]
          languages: string[]
          meeting_point: string | null
          rating: number | null
          review_count: number
          stars: number | null
          summary: string
          supplier_id: string
          supplier_ref: string
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          address?: string | null
          cached_at?: string
          cancellation_hours_before?: number | null
          cancellation_type?: Database["public"]["Enums"]["cancellation_type"]
          destination?: string
          duration_minutes?: number | null
          excludes?: string[]
          id?: string
          image_tone?: string | null
          includes?: string[]
          languages?: string[]
          meeting_point?: string | null
          rating?: number | null
          review_count?: number
          stars?: number | null
          summary?: string
          supplier_id: string
          supplier_ref: string
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          address?: string | null
          cached_at?: string
          cancellation_hours_before?: number | null
          cancellation_type?: Database["public"]["Enums"]["cancellation_type"]
          destination?: string
          duration_minutes?: number | null
          excludes?: string[]
          id?: string
          image_tone?: string | null
          includes?: string[]
          languages?: string[]
          meeting_point?: string | null
          rating?: number | null
          review_count?: number
          stars?: number | null
          summary?: string
          supplier_id?: string
          supplier_ref?: string
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["product_type"]
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_supplier_fk"
            columns: ["tenant_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "supplier_product_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_variant: {
        Row: {
          base_price: number
          board: Database["public"]["Enums"]["board_type"] | null
          cancellation_hours_before: number | null
          cancellation_type: Database["public"]["Enums"]["cancellation_type"]
          currency: string
          id: string
          name: string
          product_id: string
          room_type: string | null
          starts_at: string
          tenant_id: string
        }
        Insert: {
          base_price: number
          board?: Database["public"]["Enums"]["board_type"] | null
          cancellation_hours_before?: number | null
          cancellation_type: Database["public"]["Enums"]["cancellation_type"]
          currency: string
          id?: string
          name: string
          product_id: string
          room_type?: string | null
          starts_at: string
          tenant_id: string
        }
        Update: {
          base_price?: number
          board?: Database["public"]["Enums"]["board_type"] | null
          cancellation_hours_before?: number | null
          cancellation_type?: Database["public"]["Enums"]["cancellation_type"]
          currency?: string
          id?: string
          name?: string
          product_id?: string
          room_type?: string | null
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_variant_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "supplier_product_variant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_variant_product_fk"
            columns: ["tenant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "supplier_product"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tenant: {
        Row: {
          closed_at: string | null
          created_at: string
          default_currency: string
          id: string
          name: string
          plan_id: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          default_currency: string
          id?: string
          name: string
          plan_id: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          default_currency?: string
          id?: string
          name?: string
          plan_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tenant_default_currency_fkey"
            columns: ["default_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          brand_color: string
          logo_path: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brand_color: string
          logo_path?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brand_color?: string
          logo_path?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domain: {
        Row: {
          created_at: string
          hostname: string
          id: string
          kind: string
          tenant_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          kind: string
          tenant_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          kind?: string
          tenant_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domain_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_profile: {
        Row: {
          about: string
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          phone_hours: string | null
          tenant_id: string
          tursab_no: string | null
          updated_at: string
        }
        Insert: {
          about?: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          phone_hours?: string | null
          tenant_id: string
          tursab_no?: string | null
          updated_at?: string
        }
        Update: {
          about?: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          phone_hours?: string | null
          tenant_id?: string
          tursab_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_site: {
        Row: {
          draft: Json
          published: Json | null
          published_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          draft?: Json
          published?: Json | null
          published_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          draft?: Json
          published?: Json | null
          published_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      time_margin_rule: {
        Row: {
          end_point_id: string | null
          end_point_kind: Database["public"]["Enums"]["location_point_kind"]
          end_time: string | null
          end_zone_id: string | null
          id: string
          percent_pct: number
          scope: Database["public"]["Enums"]["route_scope"]
          start_point_id: string | null
          start_point_kind: Database["public"]["Enums"]["location_point_kind"]
          start_time: string | null
          start_zone_id: string | null
          tenant_id: string
        }
        Insert: {
          end_point_id?: string | null
          end_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          end_time?: string | null
          end_zone_id?: string | null
          id?: string
          percent_pct: number
          scope: Database["public"]["Enums"]["route_scope"]
          start_point_id?: string | null
          start_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          start_time?: string | null
          start_zone_id?: string | null
          tenant_id: string
        }
        Update: {
          end_point_id?: string | null
          end_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          end_time?: string | null
          end_zone_id?: string | null
          id?: string
          percent_pct?: number
          scope?: Database["public"]["Enums"]["route_scope"]
          start_point_id?: string | null
          start_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          start_time?: string | null
          start_zone_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_margin_rule_end_point_fk"
            columns: ["tenant_id", "end_point_id", "end_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "time_margin_rule_end_zone_fk"
            columns: ["tenant_id", "end_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "time_margin_rule_start_point_fk"
            columns: ["tenant_id", "start_point_id", "start_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "time_margin_rule_start_zone_fk"
            columns: ["tenant_id", "start_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "time_margin_rule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      time_margin_rule_vehicle: {
        Row: {
          rule_id: string
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          rule_id: string
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          rule_id?: string
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_margin_rule_vehicle_rule_fk"
            columns: ["tenant_id", "rule_id"]
            isOneToOne: false
            referencedRelation: "time_margin_rule"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "time_margin_rule_vehicle_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_margin_rule_vehicle_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour: {
        Row: {
          agency_id: string
          alternate_display_currency: string | null
          ask_for_price: boolean
          cancellation_policy_id: string | null
          contract_text: string | null
          contract_updated_at: string | null
          contract_version: number
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          end_location: string
          excludes: string[]
          extra_notes: string
          featured: boolean
          forced_currency: boolean
          id: string
          includes: string[]
          know_before_you_go: string
          list_currency_override: string | null
          meeting_point_id: string | null
          meeting_point_kind: Database["public"]["Enums"]["location_point_kind"]
          meeting_time_minutes_before: number | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          pickup_enabled: boolean
          pickup_extra_fee: number
          pickup_regions: string
          pricing_currency: string
          pricing_model: Database["public"]["Enums"]["tour_pricing_model"]
          program_type: Database["public"]["Enums"]["program_type"] | null
          route_stops: string[]
          show_on_website: boolean
          slug: string
          social_post_generated_at: string | null
          social_post_text: string | null
          start_location: string
          status: Database["public"]["Enums"]["content_status"]
          tax_included_in_price: boolean
          tenant_id: string
          title: string
          tour_kind: Database["public"]["Enums"]["tour_kind"] | null
          updated_at: string
          video_url: string | null
          what_to_bring: string
        }
        Insert: {
          agency_id: string
          alternate_display_currency?: string | null
          ask_for_price?: boolean
          cancellation_policy_id?: string | null
          contract_text?: string | null
          contract_updated_at?: string | null
          contract_version?: number
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          end_location?: string
          excludes?: string[]
          extra_notes?: string
          featured?: boolean
          forced_currency?: boolean
          id?: string
          includes?: string[]
          know_before_you_go?: string
          list_currency_override?: string | null
          meeting_point_id?: string | null
          meeting_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          meeting_time_minutes_before?: number | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          pickup_enabled?: boolean
          pickup_extra_fee?: number
          pickup_regions?: string
          pricing_currency: string
          pricing_model?: Database["public"]["Enums"]["tour_pricing_model"]
          program_type?: Database["public"]["Enums"]["program_type"] | null
          route_stops?: string[]
          show_on_website?: boolean
          slug: string
          social_post_generated_at?: string | null
          social_post_text?: string | null
          start_location?: string
          status?: Database["public"]["Enums"]["content_status"]
          tax_included_in_price?: boolean
          tenant_id: string
          title: string
          tour_kind?: Database["public"]["Enums"]["tour_kind"] | null
          updated_at?: string
          video_url?: string | null
          what_to_bring?: string
        }
        Update: {
          agency_id?: string
          alternate_display_currency?: string | null
          ask_for_price?: boolean
          cancellation_policy_id?: string | null
          contract_text?: string | null
          contract_updated_at?: string | null
          contract_version?: number
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          end_location?: string
          excludes?: string[]
          extra_notes?: string
          featured?: boolean
          forced_currency?: boolean
          id?: string
          includes?: string[]
          know_before_you_go?: string
          list_currency_override?: string | null
          meeting_point_id?: string | null
          meeting_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          meeting_time_minutes_before?: number | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          pickup_enabled?: boolean
          pickup_extra_fee?: number
          pickup_regions?: string
          pricing_currency?: string
          pricing_model?: Database["public"]["Enums"]["tour_pricing_model"]
          program_type?: Database["public"]["Enums"]["program_type"] | null
          route_stops?: string[]
          show_on_website?: boolean
          slug?: string
          social_post_generated_at?: string | null
          social_post_text?: string | null
          start_location?: string
          status?: Database["public"]["Enums"]["content_status"]
          tax_included_in_price?: boolean
          tenant_id?: string
          title?: string
          tour_kind?: Database["public"]["Enums"]["tour_kind"] | null
          updated_at?: string
          video_url?: string | null
          what_to_bring?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "tour_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "tour_alternate_display_currency_fkey"
            columns: ["alternate_display_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tour_cancellation_fk"
            columns: ["tenant_id", "cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policy"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "tour_list_currency_override_fkey"
            columns: ["list_currency_override"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tour_meeting_point_fk"
            columns: ["tenant_id", "meeting_point_id", "meeting_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "tour_pricing_currency_fkey"
            columns: ["pricing_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tour_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_age_tier: {
        Row: {
          enabled: boolean
          key: Database["public"]["Enums"]["age_tier_key"]
          max_age: number
          min_age: number
          price: number
          tenant_id: string
          tour_id: string
        }
        Insert: {
          enabled?: boolean
          key: Database["public"]["Enums"]["age_tier_key"]
          max_age: number
          min_age: number
          price?: number
          tenant_id: string
          tour_id: string
        }
        Update: {
          enabled?: boolean
          key?: Database["public"]["Enums"]["age_tier_key"]
          max_age?: number
          min_age?: number
          price?: number
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_age_tier_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_age_tier_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_category: {
        Row: {
          id: string
          slug: string
          tenant_id: string
          title: string
        }
        Insert: {
          id?: string
          slug: string
          tenant_id: string
          title: string
        }
        Update: {
          id?: string
          slug?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_category_link: {
        Row: {
          category_id: string
          tenant_id: string
          tour_id: string
        }
        Insert: {
          category_id: string
          tenant_id: string
          tour_id: string
        }
        Update: {
          category_id?: string
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_category_link_category_fk"
            columns: ["tenant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "tour_category"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "tour_category_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_category_link_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_departure: {
        Row: {
          booked_count: number
          capacity: number
          id: string
          price_override: number | null
          starts_at: string
          stop_sale: boolean
          tenant_id: string
          tour_id: string
        }
        Insert: {
          booked_count?: number
          capacity: number
          id?: string
          price_override?: number | null
          starts_at: string
          stop_sale?: boolean
          tenant_id: string
          tour_id: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          id?: string
          price_override?: number | null
          starts_at?: string
          stop_sale?: boolean
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_departure_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_departure_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_extra: {
        Row: {
          currency: string
          id: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Insert: {
          currency: string
          id?: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Update: {
          currency?: string
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["charge_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tour_extra_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tour_extra_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_extra_link: {
        Row: {
          extra_id: string
          required: boolean
          sell_phase: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
          tour_id: string
        }
        Insert: {
          extra_id: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
          tour_id: string
        }
        Update: {
          extra_id?: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_extra_link_extra_fk"
            columns: ["tenant_id", "extra_id"]
            isOneToOne: false
            referencedRelation: "tour_extra"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "tour_extra_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_extra_link_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_group_pricing: {
        Row: {
          max_size: number
          min_size: number
          price: number
          tenant_id: string
          tour_id: string
        }
        Insert: {
          max_size: number
          min_size: number
          price: number
          tenant_id: string
          tour_id: string
        }
        Update: {
          max_size?: number
          min_size?: number
          price?: number
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_group_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_group_pricing_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_pricing_option: {
        Row: {
          agency_markup_pct: number | null
          agency_net_price: number | null
          date_discount_days: number | null
          date_discount_pct: number | null
          date_discount_type:
            | Database["public"]["Enums"]["date_discount_type"]
            | null
          tenant_id: string
          tiered_discount_pct: number | null
          tiered_min_size: number | null
          tour_id: string
        }
        Insert: {
          agency_markup_pct?: number | null
          agency_net_price?: number | null
          date_discount_days?: number | null
          date_discount_pct?: number | null
          date_discount_type?:
            | Database["public"]["Enums"]["date_discount_type"]
            | null
          tenant_id: string
          tiered_discount_pct?: number | null
          tiered_min_size?: number | null
          tour_id: string
        }
        Update: {
          agency_markup_pct?: number | null
          agency_net_price?: number | null
          date_discount_days?: number | null
          date_discount_pct?: number | null
          date_discount_type?:
            | Database["public"]["Enums"]["date_discount_type"]
            | null
          tenant_id?: string
          tiered_discount_pct?: number | null
          tiered_min_size?: number | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_pricing_option_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_pricing_option_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_tag: {
        Row: {
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_tag_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_tag_link: {
        Row: {
          tag_id: string
          tenant_id: string
          tour_id: string
        }
        Insert: {
          tag_id: string
          tenant_id: string
          tour_id: string
        }
        Update: {
          tag_id?: string
          tenant_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_tag_link_tag_fk"
            columns: ["tenant_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "tour_tag"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "tour_tag_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_tag_link_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tour_translation: {
        Row: {
          auto: boolean
          description: string
          excludes: string[]
          includes: string[]
          know_before_you_go: string
          locale: string
          tenant_id: string
          title: string
          tour_id: string
          updated_at: string
          what_to_bring: string
        }
        Insert: {
          auto?: boolean
          description?: string
          excludes?: string[]
          includes?: string[]
          know_before_you_go?: string
          locale: string
          tenant_id: string
          title?: string
          tour_id: string
          updated_at?: string
          what_to_bring?: string
        }
        Update: {
          auto?: boolean
          description?: string
          excludes?: string[]
          includes?: string[]
          know_before_you_go?: string
          locale?: string
          tenant_id?: string
          title?: string
          tour_id?: string
          updated_at?: string
          what_to_bring?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_translation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_translation_tour_fk"
            columns: ["tenant_id", "tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      transfer_booking_detail: {
        Row: {
          adults: number
          assigned_driver_name: string
          assigned_driver_note: string
          booking_item_id: string
          children: number
          from_label: string
          model: Database["public"]["Enums"]["transfer_booking_model"]
          one_way: boolean
          operation_status: Database["public"]["Enums"]["operation_status"]
          pickup_date: string
          pickup_time: string
          return_date: string | null
          return_time: string | null
          tenant_id: string
          to_label: string
        }
        Insert: {
          adults?: number
          assigned_driver_name?: string
          assigned_driver_note?: string
          booking_item_id: string
          children?: number
          from_label: string
          model: Database["public"]["Enums"]["transfer_booking_model"]
          one_way?: boolean
          operation_status?: Database["public"]["Enums"]["operation_status"]
          pickup_date: string
          pickup_time: string
          return_date?: string | null
          return_time?: string | null
          tenant_id: string
          to_label: string
        }
        Update: {
          adults?: number
          assigned_driver_name?: string
          assigned_driver_note?: string
          booking_item_id?: string
          children?: number
          from_label?: string
          model?: Database["public"]["Enums"]["transfer_booking_model"]
          one_way?: boolean
          operation_status?: Database["public"]["Enums"]["operation_status"]
          pickup_date?: string
          pickup_time?: string
          return_date?: string | null
          return_time?: string | null
          tenant_id?: string
          to_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_booking_detail_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_detail_item_fk"
            columns: ["tenant_id", "booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_item"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      transfer_point_price: {
        Row: {
          currency: string
          from_point_id: string
          from_point_kind: Database["public"]["Enums"]["location_point_kind"]
          id: string
          price: number
          tenant_id: string
          to_point_id: string
          to_point_kind: Database["public"]["Enums"]["location_point_kind"]
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          currency: string
          from_point_id: string
          from_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          id?: string
          price: number
          tenant_id: string
          to_point_id: string
          to_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          currency?: string
          from_point_id?: string
          from_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          id?: string
          price?: number
          tenant_id?: string
          to_point_id?: string
          to_point_kind?: Database["public"]["Enums"]["location_point_kind"]
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transfer_point_price_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "transfer_point_price_from_fk"
            columns: ["tenant_id", "from_point_id", "from_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
          {
            foreignKeyName: "transfer_point_price_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_point_price_to_fk"
            columns: ["tenant_id", "to_point_id", "to_point_kind"]
            isOneToOne: false
            referencedRelation: "location_point"
            referencedColumns: ["tenant_id", "id", "kind"]
          },
        ]
      }
      transfer_settings: {
        Row: {
          booking_approval_mode: Database["public"]["Enums"]["booking_approval_mode"]
          cancellation_policy_id: string | null
          default_currency: string
          show_hourly_rental_tab: boolean
          tenant_id: string
        }
        Insert: {
          booking_approval_mode?: Database["public"]["Enums"]["booking_approval_mode"]
          cancellation_policy_id?: string | null
          default_currency: string
          show_hourly_rental_tab?: boolean
          tenant_id: string
        }
        Update: {
          booking_approval_mode?: Database["public"]["Enums"]["booking_approval_mode"]
          cancellation_policy_id?: string | null
          default_currency?: string
          show_hourly_rental_tab?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_settings_cancellation_fk"
            columns: ["tenant_id", "cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policy"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "transfer_settings_default_currency_fkey"
            columns: ["default_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "transfer_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle: {
        Row: {
          agency_id: string
          created_at: string
          description: string
          hourly_currency: string | null
          hourly_rate: number | null
          id: string
          luggage_capacity: number
          pricing_model: Database["public"]["Enums"]["vehicle_pricing_model"]
          seat_capacity: number
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          video_url: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          description?: string
          hourly_currency?: string | null
          hourly_rate?: number | null
          id?: string
          luggage_capacity?: number
          pricing_model?: Database["public"]["Enums"]["vehicle_pricing_model"]
          seat_capacity: number
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          video_url?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          description?: string
          hourly_currency?: string | null
          hourly_rate?: number | null
          id?: string
          luggage_capacity?: number
          pricing_model?: Database["public"]["Enums"]["vehicle_pricing_model"]
          seat_capacity?: number
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "vehicle_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "vehicle_hourly_currency_fkey"
            columns: ["hourly_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "vehicle_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_extra: {
        Row: {
          currency: string
          id: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Insert: {
          currency: string
          id?: string
          name: string
          price: number
          tenant_id: string
          type: Database["public"]["Enums"]["charge_type"]
        }
        Update: {
          currency?: string
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["charge_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_extra_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "vehicle_extra_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_extra_link: {
        Row: {
          extra_id: string
          required: boolean
          sell_phase: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          extra_id: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          extra_id?: string
          required?: boolean
          sell_phase?: Database["public"]["Enums"]["sell_phase"]
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_extra_link_extra_fk"
            columns: ["tenant_id", "extra_id"]
            isOneToOne: false
            referencedRelation: "vehicle_extra"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "vehicle_extra_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_extra_link_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      vehicle_feature: {
        Row: {
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_feature_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_feature_link: {
        Row: {
          feature_id: string
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          feature_id: string
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          feature_id?: string
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_feature_link_feature_fk"
            columns: ["tenant_id", "feature_id"]
            isOneToOne: false
            referencedRelation: "vehicle_feature"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "vehicle_feature_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_feature_link_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      vehicle_translation: {
        Row: {
          auto: boolean
          description: string
          locale: string
          tenant_id: string
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          auto?: boolean
          description?: string
          locale: string
          tenant_id: string
          title?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          auto?: boolean
          description?: string
          locale?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_translation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_translation_vehicle_fk"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa: {
        Row: {
          address_detail: string
          agency_id: string
          ask_for_price: boolean
          booking_cutoff_days: number
          cancellation_policy_id: string | null
          capacity: number
          category_id: string | null
          check_in_time: string
          check_out_time: string
          collect_estimated_arrival: boolean
          collect_guest_breakdown: boolean
          collect_special_requests: boolean
          created_at: string
          description: string
          district: string
          forced_currency: boolean
          id: string
          list_currency_override: string | null
          list_price: number | null
          map_lat: number | null
          map_lng: number | null
          min_nights: number
          nightly_rate: number
          pets_allowed: boolean
          price_currency: string
          province: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          tourism_license_no: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address_detail?: string
          agency_id: string
          ask_for_price?: boolean
          booking_cutoff_days?: number
          cancellation_policy_id?: string | null
          capacity?: number
          category_id?: string | null
          check_in_time?: string
          check_out_time?: string
          collect_estimated_arrival?: boolean
          collect_guest_breakdown?: boolean
          collect_special_requests?: boolean
          created_at?: string
          description?: string
          district?: string
          forced_currency?: boolean
          id?: string
          list_currency_override?: string | null
          list_price?: number | null
          map_lat?: number | null
          map_lng?: number | null
          min_nights?: number
          nightly_rate?: number
          pets_allowed?: boolean
          price_currency: string
          province?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          tourism_license_no?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address_detail?: string
          agency_id?: string
          ask_for_price?: boolean
          booking_cutoff_days?: number
          cancellation_policy_id?: string | null
          capacity?: number
          category_id?: string | null
          check_in_time?: string
          check_out_time?: string
          collect_estimated_arrival?: boolean
          collect_guest_breakdown?: boolean
          collect_special_requests?: boolean
          created_at?: string
          description?: string
          district?: string
          forced_currency?: boolean
          id?: string
          list_currency_override?: string | null
          list_price?: number | null
          map_lat?: number | null
          map_lng?: number | null
          min_nights?: number
          nightly_rate?: number
          pets_allowed?: boolean
          price_currency?: string
          province?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          tourism_license_no?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "villa_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "villa_cancellation_fk"
            columns: ["tenant_id", "cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policy"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_category_fk"
            columns: ["tenant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "villa_category"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_list_currency_override_fkey"
            columns: ["list_currency_override"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "villa_price_currency_fkey"
            columns: ["price_currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "villa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_booking_detail: {
        Row: {
          booking_item_id: string
          booking_method: Database["public"]["Enums"]["villa_booking_method"]
          check_in_date: string
          check_out_date: string
          guests: number
          is_blocking: boolean
          nights: number | null
          operation_status: Database["public"]["Enums"]["operation_status"]
          tenant_id: string
          villa_id: string
        }
        Insert: {
          booking_item_id: string
          booking_method: Database["public"]["Enums"]["villa_booking_method"]
          check_in_date: string
          check_out_date: string
          guests: number
          is_blocking?: boolean
          nights?: number | null
          operation_status?: Database["public"]["Enums"]["operation_status"]
          tenant_id: string
          villa_id: string
        }
        Update: {
          booking_item_id?: string
          booking_method?: Database["public"]["Enums"]["villa_booking_method"]
          check_in_date?: string
          check_out_date?: string
          guests?: number
          is_blocking?: boolean
          nights?: number | null
          operation_status?: Database["public"]["Enums"]["operation_status"]
          tenant_id?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_booking_detail_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_detail_item_fk"
            columns: ["tenant_id", "booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_item"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_detail_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa_booking_method_option: {
        Row: {
          method: Database["public"]["Enums"]["villa_booking_method"]
          tenant_id: string
          villa_id: string
        }
        Insert: {
          method: Database["public"]["Enums"]["villa_booking_method"]
          tenant_id: string
          villa_id: string
        }
        Update: {
          method?: Database["public"]["Enums"]["villa_booking_method"]
          tenant_id?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_booking_method_option_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_booking_method_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa_category: {
        Row: {
          id: string
          tenant_id: string
          title: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_feature: {
        Row: {
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_feature_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_feature_link: {
        Row: {
          feature_id: string
          tenant_id: string
          villa_id: string
        }
        Insert: {
          feature_id: string
          tenant_id: string
          villa_id: string
        }
        Update: {
          feature_id?: string
          tenant_id?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_feature_link_feature_fk"
            columns: ["tenant_id", "feature_id"]
            isOneToOne: false
            referencedRelation: "villa_feature"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_feature_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_feature_link_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa_poi_distance: {
        Row: {
          distance: number
          id: string
          label: string
          tenant_id: string
          unit: Database["public"]["Enums"]["distance_unit"]
          villa_id: string
        }
        Insert: {
          distance: number
          id?: string
          label: string
          tenant_id: string
          unit?: Database["public"]["Enums"]["distance_unit"]
          villa_id: string
        }
        Update: {
          distance?: number
          id?: string
          label?: string
          tenant_id?: string
          unit?: Database["public"]["Enums"]["distance_unit"]
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_poi_distance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_poi_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa_region: {
        Row: {
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_region_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_region_link: {
        Row: {
          region_id: string
          tenant_id: string
          villa_id: string
        }
        Insert: {
          region_id: string
          tenant_id: string
          villa_id: string
        }
        Update: {
          region_id?: string
          tenant_id?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_region_link_region_fk"
            columns: ["tenant_id", "region_id"]
            isOneToOne: false
            referencedRelation: "villa_region"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "villa_region_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_region_link_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      villa_translation: {
        Row: {
          auto: boolean
          description: string
          locale: string
          tenant_id: string
          title: string
          updated_at: string
          villa_id: string
        }
        Insert: {
          auto?: boolean
          description?: string
          locale: string
          tenant_id: string
          title?: string
          updated_at?: string
          villa_id: string
        }
        Update: {
          auto?: boolean
          description?: string
          locale?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_translation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_translation_villa_fk"
            columns: ["tenant_id", "villa_id"]
            isOneToOne: false
            referencedRelation: "villa"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      visa_application: {
        Row: {
          answers: Json
          applicant_name: string
          document_names: string[]
          extra_doc_request_sent_at: string | null
          form_id: string | null
          form_name_snapshot: string
          id: string
          status: Database["public"]["Enums"]["visa_application_status"]
          submitted_at: string
          tenant_id: string
        }
        Insert: {
          answers?: Json
          applicant_name: string
          document_names?: string[]
          extra_doc_request_sent_at?: string | null
          form_id?: string | null
          form_name_snapshot: string
          id?: string
          status?: Database["public"]["Enums"]["visa_application_status"]
          submitted_at?: string
          tenant_id: string
        }
        Update: {
          answers?: Json
          applicant_name?: string
          document_names?: string[]
          extra_doc_request_sent_at?: string | null
          form_id?: string | null
          form_name_snapshot?: string
          id?: string
          status?: Database["public"]["Enums"]["visa_application_status"]
          submitted_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_application_form_fk"
            columns: ["tenant_id", "form_id"]
            isOneToOne: false
            referencedRelation: "visa_form"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "visa_application_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_application_notification: {
        Row: {
          application_id: string
          id: string
          message: string
          sent_at: string
          tenant_id: string
        }
        Insert: {
          application_id: string
          id?: string
          message: string
          sent_at?: string
          tenant_id: string
        }
        Update: {
          application_id?: string
          id?: string
          message?: string
          sent_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_application_notification_fk"
            columns: ["tenant_id", "application_id"]
            isOneToOne: false
            referencedRelation: "visa_application"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "visa_application_notification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_booking_detail: {
        Row: {
          application_id: string | null
          booking_item_id: string
          operation_status: Database["public"]["Enums"]["operation_status"]
          tenant_id: string
        }
        Insert: {
          application_id?: string | null
          booking_item_id: string
          operation_status?: Database["public"]["Enums"]["operation_status"]
          tenant_id: string
        }
        Update: {
          application_id?: string | null
          booking_item_id?: string
          operation_status?: Database["public"]["Enums"]["operation_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_booking_detail_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_detail_application_fk"
            columns: ["tenant_id", "application_id"]
            isOneToOne: false
            referencedRelation: "visa_application"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "visa_detail_item_fk"
            columns: ["tenant_id", "booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_item"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      visa_form: {
        Row: {
          accepting_submissions: boolean
          created_at: string
          description: string
          id: string
          name: string
          tenant_id: string
          thank_you_message: string
          updated_at: string
        }
        Insert: {
          accepting_submissions?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          tenant_id: string
          thank_you_message?: string
          updated_at?: string
        }
        Update: {
          accepting_submissions?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          tenant_id?: string
          thank_you_message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_form_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_form_field: {
        Row: {
          form_id: string
          id: string
          label: string
          options: string[]
          position: number
          required: boolean
          tenant_id: string
          type: Database["public"]["Enums"]["form_field_type"]
        }
        Insert: {
          form_id: string
          id?: string
          label: string
          options?: string[]
          position: number
          required?: boolean
          tenant_id: string
          type: Database["public"]["Enums"]["form_field_type"]
        }
        Update: {
          form_id?: string
          id?: string
          label?: string
          options?: string[]
          position?: number
          required?: boolean
          tenant_id?: string
          type?: Database["public"]["Enums"]["form_field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visa_form_field_form_fk"
            columns: ["tenant_id", "form_id"]
            isOneToOne: false
            referencedRelation: "visa_form"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "visa_form_field_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_product: {
        Row: {
          agency_id: string
          country: string
          created_at: string
          currency: string
          description: string
          id: string
          price: number
          processing_days_max: number | null
          processing_days_min: number | null
          required_documents: string[]
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          country: string
          created_at?: string
          currency: string
          description?: string
          id?: string
          price?: number
          processing_days_max?: number | null
          processing_days_min?: number | null
          required_documents?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          price?: number
          processing_days_max?: number | null
          processing_days_min?: number | null
          required_documents?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_product_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "visa_product_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "visa_product_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "visa_product_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_price: {
        Row: {
          currency: string
          from_zone_id: string
          id: string
          price: number
          tenant_id: string
          to_zone_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          currency: string
          from_zone_id: string
          id?: string
          price: number
          tenant_id: string
          to_zone_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          currency?: string
          from_zone_id?: string
          id?: string
          price?: number
          tenant_id?: string
          to_zone_id?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "zone_price_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "zone_price_from_fk"
            columns: ["tenant_id", "from_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "zone_price_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_price_to_fk"
            columns: ["tenant_id", "to_zone_id"]
            isOneToOne: false
            referencedRelation: "map_zone"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
    }
    Views: {
      agency_balance: {
        Row: {
          agency_id: string | null
          available: number | null
          balance: number | null
          credit_limit: number | null
          currency: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "agency_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_statement: {
        Row: {
          account: string | null
          agency_id: string | null
          created_at: string | null
          credit: number | null
          currency: string | null
          debit: number | null
          description: string | null
          entry_date: string | null
          id: number | null
          reference_id: string | null
          reference_type:
            | Database["public"]["Enums"]["ledger_reference_type"]
            | null
          running_balance: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entry_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "ledger_entry_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "ledger_entry_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ledger_entry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_totals: {
        Row: {
          agency_id: string | null
          booking_id: string | null
          currency: string | null
          margin_total: number | null
          net_total: number | null
          sale_total: number | null
          tenant_id: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_agency_fk"
            columns: ["tenant_id", "agency_id"]
            isOneToOne: false
            referencedRelation: "agency_balance"
            referencedColumns: ["tenant_id", "agency_id"]
          },
          {
            foreignKeyName: "booking_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "booking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_settlement: {
        Row: {
          booking_id: string | null
          contract_id: string | null
          created_at: string | null
          currency: string | null
          pricing_model:
            | Database["public"]["Enums"]["marketplace_pricing_model"]
            | null
          ref: string | null
          sale_total: number | null
          seller_agency_id: string | null
          seller_earning: number | null
          supplier_agency_id: string | null
          supplier_payout: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["code"]
          },
        ]
      }
      tenant_site_public: {
        Row: {
          published: Json | null
          published_at: string | null
          tenant_id: string | null
        }
        Insert: {
          published?: Json | null
          published_at?: string | null
          tenant_id?: string | null
        }
        Update: {
          published?: Json | null
          published_at?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_agency_id: { Args: never; Returns: string }
      app_has_scope: { Args: { required: string }; Returns: boolean }
      app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      app_tenant_id: { Args: never; Returns: string }
      app_user_id: { Args: never; Returns: string }
      create_storefront_booking: {
        Args: { p_customer: Json; p_items: Json; p_tenant_id: string }
        Returns: {
          booking_id: string
          currency: string
          ref: string
          total: number
        }[]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      has_marketplace_access: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      tour_is_public: { Args: { p_tour_id: string }; Returns: boolean }
    }
    Enums: {
      adapter_type:
        | "gds"
        | "ndc"
        | "bedbank"
        | "own_contracted"
        | "payment"
        | "tax"
        | "marketplace"
      age_tier_key: "adult" | "child" | "infant"
      agency_type: "master" | "sub_agency"
      board_type: "room_only" | "breakfast" | "half_board" | "all_inclusive"
      boat_pricing_model: "saatlik" | "cokGunlu" | "kisiBasi"
      booking_approval_mode: "otomatik" | "manuel"
      booking_item_kind:
        | "supplier_product"
        | "tour"
        | "transfer"
        | "boat"
        | "villa"
        | "visa"
      booking_status:
        | "DRAFT"
        | "PENDING"
        | "CONFIRMED"
        | "PARTIALLY_CANCELLED"
        | "CANCELLED"
        | "REFUNDED"
        | "FAILED"
        | "COMPLETED"
      cancellation_template: "esnek" | "orta" | "kati" | "ozel"
      cancellation_type: "free" | "nonRefundable"
      captain_fee_unit: "saatlik" | "gunluk"
      captain_option: "kaptanli" | "kaptansiz" | "herIkisi"
      captain_payment_method: "limandaNakit" | "platform"
      charge_type: "perPerson" | "perBooking"
      commission_rule_type: "percentage" | "fixed" | "tiered"
      content_status: "taslak" | "aktif" | "pasif" | "arsivlendi"
      contract_status:
        | "beklemede"
        | "onaylandi"
        | "reddedildi"
        | "sonlandirildi"
      customer_field_scope: "bookingOwner" | "eachParticipant"
      date_discount_type: "earlyBird" | "lastMinute"
      deposit_block_timing: "onayAninda" | "checkinde"
      deposit_refund_timing: "checkoutSonrasi" | "hasarDegerlendirmesiSonrasi"
      difficulty: "kolay" | "orta" | "zor" | "uzman"
      distance_unit: "m" | "km"
      duration_unit: "dakika" | "saat"
      form_field_type: "text" | "date" | "file" | "select"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      ledger_reference_type: "booking" | "payment" | "invoice" | "adjustment"
      listing_kind: "tur" | "arac"
      location_point_kind: "meeting" | "transfer" | "marina" | "rental"
      marketplace_pricing_model: "komisyon" | "netFiyat"
      media_kind: "image" | "video"
      multiday_unit: "gece" | "gun"
      operation_status: "planlamaBekliyor" | "aktifTransfer" | "tamamlandi"
      payment_method: "card" | "bank_transfer" | "vcc" | "agency_credit"
      payment_mode:
        | "anindaTamOdeme"
        | "kaporaBakiye"
        | "sadeceRezervasyon"
        | "cariHesap"
        | "yerindeOdeme"
        | "havaleEft"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      product_type: "hotel" | "tour" | "transfer" | "flight" | "package"
      program_type: "tur" | "aktivite" | "transfer" | "bilet"
      rental_point_role: "pickup" | "dropoff" | "both"
      route_scope: "point" | "zone"
      security_deposit_status: "bloke" | "iadeEdildi" | "kesintiYapildi"
      sell_phase: "duringBooking" | "afterBooking"
      source_channel: "direkt" | "pazaryeri"
      supplier_status: "sandbox" | "active" | "degraded" | "disabled"
      tenant_status: "trial" | "active" | "suspended" | "closed"
      tour_kind: "gunubirlik" | "cokGunlu" | "ozel" | "konaklamali"
      tour_pricing_model: "kisiBasi" | "grupBazli" | "konaklamaBazli"
      transfer_booking_model: "nokta" | "harita" | "saatlik"
      user_role: "platform_admin" | "agency_admin" | "sales" | "accounting"
      user_status: "active" | "invited" | "disabled"
      vehicle_pricing_model: "rotaBazli" | "saatlikKiralama"
      vehicle_type: "private" | "shuttle"
      villa_booking_method:
        | "talepTopla"
        | "onlineOdemeIleAl"
        | "belirliOranOdeme"
        | "belirliOranOdemeYuvarla"
      visa_application_status:
        | "yeni"
        | "inceleniyor"
        | "belgeBekleniyor"
        | "konsoloslugaIletildi"
        | "tamamlandi"
        | "reddedildi"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      adapter_type: [
        "gds",
        "ndc",
        "bedbank",
        "own_contracted",
        "payment",
        "tax",
        "marketplace",
      ],
      age_tier_key: ["adult", "child", "infant"],
      agency_type: ["master", "sub_agency"],
      board_type: ["room_only", "breakfast", "half_board", "all_inclusive"],
      boat_pricing_model: ["saatlik", "cokGunlu", "kisiBasi"],
      booking_approval_mode: ["otomatik", "manuel"],
      booking_item_kind: [
        "supplier_product",
        "tour",
        "transfer",
        "boat",
        "villa",
        "visa",
      ],
      booking_status: [
        "DRAFT",
        "PENDING",
        "CONFIRMED",
        "PARTIALLY_CANCELLED",
        "CANCELLED",
        "REFUNDED",
        "FAILED",
        "COMPLETED",
      ],
      cancellation_template: ["esnek", "orta", "kati", "ozel"],
      cancellation_type: ["free", "nonRefundable"],
      captain_fee_unit: ["saatlik", "gunluk"],
      captain_option: ["kaptanli", "kaptansiz", "herIkisi"],
      captain_payment_method: ["limandaNakit", "platform"],
      charge_type: ["perPerson", "perBooking"],
      commission_rule_type: ["percentage", "fixed", "tiered"],
      content_status: ["taslak", "aktif", "pasif", "arsivlendi"],
      contract_status: [
        "beklemede",
        "onaylandi",
        "reddedildi",
        "sonlandirildi",
      ],
      customer_field_scope: ["bookingOwner", "eachParticipant"],
      date_discount_type: ["earlyBird", "lastMinute"],
      deposit_block_timing: ["onayAninda", "checkinde"],
      deposit_refund_timing: ["checkoutSonrasi", "hasarDegerlendirmesiSonrasi"],
      difficulty: ["kolay", "orta", "zor", "uzman"],
      distance_unit: ["m", "km"],
      duration_unit: ["dakika", "saat"],
      form_field_type: ["text", "date", "file", "select"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      ledger_reference_type: ["booking", "payment", "invoice", "adjustment"],
      listing_kind: ["tur", "arac"],
      location_point_kind: ["meeting", "transfer", "marina", "rental"],
      marketplace_pricing_model: ["komisyon", "netFiyat"],
      media_kind: ["image", "video"],
      multiday_unit: ["gece", "gun"],
      operation_status: ["planlamaBekliyor", "aktifTransfer", "tamamlandi"],
      payment_method: ["card", "bank_transfer", "vcc", "agency_credit"],
      payment_mode: [
        "anindaTamOdeme",
        "kaporaBakiye",
        "sadeceRezervasyon",
        "cariHesap",
        "yerindeOdeme",
        "havaleEft",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      product_type: ["hotel", "tour", "transfer", "flight", "package"],
      program_type: ["tur", "aktivite", "transfer", "bilet"],
      rental_point_role: ["pickup", "dropoff", "both"],
      route_scope: ["point", "zone"],
      security_deposit_status: ["bloke", "iadeEdildi", "kesintiYapildi"],
      sell_phase: ["duringBooking", "afterBooking"],
      source_channel: ["direkt", "pazaryeri"],
      supplier_status: ["sandbox", "active", "degraded", "disabled"],
      tenant_status: ["trial", "active", "suspended", "closed"],
      tour_kind: ["gunubirlik", "cokGunlu", "ozel", "konaklamali"],
      tour_pricing_model: ["kisiBasi", "grupBazli", "konaklamaBazli"],
      transfer_booking_model: ["nokta", "harita", "saatlik"],
      user_role: ["platform_admin", "agency_admin", "sales", "accounting"],
      user_status: ["active", "invited", "disabled"],
      vehicle_pricing_model: ["rotaBazli", "saatlikKiralama"],
      vehicle_type: ["private", "shuttle"],
      villa_booking_method: [
        "talepTopla",
        "onlineOdemeIleAl",
        "belirliOranOdeme",
        "belirliOranOdemeYuvarla",
      ],
      visa_application_status: [
        "yeni",
        "inceleniyor",
        "belgeBekleniyor",
        "konsoloslugaIletildi",
        "tamamlandi",
        "reddedildi",
      ],
    },
  },
} as const
