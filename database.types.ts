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
            ai_image_credits: {
                Row: {
                    created_at: string
                    id: number
                    image_generation_count: number | null
                    max_image_generation_count: number | null
                    max_model_training_count: number | null
                    model_training_count: number | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    id?: never
                    image_generation_count?: number | null
                    max_image_generation_count?: number | null
                    max_model_training_count?: number | null
                    model_training_count?: number | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    id?: never
                    image_generation_count?: number | null
                    max_image_generation_count?: number | null
                    max_model_training_count?: number | null
                    model_training_count?: number | null
                    user_id?: string | null
                }
                Relationships: []
            }
            ai_image_redeem_attempts: {
                Row: {
                    created_at: string
                    id: number
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: never
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: never
                    user_id?: string
                }
                Relationships: []
            }
            ai_image_redeem_codes: {
                Row: {
                    code: string
                    created_at: string
                    expire_at: string | null
                    id: string
                    points: number
                    status: string
                    used_at: string | null
                    used_by: string | null
                }
                Insert: {
                    code: string
                    created_at?: string
                    expire_at?: string | null
                    id?: string
                    points: number
                    status?: string
                    used_at?: string | null
                    used_by?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string
                    expire_at?: string | null
                    id?: string
                    points?: number
                    status?: string
                    used_at?: string | null
                    used_by?: string | null
                }
                Relationships: []
            }
            ai_image_redeem_purchase_links: {
                Row: {
                    created_at: string
                    id: string
                    is_active: boolean
                    label: string
                    sort_order: number
                    url: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label: string
                    sort_order?: number
                    url: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label?: string
                    sort_order?: number
                    url?: string
                }
                Relationships: []
            }
            ai_image_customers: {
                Row: {
                    id: string
                    stripe_customer_id: string | null
                }
                Insert: {
                    id: string
                    stripe_customer_id?: string | null
                }
                Update: {
                    id?: string
                    stripe_customer_id?: string | null
                }
                Relationships: []
            }
            ai_image_generated_images: {
                Row: {
                    aspect_ratio: string | null
                    created_at: string
                    guidance: number | null
                    height: number | null
                    id: number
                    image_name: string | null
                    model: string | null
                    num_inference_steps: number | null
                    output_format: string | null
                    prompt: string | null
                    user_id: string | null
                    width: number | null
                }
                Insert: {
                    aspect_ratio?: string | null
                    created_at?: string
                    guidance?: number | null
                    height?: number | null
                    id?: never
                    image_name?: string | null
                    model?: string | null
                    num_inference_steps?: number | null
                    output_format?: string | null
                    prompt?: string | null
                    user_id?: string | null
                    width?: number | null
                }
                Update: {
                    aspect_ratio?: string | null
                    created_at?: string
                    guidance?: number | null
                    height?: number | null
                    id?: never
                    image_name?: string | null
                    model?: string | null
                    num_inference_steps?: number | null
                    output_format?: string | null
                    prompt?: string | null
                    user_id?: string | null
                    width?: number | null
                }
                Relationships: []
            }
            ai_image_generation_jobs: {
                Row: {
                    created_at: string
                    external_task_id: string
                    id: string
                    last_polled_at: string | null
                    poll_count: number
                    request_payload: Json
                    result_url: string | null
                    status: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    external_task_id: string
                    id?: string
                    last_polled_at?: string | null
                    poll_count?: number
                    request_payload: Json
                    result_url?: string | null
                    status: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    external_task_id?: string
                    id?: string
                    last_polled_at?: string | null
                    poll_count?: number
                    request_payload?: Json
                    result_url?: string | null
                    status?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            ai_image_models: {
                Row: {
                    created_at: string
                    gender: Database["public"]["Enums"]["gender"] | null
                    id: number
                    model_id: string | null
                    model_name: string | null
                    training_id: string | null
                    training_status: Database["public"]["Enums"]["training_status"] | null
                    training_steps: number | null
                    training_time: string | null
                    trigger_word: string | null
                    user_id: string | null
                    version: string | null
                }
                Insert: {
                    created_at?: string
                    gender?: Database["public"]["Enums"]["gender"] | null
                    id?: never
                    model_id?: string | null
                    model_name?: string | null
                    training_id?: string | null
                    training_status?:
                    | Database["public"]["Enums"]["training_status"]
                    | null
                    training_steps?: number | null
                    training_time?: string | null
                    trigger_word?: string | null
                    user_id?: string | null
                    version?: string | null
                }
                Update: {
                    created_at?: string
                    gender?: Database["public"]["Enums"]["gender"] | null
                    id?: never
                    model_id?: string | null
                    model_name?: string | null
                    training_id?: string | null
                    training_status?:
                    | Database["public"]["Enums"]["training_status"]
                    | null
                    training_steps?: number | null
                    training_time?: string | null
                    trigger_word?: string | null
                    user_id?: string | null
                    version?: string | null
                }
                Relationships: []
            }
            ai_image_prices: {
                Row: {
                    active: boolean | null
                    currency: string | null
                    description: string | null
                    id: string
                    interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count: number | null
                    metadata: Json | null
                    product_id: string | null
                    trial_period_days: number | null
                    type: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount: number | null
                }
                Insert: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Update: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id?: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "prices_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "ai_image_products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ai_image_products: {
                Row: {
                    active: boolean | null
                    description: string | null
                    id: string
                    image: string | null
                    metadata: Json | null
                    name: string | null
                }
                Insert: {
                    active?: boolean | null
                    description?: string | null
                    id: string
                    image?: string | null
                    metadata?: Json | null
                    name?: string | null
                }
                Update: {
                    active?: boolean | null
                    description?: string | null
                    id?: string
                    image?: string | null
                    metadata?: Json | null
                    name?: string | null
                }
                Relationships: []
            }
            ai_image_subscriptions: {
                Row: {
                    cancel_at: string | null
                    cancel_at_period_end: boolean | null
                    canceled_at: string | null
                    created: string
                    current_period_end: string
                    current_period_start: string
                    ended_at: string | null
                    id: string
                    metadata: Json | null
                    price_id: string | null
                    quantity: number | null
                    status: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end: string | null
                    trial_start: string | null
                    user_id: string
                }
                Insert: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id: string
                }
                Update: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id?: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_price_id_fkey"
                        columns: ["price_id"]
                        isOneToOne: false
                        referencedRelation: "ai_image_prices"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ai_image_users: {
                Row: {
                    avatar_url: string | null
                    billing_address: Json | null
                    full_name: string | null
                    id: string
                    payment_method: Json | null
                }
                Insert: {
                    avatar_url?: string | null
                    billing_address?: Json | null
                    full_name?: string | null
                    id: string
                    payment_method?: Json | null
                }
                Update: {
                    avatar_url?: string | null
                    billing_address?: Json | null
                    full_name?: string | null
                    id?: string
                    payment_method?: Json | null
                }
                Relationships: []
            }
            ai_logo_users: {
                Row: {
                    created_at: string | null
                    credits: number | null
                    email: string
                    id: string
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    credits?: number | null
                    email: string
                    id?: string
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    credits?: number | null
                    email?: string
                    id?: string
                    name?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            ai_logos: {
                Row: {
                    created_at: string
                    desc: string | null
                    id: number
                    image: string | null
                    title: string | null
                    user_email: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    desc?: string | null
                    id?: number
                    image?: string | null
                    title?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    desc?: string | null
                    id?: number
                    image?: string | null
                    title?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            ai_image_generation_scenarios: {
                Row: {
                    active: boolean
                    created_at: string
                    description: string | null
                    id: string
                    params: Json
                    slug: string
                    sort_order: number
                    title: string
                }
                Insert: {
                    active?: boolean
                    created_at?: string
                    description?: string | null
                    id?: string
                    params?: Json
                    slug: string
                    sort_order?: number
                    title: string
                }
                Update: {
                    active?: boolean
                    created_at?: string
                    description?: string | null
                    id?: string
                    params?: Json
                    slug?: string
                    sort_order?: number
                    title?: string
                }
                Relationships: []
            }
            presets: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string
                    cover_image: string | null
                    prompt: string
                    negative_prompt: string
                    model: string
                    params: Json
                    is_public: boolean
                    likes: number
                    forks: number
                    primary_category: string
                    secondary_category: string
                    source_preset_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    title: string
                    cover_image?: string | null
                    prompt?: string
                    negative_prompt?: string
                    model?: string
                    params?: Json
                    is_public?: boolean
                    likes?: number
                    forks?: number
                    primary_category?: string
                    secondary_category?: string
                    source_preset_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    title?: string
                    cover_image?: string | null
                    prompt?: string
                    negative_prompt?: string
                    model?: string
                    params?: Json
                    is_public?: boolean
                    likes?: number
                    forks?: number
                    primary_category?: string
                    secondary_category?: string
                    source_preset_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            announcements: {
                Row: {
                    id: string
                    title: string
                    body: string
                    starts_at: string
                    ends_at: string
                    is_published: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    body: string
                    starts_at: string
                    ends_at: string
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    body?: string
                    starts_at?: string
                    ends_at?: string
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            announcement_reads: {
                Row: {
                    id: string
                    user_id: string
                    announcement_id: string
                    read_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    announcement_id: string
                    read_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    announcement_id?: string
                    read_at?: string
                }
                Relationships: []
            }
            feedback_submissions: {
                Row: {
                    id: string
                    user_id: string
                    body: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    body: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    body?: string
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            ai_image_start_generation_job: {
                Args: {
                    p_external_task_id: string
                    p_request_payload: Json
                    p_result_url?: string | null
                    p_user_id: string
                }
                Returns: string
            }
            redeem_ai_image_code: {
                Args: {
                    p_code: string
                }
                Returns: Json
            }
        }
        Enums: {
            gender: "man" | "women"
            pricing_plan_interval: "day" | "week" | "month" | "year"
            pricing_type: "one_time" | "recurring"
            subscription_status:
            | "trialing"
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "unpaid"
            training_status:
            | "starting"
            | "processing"
            | "succeeded"
            | "failed"
            | "canceled"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
