export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string;
          name: string;
          type: "relay" | "proxy" | "free-model" | "direct" | "hosting";
          description: string;
          description_en: string;
          url: string;
          doc_url: string | null;
          status: "online" | "offline" | "unstable" | "unknown";
          cert_level: "none" | "verified" | "premium";
          region: string[];
          tags: string[];
          tags_en: string[];
          payment_methods: string[];
          free_tier_available: boolean;
          free_tier_description: string | null;
          free_tier_description_en: string | null;
          avg_latency: number;
          uptime_30d: number;
          review_count: number;
          monthly_active_users: number | null;
          rating_overall: number;
          rating_stability: number;
          rating_speed: number;
          rating_service: number;
          rating_value: number;
          rating_count: number;
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["channels"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["channels"]["Insert"]>;
      };
      models: {
        Row: {
          id: string;
          channel_id: string;
          name: string;
          category: "chat" | "code" | "vision" | "embedding" | "image" | "audio" | "reasoning";
          input_price_per_1m: number | null;
          output_price_per_1m: number | null;
          is_free: boolean;
          free_quota: string | null;
          context_window: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["models"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["models"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          username: string;
          avatar: string | null;
          rating_stability: number;
          rating_speed: number;
          rating_service: number;
          rating_value: number;
          content: string;
          helpful: number;
          verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "created_at" | "helpful" | "verified">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      channel_type: "relay" | "proxy" | "free-model" | "direct" | "hosting";
      channel_status: "online" | "offline" | "unstable" | "unknown";
      cert_level: "none" | "verified" | "premium";
      model_category: "chat" | "code" | "vision" | "embedding" | "image" | "audio" | "reasoning";
      user_role: "user" | "admin";
    };
  };
}
