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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts_payable: {
        Row: {
          amount: number
          consultant_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          payment_date: string | null
          project_id: string | null
          project_name: string | null
          stage_id: string | null
          stage_name: string | null
          stage_status: string | null
          status: string
          updated_at: string
          valor_de_repasse: number | null
        }
        Insert: {
          amount: number
          consultant_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
          project_name?: string | null
          stage_id?: string | null
          stage_name?: string | null
          stage_status?: string | null
          status?: string
          updated_at?: string
          valor_de_repasse?: number | null
        }
        Update: {
          amount?: number
          consultant_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
          project_name?: string | null
          stage_id?: string | null
          stage_name?: string | null
          stage_status?: string | null
          status?: string
          updated_at?: string
          valor_de_repasse?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          client_id: string | null
          consultant_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          payment_date: string | null
          project_id: string | null
          project_name: string | null
          stage_id: string | null
          stage_name: string | null
          stage_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
          project_name?: string | null
          stage_id?: string | null
          stage_name?: string | null
          stage_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
          project_name?: string | null
          stage_id?: string | null
          stage_name?: string | null
          stage_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_value: string
          last_used_at: string | null
          name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_value: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_value?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      consultant_documents: {
        Row: {
          consultant_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_documents_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_services: {
        Row: {
          consultant_id: string
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_services_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          city: string | null
          commission_percentage: number | null
          created_at: string | null
          education: string | null
          email: string
          hours_per_month: number | null
          id: string
          name: string
          phone: string | null
          pix_key: string | null
          salary: number | null
          state: string | null
          street: string | null
          updated_at: string | null
          url: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          education?: string | null
          email: string
          hours_per_month?: number | null
          id?: string
          name: string
          phone?: string | null
          pix_key?: string | null
          salary?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          url?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          education?: string | null
          email?: string
          hours_per_month?: number | null
          id?: string
          name?: string
          phone?: string | null
          pix_key?: string | null
          salary?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      deleted_users: {
        Row: {
          created_at: string
          deleted_at: string
          deleted_by: string | null
          id: string
          reason: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          reason?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          reason?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_views: {
        Row: {
          demand_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          demand_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          demand_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_views_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          client_id: string | null
          consultant_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      disabled_users: {
        Row: {
          created_at: string
          disabled_at: string
          disabled_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string
          disabled_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          disabled_at?: string
          disabled_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          consultant_id: string | null
          created_at: string | null
          due_date: string
          id: string
          is_support_consultant: boolean | null
          net_amount: number
          payment_date: string | null
          project_id: string | null
          stage_id: string | null
          stage_name: string
          status: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          consultant_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          is_support_consultant?: boolean | null
          net_amount?: number
          payment_date?: string | null
          project_id?: string | null
          stage_id?: string | null
          stage_name: string
          status?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          consultant_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          is_support_consultant?: boolean | null
          net_amount?: number
          payment_date?: string | null
          project_id?: string | null
          stage_id?: string | null
          stage_name?: string
          status?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_tasks: {
        Row: {
          assigned_consultant_id: string | null
          created_at: string
          depends_on_task_id: string | null
          duration_days: number
          end_date: string
          id: string
          priority: string | null
          progress_percentage: number | null
          project_id: string
          start_date: string
          status: string | null
          task_description: string | null
          task_name: string
          updated_at: string
        }
        Insert: {
          assigned_consultant_id?: string | null
          created_at?: string
          depends_on_task_id?: string | null
          duration_days?: number
          end_date: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          project_id: string
          start_date: string
          status?: string | null
          task_description?: string | null
          task_name: string
          updated_at?: string
        }
        Update: {
          assigned_consultant_id?: string | null
          created_at?: string
          depends_on_task_id?: string | null
          duration_days?: number
          end_date?: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string
          start_date?: string
          status?: string | null
          task_description?: string | null
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_tasks_assigned_consultant_id_fkey"
            columns: ["assigned_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          category: string
          created_at: string
          current: number | null
          data_source: string
          description: string | null
          end_date: string
          formula: string | null
          id: string
          name: string
          period: string
          responsible: string | null
          start_date: string
          status: string
          target: number
          type: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current?: number | null
          data_source: string
          description?: string | null
          end_date: string
          formula?: string | null
          id?: string
          name: string
          period: string
          responsible?: string | null
          start_date: string
          status?: string
          target: number
          type: string
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current?: number | null
          data_source?: string
          description?: string | null
          end_date?: string
          formula?: string | null
          id?: string
          name?: string
          period?: string
          responsible?: string | null
          start_date?: string
          status?: string
          target?: number
          type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          current: number | null
          description: string | null
          id: string
          indicator_id: string
          name: string
          status: string
          target: number
          unit: string
        }
        Insert: {
          current?: number | null
          description?: string | null
          id?: string
          indicator_id: string
          name: string
          status?: string
          target: number
          unit: string
        }
        Update: {
          current?: number | null
          description?: string | null
          id?: string
          indicator_id?: string
          name?: string
          status?: string
          target?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_transactions: {
        Row: {
          amount: number
          category_id: string | null
          client_id: string | null
          consultant_id: string | null
          created_at: string
          current_installment: number | null
          description: string
          due_date: string
          id: string
          installments: number | null
          is_fixed_expense: boolean | null
          is_recurring: boolean
          payment_date: string | null
          payment_method_id: string | null
          project_id: string | null
          receipt_url: string | null
          recurrence_interval: string | null
          status: string
          subcategory_id: string | null
          tag_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          current_installment?: number | null
          description: string
          due_date: string
          id?: string
          installments?: number | null
          is_fixed_expense?: boolean | null
          is_recurring?: boolean
          payment_date?: string | null
          payment_method_id?: string | null
          project_id?: string | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          status?: string
          subcategory_id?: string | null
          tag_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string
          current_installment?: number | null
          description?: string
          due_date?: string
          id?: string
          installments?: number | null
          is_fixed_expense?: boolean | null
          is_recurring?: boolean
          payment_date?: string | null
          payment_method_id?: string | null
          project_id?: string | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          status?: string
          subcategory_id?: string | null
          tag_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_transactions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "transaction_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_module_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module_name: Database["public"]["Enums"]["module_type"]
          profile_id: string
          restrict_to_linked: boolean
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name: Database["public"]["Enums"]["module_type"]
          profile_id: string
          restrict_to_linked?: boolean
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name?: Database["public"]["Enums"]["module_type"]
          profile_id?: string
          restrict_to_linked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profile_module_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_group_relations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_group_relations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "project_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_group_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_history: {
        Row: {
          action_type: string
          created_at: string
          description: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          stage_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          stage_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          stage_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_history_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          attachment: string | null
          client_approved: boolean | null
          completed: boolean | null
          completed_at: string | null
          consultant_id: string | null
          consultants_settled: boolean | null
          created_at: string | null
          days: number
          description: string | null
          end_date: string | null
          end_time: string | null
          hours: number
          id: string
          invoice_issued: boolean | null
          last_pause_duration: number | null
          manager_approved: boolean | null
          name: string
          payment_received: boolean | null
          project_id: string
          stage_order: number
          start_date: string | null
          start_time: string | null
          status: string | null
          time_spent_minutes: number | null
          timer_started_at: string | null
          timer_status: string | null
          updated_at: string | null
          valor_de_repasse: number | null
          value: number
        }
        Insert: {
          attachment?: string | null
          client_approved?: boolean | null
          completed?: boolean | null
          completed_at?: string | null
          consultant_id?: string | null
          consultants_settled?: boolean | null
          created_at?: string | null
          days?: number
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          hours?: number
          id?: string
          invoice_issued?: boolean | null
          last_pause_duration?: number | null
          manager_approved?: boolean | null
          name: string
          payment_received?: boolean | null
          project_id: string
          stage_order?: number
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          timer_started_at?: string | null
          timer_status?: string | null
          updated_at?: string | null
          valor_de_repasse?: number | null
          value?: number
        }
        Update: {
          attachment?: string | null
          client_approved?: boolean | null
          completed?: boolean | null
          completed_at?: string | null
          consultant_id?: string | null
          consultants_settled?: boolean | null
          created_at?: string | null
          days?: number
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          hours?: number
          id?: string
          invoice_issued?: boolean | null
          last_pause_duration?: number | null
          manager_approved?: boolean | null
          name?: string
          payment_received?: boolean | null
          project_id?: string
          stage_order?: number
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          timer_started_at?: string | null
          timer_status?: string | null
          updated_at?: string | null
          valor_de_repasse?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_stages_consultant_id"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_stages_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_status_settings: {
        Row: {
          color: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_cancellation_status: boolean
          is_completion_status: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_cancellation_status?: boolean
          is_completion_status?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_cancellation_status?: boolean
          is_completion_status?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_tag_relations: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tag_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          assigned_consultant_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          project_id: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_consultant_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_id: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_consultant_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_consultant_id_fkey"
            columns: ["assigned_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_date: string
          hourly_rate: number | null
          id: string
          main_consultant_commission: number | null
          main_consultant_id: string | null
          main_consultant_value: number | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          name: string
          parent_project_id: string | null
          project_id: string | null
          service_id: string | null
          start_date: string
          status: string
          support_consultant_commission: number | null
          support_consultant_id: string | null
          support_consultant_value: number | null
          tags: string[] | null
          tax_percent: number
          third_party_expenses: number | null
          total_hours: number | null
          total_value: number
          updated_at: string | null
          url: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          hourly_rate?: number | null
          id?: string
          main_consultant_commission?: number | null
          main_consultant_id?: string | null
          main_consultant_value?: number | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          parent_project_id?: string | null
          project_id?: string | null
          service_id?: string | null
          start_date: string
          status?: string
          support_consultant_commission?: number | null
          support_consultant_id?: string | null
          support_consultant_value?: number | null
          tags?: string[] | null
          tax_percent?: number
          third_party_expenses?: number | null
          total_hours?: number | null
          total_value?: number
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          hourly_rate?: number | null
          id?: string
          main_consultant_commission?: number | null
          main_consultant_id?: string | null
          main_consultant_value?: number | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          parent_project_id?: string | null
          project_id?: string | null
          service_id?: string | null
          start_date?: string
          status?: string
          support_consultant_commission?: number | null
          support_consultant_id?: string | null
          support_consultant_value?: number | null
          tags?: string[] | null
          tax_percent?: number
          third_party_expenses?: number | null
          total_hours?: number | null
          total_value?: number
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_main_consultant_id"
            columns: ["main_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_support_consultant_id"
            columns: ["support_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tags: {
        Row: {
          created_at: string
          id: string
          service_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          extra_costs: number | null
          hourly_rate: number | null
          id: string
          name: string
          net_value: number | null
          stages: Json | null
          tax_rate: number
          total_hours: number
          total_value: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extra_costs?: number | null
          hourly_rate?: number | null
          id?: string
          name: string
          net_value?: number | null
          stages?: Json | null
          tax_rate?: number
          total_hours: number
          total_value?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extra_costs?: number | null
          hourly_rate?: number | null
          id?: string
          name?: string
          net_value?: number | null
          stages?: Json | null
          tax_rate?: number
          total_hours?: number
          total_value?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      stage_tag_relations: {
        Row: {
          created_at: string | null
          id: string
          stage_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stage_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stage_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      stage_work_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          stage_id: string
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          stage_id: string
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          stage_id?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_work_sessions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          category: string
          created_at: string
          details: Json | null
          id: string
          log_type: string
          message: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type: string
          message: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_client_links: {
        Row: {
          client_id: string
          created_at: string
          id: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_client_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consultant_links: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consultant_links_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: true
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consultant_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempt_count: number | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean
          table_name: string
          updated_at: string
          webhook_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          table_name: string
          updated_at?: string
          webhook_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          table_name?: string
          updated_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_webhook_logs_webhook_id"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret_key: string | null
          tables: string[]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret_key?: string | null
          tables?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret_key?: string | null
          tables?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_to_room_and_subrooms: {
        Args: {
          p_room_id: string
          p_user_id: string
          p_added_by: string
          p_can_read?: boolean
          p_can_write?: boolean
        }
        Returns: undefined
      }
      assign_user_profile: {
        Args: { p_user_id: string; p_profile_id: string }
        Returns: undefined
      }
      calculate_consultant_active_projects: {
        Args: { consultant_id: string }
        Returns: number
      }
      calculate_consultant_available_hours: {
        Args: { consultant_id: string; hours_per_month?: number }
        Returns: number
      }
      calculate_consultant_monthly_hours: {
        Args: { consultant_id: string; target_month?: string }
        Returns: number
      }
      calculate_consultant_worked_hours: {
        Args: { consultant_id: string; target_month?: string }
        Returns: number
      }
      calculate_financial_summary: {
        Args: {
          start_date?: string
          end_date?: string
          consultant_filter?: string
          service_filter?: string
        }
        Returns: {
          total_expected: number
          total_received: number
          total_pending: number
          consultant_payments_made: number
          consultant_payments_pending: number
        }[]
      }
      calculate_stage_dates: {
        Args: { project_start_date: string; stages: Json }
        Returns: Json
      }
      calculate_stage_total_time: {
        Args: { p_stage_id: string }
        Returns: number
      }
      cleanup_expired_reset_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_project_stage: {
        Args: { stage_id: string }
        Returns: boolean
      }
      delete_user_completely: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      disable_user: {
        Args: { p_user_id: string; p_reason?: string }
        Returns: undefined
      }
      enable_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      execute_sql: {
        Args: { query: string }
        Returns: undefined
      }
      format_date_br: {
        Args: { input_date: string }
        Returns: string
      }
      format_date_only_br: {
        Args: { input_date: string }
        Returns: string
      }
      format_date_time_br: {
        Args: { input_date: string; input_time: string }
        Returns: string
      }
      format_datetime_br: {
        Args: { input_datetime: string }
        Returns: Json
      }
      format_time_only_br: {
        Args: { input_time: string }
        Returns: string
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_project_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_access_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          is_system_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
          permissions: Json
        }[]
      }
      get_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          last_sign_in_at: string
          email_confirmed_at: string
          disabled: boolean
        }[]
      }
      get_available_chat_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          name: string
          email: string
          type: string
        }[]
      }
      get_project_consolidated_data: {
        Args: { p_project_id: string }
        Returns: Json
      }
      get_project_status_change_data: {
        Args: {
          p_project_id: string
          p_old_status: string
          p_new_status: string
        }
        Returns: Json
      }
      get_room_participants: {
        Args: { p_room_id: string }
        Returns: {
          user_id: string
          name: string
          email: string
          type: string
          can_read: boolean
          can_write: boolean
          added_at: string
        }[]
      }
      get_stage_status_change_data: {
        Args: { p_stage_id: string; p_old_status: string; p_new_status: string }
        Returns: Json
      }
      get_user_links: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          consultant_id: string
          consultant_name: string
          client_id: string
          client_name: string
        }[]
      }
      get_user_profile: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          profile_id: string
          profile_name: string
          profile_description: string
        }[]
      }
      get_viewed_demands: {
        Args: { p_user_id: string }
        Returns: {
          demand_id: string
          viewed_at: string
        }[]
      }
      insert_project_history: {
        Args: {
          p_project_id: string
          p_action_type: string
          p_description: string
          p_stage_id?: string
          p_field_changed?: string
          p_old_value?: string
          p_new_value?: string
          p_user_name?: string
        }
        Returns: string
      }
      is_project_fully_completed: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      is_user_disabled: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      log_api_key_usage: {
        Args: { api_key: string }
        Returns: undefined
      }
      mark_all_demands_as_viewed: {
        Args: { p_user_id: string; p_demand_ids: string[] }
        Returns: undefined
      }
      mark_demand_as_viewed: {
        Args: { p_demand_id: string; p_user_id: string }
        Returns: undefined
      }
      populate_gantt_from_project: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      process_webhook_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_webhook_queue_comprehensive: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_user_from_specific_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: undefined
      }
      restore_deleted_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sync_super_admin_permissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_room_participants: {
        Args: { p_room_id: string; p_participants: Json }
        Returns: undefined
      }
      user_can_access_module: {
        Args: { module_name: string; permission_type?: string }
        Returns: boolean
      }
      user_can_view_chat_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      user_has_client_access: {
        Args: { target_client_id: string }
        Returns: boolean
      }
      user_has_consultant_access: {
        Args: { target_consultant_id: string }
        Returns: boolean
      }
      user_has_profile: {
        Args: { profile_name: string }
        Returns: boolean
      }
      user_has_project_access: {
        Args: { project_id: string }
        Returns: boolean
      }
      user_is_restricted_to_linked: {
        Args: { module_name: string }
        Returns: boolean
      }
      user_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_api_key: {
        Args: { api_key: string }
        Returns: boolean
      }
    }
    Enums: {
      module_type:
        | "dashboard"
        | "consultants"
        | "clients"
        | "projects"
        | "demands"
        | "services"
        | "calendar"
        | "financial"
        | "settings"
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
      module_type: [
        "dashboard",
        "consultants",
        "clients",
        "projects",
        "demands",
        "services",
        "calendar",
        "financial",
        "settings",
      ],
    },
  },
} as const
