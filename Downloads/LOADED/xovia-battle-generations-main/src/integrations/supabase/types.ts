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
      achievements: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          description: string
          icon?: string
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      arena_matches: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          host_id: string
          host_reported_winner: string | null
          id: string
          mode: string
          opponent_id: string | null
          opponent_reported_winner: string | null
          settled_at: string | null
          stake_ankh: number
          stake_rarity: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          host_id: string
          host_reported_winner?: string | null
          id?: string
          mode: string
          opponent_id?: string | null
          opponent_reported_winner?: string | null
          settled_at?: string | null
          stake_ankh?: number
          stake_rarity?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          host_id?: string
          host_reported_winner?: string | null
          id?: string
          mode?: string
          opponent_id?: string | null
          opponent_reported_winner?: string | null
          settled_at?: string | null
          stake_ankh?: number
          stake_rarity?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      arena_stakes: {
        Row: {
          amount_ankh: number
          card_id: string | null
          card_name: string | null
          card_rarity: string | null
          created_at: string
          id: string
          kind: string
          match_id: string
          released: boolean
          user_id: string
        }
        Insert: {
          amount_ankh?: number
          card_id?: string | null
          card_name?: string | null
          card_rarity?: string | null
          created_at?: string
          id?: string
          kind: string
          match_id: string
          released?: boolean
          user_id: string
        }
        Update: {
          amount_ankh?: number
          card_id?: string | null
          card_name?: string | null
          card_rarity?: string | null
          created_at?: string
          id?: string
          kind?: string
          match_id?: string
          released?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_stakes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "arena_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      battlefields: {
        Row: {
          description: string | null
          id: string
          is_default: boolean
          name: string
          sort_order: number
          theme_css_class: string
          unlock_condition: string
          unlock_value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          theme_css_class: string
          unlock_condition: string
          unlock_value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          theme_css_class?: string
          unlock_condition?: string
          unlock_value?: string | null
        }
        Relationships: []
      }
      board_matches: {
        Row: {
          completed_at: string | null
          created_at: string
          current_seat: number | null
          host_id: string
          id: string
          last_activity_at: string
          max_players: number
          mode: string
          name: string
          settings: Json
          status: string
          turn_deadline: string | null
          turn_number: number
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_seat?: number | null
          host_id: string
          id?: string
          last_activity_at?: string
          max_players?: number
          mode?: string
          name?: string
          settings?: Json
          status?: string
          turn_deadline?: string | null
          turn_number?: number
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_seat?: number | null
          host_id?: string
          id?: string
          last_activity_at?: string
          max_players?: number
          mode?: string
          name?: string
          settings?: Json
          status?: string
          turn_deadline?: string | null
          turn_number?: number
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: []
      }
      board_moves: {
        Row: {
          action: string
          created_at: string
          details: Json
          dice1: number | null
          dice2: number | null
          from_pos: number | null
          id: string
          match_id: string
          player_id: string | null
          to_pos: number | null
          turn_number: number
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          dice1?: number | null
          dice2?: number | null
          from_pos?: number | null
          id?: string
          match_id: string
          player_id?: string | null
          to_pos?: number | null
          turn_number: number
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          dice1?: number | null
          dice2?: number | null
          from_pos?: number | null
          id?: string
          match_id?: string
          player_id?: string | null
          to_pos?: number | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_moves_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "board_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "board_players"
            referencedColumns: ["id"]
          },
        ]
      }
      board_players: {
        Row: {
          display_name: string | null
          exod_in_game: number
          id: string
          is_eliminated: boolean
          jail_turns: number
          joined_at: string
          last_action_at: string
          match_id: string
          position: number
          score: number
          seat: number
          selected_card_id: string | null
          selected_card_name: string | null
          selected_card_rarity: string | null
          user_id: string
        }
        Insert: {
          display_name?: string | null
          exod_in_game?: number
          id?: string
          is_eliminated?: boolean
          jail_turns?: number
          joined_at?: string
          last_action_at?: string
          match_id: string
          position?: number
          score?: number
          seat: number
          selected_card_id?: string | null
          selected_card_name?: string | null
          selected_card_rarity?: string | null
          user_id: string
        }
        Update: {
          display_name?: string | null
          exod_in_game?: number
          id?: string
          is_eliminated?: boolean
          jail_turns?: number
          joined_at?: string
          last_action_at?: string
          match_id?: string
          position?: number
          score?: number
          seat?: number
          selected_card_id?: string | null
          selected_card_name?: string | null
          selected_card_rarity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "board_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      board_property_claims: {
        Row: {
          card_id: string
          card_name: string
          card_rarity: string
          claimed_at: string
          id: string
          level: number
          match_id: string
          owner_player_id: string
          position: number
        }
        Insert: {
          card_id: string
          card_name: string
          card_rarity: string
          claimed_at?: string
          id?: string
          level?: number
          match_id: string
          owner_player_id: string
          position: number
        }
        Update: {
          card_id?: string
          card_name?: string
          card_rarity?: string
          claimed_at?: string
          id?: string
          level?: number
          match_id?: string
          owner_player_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_property_claims_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "board_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_property_claims_owner_player_id_fkey"
            columns: ["owner_player_id"]
            isOneToOne: false
            referencedRelation: "board_players"
            referencedColumns: ["id"]
          },
        ]
      }
      board_vote_responses: {
        Row: {
          agree: boolean
          created_at: string
          player_id: string
          vote_id: string
        }
        Insert: {
          agree: boolean
          created_at?: string
          player_id: string
          vote_id: string
        }
        Update: {
          agree?: boolean
          created_at?: string
          player_id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_vote_responses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "board_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_vote_responses_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "board_votes"
            referencedColumns: ["id"]
          },
        ]
      }
      board_votes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          kind: string
          match_id: string
          no_count: number
          proposer_id: string
          resolved_at: string | null
          status: string
          target_player_id: string | null
          yes_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          kind: string
          match_id: string
          no_count?: number
          proposer_id: string
          resolved_at?: string | null
          status?: string
          target_player_id?: string | null
          yes_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          match_id?: string
          no_count?: number
          proposer_id?: string
          resolved_at?: string | null
          status?: string
          target_player_id?: string | null
          yes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "board_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_votes_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "board_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_votes_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "board_players"
            referencedColumns: ["id"]
          },
        ]
      }
      card_catalog: {
        Row: {
          id: string
          in_packs: boolean
          name: string
          rarity: string
        }
        Insert: {
          id: string
          in_packs?: boolean
          name: string
          rarity: string
        }
        Update: {
          id?: string
          in_packs?: boolean
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      chest_open_log: {
        Row: {
          card_id: string
          card_name: string
          card_rarity: string
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          card_name: string
          card_rarity: string
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          card_name?: string
          card_rarity?: string
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          can_reply: boolean
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          can_reply?: boolean
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          can_reply?: boolean
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_closed: boolean
          kind: string
          last_message_at: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_closed?: boolean
          kind?: string
          last_message_at?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_closed?: boolean
          kind?: string
          last_message_at?: string
          subject?: string | null
        }
        Relationships: []
      }
      device_pair_tokens: {
        Row: {
          approved_at: string | null
          approved_user_id: string | null
          auth_email: string | null
          auth_token_hash: string | null
          consumed_at: string | null
          created_at: string
          expires_at: string
          token: string
          user_agent: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_user_id?: string | null
          auth_email?: string | null
          auth_token_hash?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          token: string
          user_agent?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_user_id?: string | null
          auth_email?: string | null
          auth_token_hash?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      duel_pass_claims: {
        Row: {
          claimed_at: string
          id: string
          track: string
          user_id: string
          week_number: number
        }
        Insert: {
          claimed_at?: string
          id?: string
          track: string
          user_id: string
          week_number: number
        }
        Update: {
          claimed_at?: string
          id?: string
          track?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      duel_pass_subscriptions: {
        Row: {
          renews_at: string | null
          started_at: string | null
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          renews_at?: string | null
          started_at?: string | null
          status?: string
          tier?: string
          user_id: string
        }
        Update: {
          renews_at?: string | null
          started_at?: string | null
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          enabled: boolean
          payout_cents: number
          rarity: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          payout_cents: number
          rarity: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          payout_cents?: number
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          card_id: string
          card_name: string
          card_rarity: string | null
          created_at: string
          currency: string
          id: string
          price_ankh: number | null
          price_exod: number
          seller_id: string
          sold_at: string | null
          status: string
        }
        Insert: {
          buyer_id?: string | null
          card_id: string
          card_name: string
          card_rarity?: string | null
          created_at?: string
          currency?: string
          id?: string
          price_ankh?: number | null
          price_exod: number
          seller_id: string
          sold_at?: string | null
          status?: string
        }
        Update: {
          buyer_id?: string | null
          card_id?: string
          card_name?: string
          card_rarity?: string | null
          created_at?: string
          currency?: string
          id?: string
          price_ankh?: number | null
          price_exod?: number
          seller_id?: string
          sold_at?: string | null
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          duration_minutes: number | null
          evidence: Json
          id: string
          reason: string
          resolution_note: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          duration_minutes?: number | null
          evidence?: Json
          id?: string
          reason: string
          resolution_note?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          duration_minutes?: number | null
          evidence?: Json
          id?: string
          reason?: string
          resolution_note?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      owner_alerts: {
        Row: {
          created_at: string
          id: string
          meta: Json
          read_at: string | null
          read_by: string | null
          reason: string
          score: number
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          read_at?: string | null
          read_by?: string | null
          reason: string
          score: number
          severity: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          read_at?: string | null
          read_by?: string | null
          reason?: string
          score?: number
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      pack_drops: {
        Row: {
          art_url: string | null
          cards_per_pack: number
          closes_at: string | null
          description: string | null
          drop_at: string
          id: string
          name: string
          price_exod: number
          rarity_weights: Json
          remaining_supply: number
          status: string
          total_supply: number
        }
        Insert: {
          art_url?: string | null
          cards_per_pack?: number
          closes_at?: string | null
          description?: string | null
          drop_at?: string
          id?: string
          name: string
          price_exod: number
          rarity_weights?: Json
          remaining_supply: number
          status?: string
          total_supply: number
        }
        Update: {
          art_url?: string | null
          cards_per_pack?: number
          closes_at?: string | null
          description?: string | null
          drop_at?: string
          id?: string
          name?: string
          price_exod?: number
          rarity_weights?: Json
          remaining_supply?: number
          status?: string
          total_supply?: number
        }
        Relationships: []
      }
      pack_purchases: {
        Row: {
          cards_received: Json
          drop_id: string
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          cards_received?: Json
          drop_id: string
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          cards_received?: Json
          drop_id?: string
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_purchases_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "pack_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_fulfillments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          environment: string
          id: string
          meta: Json | null
          price_id: string
          status: string
          stripe_session_id: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          meta?: Json | null
          price_id: string
          status?: string
          stripe_session_id: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          meta?: Json | null
          price_id?: string
          status?: string
          stripe_session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          key: string
          label: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          key: string
          label: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          key?: string
          label?: string
        }
        Relationships: []
      }
      platform_revenue: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          ref_id: string | null
          source: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          ref_id?: string | null
          source: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          ref_id?: string | null
          source?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body_md: string
          category: Database["public"]["Enums"]["post_category"]
          cover_url: string | null
          created_at: string
          event_date: string | null
          event_location: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_md: string
          category?: Database["public"]["Enums"]["post_category"]
          cover_url?: string | null
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_md?: string
          category?: Database["public"]["Enums"]["post_category"]
          cover_url?: string | null
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consent_accepted_at: string | null
          consent_version: number
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          duel_pass_premium_until: string | null
          duels_played: number
          duels_won: number
          id: string
          is_minor: boolean
          is_public: boolean
          last_battle_at: string | null
          level: number
          levelup_exod_today: number
          levelup_reset_at: string
          music_enabled: boolean
          pending_free_packs: number
          rank: string
          recovery_key_hash: string | null
          recovery_key_set_at: string | null
          referral_code: string
          referred_by: string | null
          selected_battlefield_id: string | null
          sfx_enabled: boolean
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consent_accepted_at?: string | null
          consent_version?: number
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          duel_pass_premium_until?: string | null
          duels_played?: number
          duels_won?: number
          id: string
          is_minor?: boolean
          is_public?: boolean
          last_battle_at?: string | null
          level?: number
          levelup_exod_today?: number
          levelup_reset_at?: string
          music_enabled?: boolean
          pending_free_packs?: number
          rank?: string
          recovery_key_hash?: string | null
          recovery_key_set_at?: string | null
          referral_code?: string
          referred_by?: string | null
          selected_battlefield_id?: string | null
          sfx_enabled?: boolean
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consent_accepted_at?: string | null
          consent_version?: number
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          duel_pass_premium_until?: string | null
          duels_played?: number
          duels_won?: number
          id?: string
          is_minor?: boolean
          is_public?: boolean
          last_battle_at?: string | null
          level?: number
          levelup_exod_today?: number
          levelup_reset_at?: string
          music_enabled?: boolean
          pending_free_packs?: number
          rank?: string
          recovery_key_hash?: string | null
          recovery_key_set_at?: string | null
          referral_code?: string
          referred_by?: string | null
          selected_battlefield_id?: string | null
          sfx_enabled?: boolean
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          commission_earned?: number
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          commission_earned?: number
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      store_credit: {
        Row: {
          credit_cents: number
          lifetime_earned_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credit_cents?: number
          lifetime_earned_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credit_cents?: number
          lifetime_earned_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_chat_log: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          initial_message: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          initial_message: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          initial_message?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suspicion_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          id: string
          placement: number | null
          registered_at: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          placement?: number | null
          registered_at?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          placement?: number | null
          registered_at?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          entry_fee_exod: number
          id: string
          max_players: number
          name: string
          prize_pool_exod: number
          registered_count: number
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_fee_exod: number
          id?: string
          max_players: number
          name: string
          prize_pool_exod?: number
          registered_count?: number
          starts_at: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_fee_exod?: number
          id?: string
          max_players?: number
          name?: string
          prize_pool_exod?: number
          registered_count?: number
          starts_at?: string
          status?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          meta: Json
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          meta?: Json
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          meta?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          acquired_at: string
          card_id: string
          card_name: string
          card_rarity: string
          id: string
          quantity: number
          source: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          card_id: string
          card_name: string
          card_rarity: string
          id?: string
          quantity?: number
          source?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          card_id?: string
          card_name?: string
          card_rarity?: string
          id?: string
          quantity?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_chests: {
        Row: {
          lifetime_opened: number
          unopened: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lifetime_opened?: number
          unopened?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lifetime_opened?: number
          unopened?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          granted: boolean
          id: string
          permission_key: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          granted: boolean
          id?: string
          permission_key: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          granted?: boolean
          id?: string
          permission_key?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      user_reports: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          reported_user_id: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          reported_user_id: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          reported_user_id?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          sub_role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          sub_role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          sub_role?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          ankh_balance: number
          ankh_lifetime_earned: number
          daily_coins_claimed_at: string | null
          daily_earned: number
          daily_exod_claimed_at: string | null
          daily_reset_at: string
          exod_balance: number
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ankh_balance?: number
          ankh_lifetime_earned?: number
          daily_coins_claimed_at?: string | null
          daily_earned?: number
          daily_exod_claimed_at?: string | null
          daily_reset_at?: string
          exod_balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ankh_balance?: number
          ankh_lifetime_earned?: number
          daily_coins_claimed_at?: string | null
          daily_earned?: number
          daily_exod_claimed_at?: string | null
          daily_reset_at?: string
          exod_balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          duels_played: number | null
          duels_won: number | null
          id: string | null
          level: number | null
          rank: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          duels_played?: number | null
          duels_won?: number | null
          id?: string | null
          level?: number | null
          rank?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          duels_played?: number | null
          duels_won?: number | null
          id?: string | null
          level?: number | null
          rank?: string | null
          username?: string | null
        }
        Relationships: []
      }
      v_user_suspicion: {
        Row: {
          by_type: Json | null
          event_count: number | null
          last_event_at: string | null
          score: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _board_advance_turn: { Args: { _match_id: string }; Returns: undefined }
      _board_finalize: { Args: { _match_id: string }; Returns: undefined }
      accept_arena_match: {
        Args: { _card_id?: string; _match_id: string }
        Returns: undefined
      }
      accept_consent: { Args: { _version: number }; Returns: undefined }
      activate_premium_pass: { Args: { _payment_ref: string }; Returns: Json }
      admin_resolve_arena_dispute: {
        Args: { _match_id: string; _note?: string; _winner_id: string }
        Returns: Json
      }
      award_battle_xp: { Args: { _won: boolean }; Returns: Json }
      backfill_heir_collection: { Args: never; Returns: Json }
      board_auto_skip_expired: { Args: never; Returns: number }
      board_cast_vote: {
        Args: { _agree: boolean; _vote_id: string }
        Returns: Json
      }
      board_claim: { Args: { _buy: boolean; _match_id: string }; Returns: Json }
      board_create_match: {
        Args: { _max_players: number; _mode: string; _name: string }
        Returns: string
      }
      board_join_match: { Args: { _match_id: string }; Returns: undefined }
      board_propose_vote: {
        Args: { _kind: string; _match_id: string; _target?: string }
        Returns: string
      }
      board_roll: {
        Args: {
          _card_id?: string
          _card_name?: string
          _card_rarity?: string
          _match_id: string
        }
        Returns: Json
      }
      board_select_card: {
        Args: {
          _card_id: string
          _card_name: string
          _card_rarity: string
          _match_id: string
        }
        Returns: undefined
      }
      board_set_mode: {
        Args: { _match_id: string; _mode: string }
        Returns: undefined
      }
      board_skip: { Args: { _match_id: string }; Returns: undefined }
      board_start_match: { Args: { _match_id: string }; Returns: undefined }
      board_tile: { Args: { _pos: number }; Returns: Json }
      board_upgrade: { Args: { _match_id: string }; Returns: Json }
      buy_chests: { Args: { _quantity: number }; Returns: Json }
      cancel_arena_match: { Args: { _match_id: string }; Returns: undefined }
      cancel_listing: { Args: { _listing_id: string }; Returns: undefined }
      claim_daily_coins: { Args: never; Returns: Json }
      claim_daily_exod: { Args: never; Returns: Json }
      claim_free_pack: { Args: { _drop_id: string }; Returns: Json }
      create_arena_match: {
        Args: { _card_id?: string; _mode: string; _stake_ankh?: number }
        Returns: string
      }
      credit_ankh: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      device_pair_lookup: { Args: { _token: string }; Returns: Json }
      device_pair_mark_approved: {
        Args: { _email: string; _token: string; _token_hash: string }
        Returns: undefined
      }
      device_pair_poll: { Args: { _token: string }; Returns: Json }
      device_pair_request: { Args: { _user_agent: string }; Returns: string }
      earn_exod: {
        Args: { _amount: number; _description: string; _type: string }
        Returns: number
      }
      exchange_cards_for_credit: { Args: { _items: Json }; Returns: Json }
      finalize_heir_setup: { Args: { _user_id: string }; Returns: undefined }
      forge_cards: {
        Args: { _card_id: string }
        Returns: {
          forged_id: string
          forged_name: string
          forged_rarity: string
        }[]
      }
      get_public_profile: { Args: { _username: string }; Returns: Json }
      grant_free_pack_credit: {
        Args: { _packs?: number; _user_id: string }
        Returns: undefined
      }
      has_permission: { Args: { _key: string; _uid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      heir_user_id: { Args: never; Returns: string }
      is_board_player: {
        Args: { _match: string; _uid: string }
        Returns: boolean
      }
      is_card_staked: {
        Args: { _card_id: string; _user: string }
        Returns: boolean
      }
      is_conv_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      is_heir: { Args: { _uid: string }; Returns: boolean }
      is_owner: { Args: { _uid: string }; Returns: boolean }
      is_owner_or_heir: { Args: { _uid: string }; Returns: boolean }
      list_card_for_ankh: {
        Args: { _card_id: string; _price_ankh: number }
        Returns: string
      }
      log_mod_action: {
        Args: {
          _action: string
          _duration?: number
          _evidence?: Json
          _reason: string
          _resolution_note?: string
          _target: string
        }
        Returns: string
      }
      moderate_delete_message: {
        Args: { _message_id: string; _reason: string }
        Returns: undefined
      }
      open_chest: { Args: never; Returns: Json }
      owner_user_id: { Args: never; Returns: string }
      purchase_listing: { Args: { _listing_id: string }; Returns: undefined }
      purchase_listing_ankh: {
        Args: { _listing_id: string }
        Returns: undefined
      }
      record_suspicion: {
        Args: { _event_type: string; _meta?: Json; _weight: number }
        Returns: undefined
      }
      register_tournament: {
        Args: { _tournament_id: string }
        Returns: undefined
      }
      report_arena_result: {
        Args: { _match_id: string; _winner_id: string }
        Returns: Json
      }
      resolve_user_report: {
        Args: { _outcome: string; _report_id: string; _resolution_note: string }
        Returns: undefined
      }
      send_message: {
        Args: { _body: string; _conversation_id: string; _recipient_id: string }
        Returns: Json
      }
      set_recovery_key: { Args: { _hash: string }; Returns: undefined }
      set_username: { Args: { _username: string }; Returns: undefined }
      unlock_achievement: {
        Args: { _ach: string; _user: string }
        Returns: boolean
      }
      void_user_battle: {
        Args: { _exod: number; _reason: string; _user_id: string; _xp: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "heir"
      post_category: "news" | "blog" | "event"
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
      app_role: ["admin", "user", "heir"],
      post_category: ["news", "blog", "event"],
    },
  },
} as const
