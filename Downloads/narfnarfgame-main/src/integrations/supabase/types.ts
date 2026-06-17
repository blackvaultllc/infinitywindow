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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_user: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user?: string | null
        }
        Relationships: []
      }
      arena_actions: {
        Row: {
          ability_slug: string
          created_at: string
          damage: number
          id: string
          match_id: string
          team: string
          turn: number
          user_id: string
        }
        Insert: {
          ability_slug: string
          created_at?: string
          damage?: number
          id?: string
          match_id: string
          team: string
          turn: number
          user_id: string
        }
        Update: {
          ability_slug?: string
          created_at?: string
          damage?: number
          id?: string
          match_id?: string
          team?: string
          turn?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "arena_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_match_players: {
        Row: {
          country: string | null
          id: string
          is_ready: boolean
          joined_at: string
          match_id: string
          slot: number
          team: string
          user_id: string
        }
        Insert: {
          country?: string | null
          id?: string
          is_ready?: boolean
          joined_at?: string
          match_id: string
          slot: number
          team: string
          user_id: string
        }
        Update: {
          country?: string | null
          id?: string
          is_ready?: boolean
          joined_at?: string
          match_id?: string
          slot?: number
          team?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "arena_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_matches: {
        Row: {
          created_at: string
          current_team: string
          ended_at: string | null
          humans_score: number
          id: string
          mode: string
          planet_score: number
          started_at: string | null
          status: string
          turn: number
          winner: string | null
        }
        Insert: {
          created_at?: string
          current_team?: string
          ended_at?: string | null
          humans_score?: number
          id?: string
          mode?: string
          planet_score?: number
          started_at?: string | null
          status?: string
          turn?: number
          winner?: string | null
        }
        Update: {
          created_at?: string
          current_team?: string
          ended_at?: string | null
          humans_score?: number
          id?: string
          mode?: string
          planet_score?: number
          started_at?: string | null
          status?: string
          turn?: number
          winner?: string | null
        }
        Relationships: []
      }
      chat_filter_terms: {
        Row: {
          created_at: string
          id: string
          severity: number
          term: string
        }
        Insert: {
          created_at?: string
          id?: string
          severity: number
          term: string
        }
        Update: {
          created_at?: string
          id?: string
          severity?: number
          term?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          channel: string
          clan_id: string | null
          country: string | null
          created_at: string
          display_name: string | null
          flagged: boolean
          friend_id: string | null
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          user_id: string
        }
        Insert: {
          body: string
          channel: string
          clan_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          flagged?: boolean
          friend_id?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          user_id: string
        }
        Update: {
          body?: string
          channel?: string
          clan_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          flagged?: boolean
          friend_id?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_join_requests: {
        Row: {
          clan_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          status: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          status?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_join_requests_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          recruitment: string
          slug: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          recruitment?: string
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          recruitment?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      codex_entries: {
        Row: {
          body: string
          category: string
          slug: string
          sort: number
          title: string
        }
        Insert: {
          body: string
          category?: string
          slug: string
          sort?: number
          title: string
        }
        Update: {
          body?: string
          category?: string
          slug?: string
          sort?: number
          title?: string
        }
        Relationships: []
      }
      coin_ledger: {
        Row: {
          created_at: string
          delta: number
          granted_by: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          granted_by?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          granted_by?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      cutscenes: {
        Row: {
          created_at: string
          duration_seconds: number
          enabled: boolean
          id: string
          power_category: string
          updated_at: string
          updated_by: string | null
          video_path: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          enabled?: boolean
          id?: string
          power_category: string
          updated_at?: string
          updated_by?: string | null
          video_path?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          enabled?: boolean
          id?: string
          power_category?: string
          updated_at?: string
          updated_by?: string | null
          video_path?: string | null
        }
        Relationships: []
      }
      forum_threads: {
        Row: {
          body: string
          brand: string
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          brand: string
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          brand?: string
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      infinity_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infinity_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "infinity_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      infinity_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medusa_events: {
        Row: {
          created_at: string
          direction: string
          error: string | null
          event_type: string | null
          id: string
          message: string | null
          payload: Json
          player_ref: string | null
          severity: string | null
          source_ip: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          payload?: Json
          player_ref?: string | null
          severity?: string | null
          source_ip?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          payload?: Json
          player_ref?: string | null
          severity?: string | null
          source_ip?: string | null
          status?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_message_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_message_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_message_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      parental_requests: {
        Row: {
          child_user_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          kind: string
          parent_email: string | null
          parent_user_id: string | null
          payload: Json
          status: string
        }
        Insert: {
          child_user_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind: string
          parent_email?: string | null
          parent_user_id?: string | null
          payload?: Json
          status?: string
        }
        Update: {
          child_user_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind?: string
          parent_email?: string | null
          parent_user_id?: string | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "parental_requests_child_user_id_fkey"
            columns: ["child_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_requests_child_user_id_fkey"
            columns: ["child_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_requests_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_requests_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_codex: {
        Row: {
          entry_slug: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          entry_slug: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          entry_slug?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_codex_entry_slug_fkey"
            columns: ["entry_slug"]
            isOneToOne: false
            referencedRelation: "codex_entries"
            referencedColumns: ["slug"]
          },
        ]
      }
      player_equipped: {
        Row: {
          category: string
          item_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          item_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          item_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_equipped_item_slug_fkey"
            columns: ["item_slug"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["slug"]
          },
        ]
      }
      player_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_slug: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_slug: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_inventory_item_slug_fkey"
            columns: ["item_slug"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["slug"]
          },
        ]
      }
      player_quests: {
        Row: {
          completed_at: string | null
          quest_slug: string
          started_at: string
          status: string
          step: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          quest_slug: string
          started_at?: string
          status?: string
          step?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          quest_slug?: string
          started_at?: string
          status?: string
          step?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_quests_quest_slug_fkey"
            columns: ["quest_slug"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          alignment_locked: boolean
          avatar_accent: string | null
          avatar_face: string | null
          avatar_flag: string | null
          avatar_gender: string | null
          avatar_hair_color: string | null
          avatar_hair_style: string | null
          avatar_pants_color: string | null
          avatar_role: string | null
          avatar_shirt_color: string | null
          avatar_skin: string | null
          avatar_uniform: string | null
          avatar_url: string | null
          banned: boolean
          bio: string | null
          bonus_multiplier: number
          coins: number
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_minor: boolean
          is_parent: boolean
          is_protected: boolean
          last_seen_at: string | null
          music_enabled: boolean
          music_volume: number
          onboarding_complete: boolean
          parent_email: string | null
          parent_user_id: string | null
          prologue_choice: string | null
          referral_code: string | null
          referral_redeemed: boolean
          referred_by: string | null
          region: string | null
          show_online: boolean
          tour_step: number
          tutorial_seen: boolean
          ui_mode: string
          updated_at: string
          username: string | null
          victory_points: number
        }
        Insert: {
          alignment_locked?: boolean
          avatar_accent?: string | null
          avatar_face?: string | null
          avatar_flag?: string | null
          avatar_gender?: string | null
          avatar_hair_color?: string | null
          avatar_hair_style?: string | null
          avatar_pants_color?: string | null
          avatar_role?: string | null
          avatar_shirt_color?: string | null
          avatar_skin?: string | null
          avatar_uniform?: string | null
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          bonus_multiplier?: number
          coins?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_minor?: boolean
          is_parent?: boolean
          is_protected?: boolean
          last_seen_at?: string | null
          music_enabled?: boolean
          music_volume?: number
          onboarding_complete?: boolean
          parent_email?: string | null
          parent_user_id?: string | null
          prologue_choice?: string | null
          referral_code?: string | null
          referral_redeemed?: boolean
          referred_by?: string | null
          region?: string | null
          show_online?: boolean
          tour_step?: number
          tutorial_seen?: boolean
          ui_mode?: string
          updated_at?: string
          username?: string | null
          victory_points?: number
        }
        Update: {
          alignment_locked?: boolean
          avatar_accent?: string | null
          avatar_face?: string | null
          avatar_flag?: string | null
          avatar_gender?: string | null
          avatar_hair_color?: string | null
          avatar_hair_style?: string | null
          avatar_pants_color?: string | null
          avatar_role?: string | null
          avatar_shirt_color?: string | null
          avatar_skin?: string | null
          avatar_uniform?: string | null
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          bonus_multiplier?: number
          coins?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_minor?: boolean
          is_parent?: boolean
          is_protected?: boolean
          last_seen_at?: string | null
          music_enabled?: boolean
          music_volume?: number
          onboarding_complete?: boolean
          parent_email?: string | null
          parent_user_id?: string | null
          prologue_choice?: string | null
          referral_code?: string | null
          referral_redeemed?: boolean
          referred_by?: string | null
          region?: string | null
          show_online?: boolean
          tour_step?: number
          tutorial_seen?: boolean
          ui_mode?: string
          updated_at?: string
          username?: string | null
          victory_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          body: string
          created_at: string
          is_starter: boolean
          reward_codex: string | null
          reward_coins: number
          slug: string
          steps: Json
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          is_starter?: boolean
          reward_codex?: string | null
          reward_coins?: number
          slug: string
          steps?: Json
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          is_starter?: boolean
          reward_codex?: string | null
          reward_coins?: number
          slug?: string
          steps?: Json
          title?: string
        }
        Relationships: []
      }
      splash_videos: {
        Row: {
          enabled: boolean
          slot: string
          updated_at: string
          updated_by: string | null
          video_path: string | null
        }
        Insert: {
          enabled?: boolean
          slot: string
          updated_at?: string
          updated_by?: string | null
          video_path?: string | null
        }
        Update: {
          enabled?: boolean
          slot?: string
          updated_at?: string
          updated_by?: string | null
          video_path?: string | null
        }
        Relationships: []
      }
      store_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          payload: Json
          price_coins: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          payload?: Json
          price_coins?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          payload?: Json
          price_coins?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mutes: {
        Row: {
          created_at: string
          muted_by: string | null
          muted_until: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          muted_by?: string | null
          muted_until: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          muted_by?: string | null
          muted_until?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
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
          alignment_locked: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          prologue_choice: string | null
          region: string | null
          username: string | null
        }
        Insert: {
          alignment_locked?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          prologue_choice?: string | null
          region?: string | null
          username?: string | null
        }
        Update: {
          alignment_locked?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          prologue_choice?: string | null
          region?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_referral: { Args: { _code: string }; Returns: Json }
      arena_ai_planet_turn: { Args: { _match_id: string }; Returns: Json }
      arena_leave: { Args: { _match_id: string }; Returns: undefined }
      arena_play_ability: {
        Args: { _ability_slug: string; _damage: number; _match_id: string }
        Returns: Json
      }
      arena_quickmatch: { Args: never; Returns: string }
      arena_set_ready: {
        Args: { _match_id: string; _ready: boolean }
        Returns: undefined
      }
      arena_start_ai: { Args: never; Returns: string }
      clan_rank_value: { Args: { _role: string }; Returns: number }
      complete_quest: { Args: { _slug: string }; Returns: Json }
      create_clan: {
        Args: {
          _country?: string
          _description?: string
          _name: string
          _slug: string
        }
        Returns: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          recruitment: string
          slug: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "clans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decide_join_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: undefined
      }
      decide_parental_request: {
        Args: { _approve: boolean; _request_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_muted: { Args: { _user_id: string }; Returns: boolean }
      join_clan: { Args: { _clan_id: string }; Returns: undefined }
      kick_clan_member: {
        Args: { _clan_id: string; _target_user: string }
        Returns: undefined
      }
      leave_clan: { Args: { _clan_id: string }; Returns: undefined }
      mod_ban_user: {
        Args: { _reason: string; _target: string }
        Returns: undefined
      }
      mod_hide_message: {
        Args: { _message_id: string; _reason: string }
        Returns: undefined
      }
      mod_mute_user: {
        Args: { _minutes: number; _reason: string; _target: string }
        Returns: undefined
      }
      mod_review_report: {
        Args: { _dismiss: boolean; _report_id: string }
        Returns: undefined
      }
      mod_unban_user: { Args: { _target: string }; Returns: undefined }
      mod_unmute_user: { Args: { _target: string }; Returns: undefined }
      post_clan_announcement: {
        Args: { _body: string; _clan_id: string }
        Returns: string
      }
      purchase_store_item: { Args: { _slug: string }; Returns: Json }
      report_chat_message: {
        Args: { _message_id: string; _reason?: string }
        Returns: undefined
      }
      request_join_clan: {
        Args: { _clan_id: string; _message?: string }
        Returns: undefined
      }
      request_parental_approval: {
        Args: { _kind: string; _payload: Json }
        Returns: string
      }
      scan_chat_filter: { Args: { _text: string }; Returns: number }
      send_chat_message: {
        Args: {
          _body: string
          _channel: string
          _clan_id?: string
          _country?: string
          _friend_id?: string
        }
        Returns: string
      }
      set_clan_member_role: {
        Args: { _clan_id: string; _new_role: string; _target_user: string }
        Returns: undefined
      }
      set_clan_recruitment: {
        Args: { _clan_id: string; _mode: string }
        Returns: undefined
      }
      set_show_online: { Args: { _show: boolean }; Returns: undefined }
      touch_presence: { Args: never; Returns: undefined }
      transfer_clan_ownership: {
        Args: { _clan_id: string; _new_owner: string }
        Returns: undefined
      }
      unlock_codex: { Args: { _slug: string }; Returns: undefined }
      update_clan_meta: {
        Args: { _clan_id: string; _country: string; _description: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "support" | "player"
      ticket_status: "open" | "in_progress" | "closed"
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
      app_role: ["admin", "moderator", "support", "player"],
      ticket_status: ["open", "in_progress", "closed"],
    },
  },
} as const
