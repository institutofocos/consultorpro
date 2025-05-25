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
          status: string
          updated_at: string
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
          status?: string
          updated_at?: string
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
          status?: string
          updated_at?: string
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
          created_at: string
          description: string
          due_date: string
          id: string
          payment_date: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          project_id?: string | null
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
      chat_messages: {
        Row: {
          content: string
          id: string
          message_source: string | null
          room_id: string
          sender_id: string
          sender_name: string
          timestamp: string | null
          whatsapp_message_id: string | null
          whatsapp_metadata: Json | null
        }
        Insert: {
          content: string
          id?: string
          message_source?: string | null
          room_id: string
          sender_id: string
          sender_name: string
          timestamp?: string | null
          whatsapp_message_id?: string | null
          whatsapp_metadata?: Json | null
        }
        Update: {
          content?: string
          id?: string
          message_source?: string | null
          room_id?: string
          sender_id?: string
          sender_name?: string
          timestamp?: string | null
          whatsapp_message_id?: string | null
          whatsapp_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_participants: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          name: string
          parent_id: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          parent_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          parent_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          zip_code?: string | null
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
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
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
          client_id: string | null
          consultant_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          is_recurring: boolean
          payment_date: string | null
          project_id: string | null
          recurrence_interval: string | null
          status: string
          tag_id: string | null
          type: string
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
          is_recurring?: boolean
          payment_date?: string | null
          project_id?: string | null
          recurrence_interval?: string | null
          status?: string
          tag_id?: string | null
          type: string
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
          is_recurring?: boolean
          payment_date?: string | null
          project_id?: string | null
          recurrence_interval?: string | null
          status?: string
          tag_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      module_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          id: string
          module_name: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module_name: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module_name?: string
          user_id?: string
        }
        Relationships: []
      }
      note_checklists: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          note_id: string
          responsible_consultant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          note_id: string
          responsible_consultant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          note_id?: string
          responsible_consultant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_checklists_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_checklists_responsible_consultant_id_fkey"
            columns: ["responsible_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      note_consultants: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          note_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          note_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_consultants_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_custom_fields: {
        Row: {
          created_at: string | null
          field_name: string
          field_value: string | null
          id: string
          note_id: string
        }
        Insert: {
          created_at?: string | null
          field_name: string
          field_value?: string | null
          id?: string
          note_id: string
        }
        Update: {
          created_at?: string | null
          field_name?: string
          field_value?: string | null
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_custom_fields_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tag_relations: {
        Row: {
          created_at: string
          id: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tag_relations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          note_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          note_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          chat_room_id: string | null
          client_id: string | null
          color: string | null
          consultant_id: string | null
          content: string | null
          created_at: string | null
          due_date: string | null
          end_date: string | null
          has_internal_chat: boolean | null
          id: string
          linked_task_id: string | null
          service_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chat_room_id?: string | null
          client_id?: string | null
          color?: string | null
          consultant_id?: string | null
          content?: string | null
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          has_internal_chat?: boolean | null
          id?: string
          linked_task_id?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chat_room_id?: string | null
          client_id?: string | null
          color?: string | null
          consultant_id?: string | null
          content?: string | null
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          has_internal_chat?: boolean | null
          id?: string
          linked_task_id?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          attachment: string | null
          client_approved: boolean | null
          completed: boolean | null
          consultant_id: string | null
          consultants_settled: boolean | null
          created_at: string | null
          days: number
          description: string | null
          end_date: string | null
          hours: number
          id: string
          invoice_issued: boolean | null
          manager_approved: boolean | null
          name: string
          payment_received: boolean | null
          project_id: string
          stage_order: number
          start_date: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          attachment?: string | null
          client_approved?: boolean | null
          completed?: boolean | null
          consultant_id?: string | null
          consultants_settled?: boolean | null
          created_at?: string | null
          days?: number
          description?: string | null
          end_date?: string | null
          hours?: number
          id?: string
          invoice_issued?: boolean | null
          manager_approved?: boolean | null
          name: string
          payment_received?: boolean | null
          project_id: string
          stage_order?: number
          start_date?: string | null
          updated_at?: string | null
          value?: number
        }
        Update: {
          attachment?: string | null
          client_approved?: boolean | null
          completed?: boolean | null
          consultant_id?: string | null
          consultants_settled?: boolean | null
          created_at?: string | null
          days?: number
          description?: string | null
          end_date?: string | null
          hours?: number
          id?: string
          invoice_issued?: boolean | null
          manager_approved?: boolean | null
          name?: string
          payment_received?: boolean | null
          project_id?: string
          stage_order?: number
          start_date?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
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
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_main_consultant_id_fkey"
            columns: ["main_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_support_consultant_id_fkey"
            columns: ["support_consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          connection_id: string | null
          created_at: string | null
          id: string
          is_recurring: boolean | null
          last_sent_at: string | null
          message: string
          next_send_at: string | null
          recurrence_day: number | null
          recurrence_time: string | null
          recurrence_type: string | null
          room_id: string
          send_date: string | null
          send_time: string | null
          sender_id: string
          sender_name: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          message: string
          next_send_at?: string | null
          recurrence_day?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          room_id: string
          send_date?: string | null
          send_time?: string | null
          sender_id: string
          sender_name: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          message?: string
          next_send_at?: string | null
          recurrence_day?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          room_id?: string
          send_date?: string | null
          send_time?: string | null
          sender_id?: string
          sender_name?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
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
            referencedRelation: "tags"
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
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          category: string
          created_at: string
          details: Json | null
          id: string
          log_type: string
          message: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
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
      user_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          last_login: string | null
          password_hash: string | null
          profile_photo_url: string | null
          role: string
          updated_at: string
          user_type: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          last_login?: string | null
          password_hash?: string | null
          profile_photo_url?: string | null
          role: string
          updated_at?: string
          user_type?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          last_login?: string | null
          password_hash?: string | null
          profile_photo_url?: string | null
          role?: string
          updated_at?: string
          user_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_count: number
          created_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean
          table_name: string
          webhook_id: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          table_name: string
          webhook_id?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          table_name?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
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
      whatsapp_chat_mappings: {
        Row: {
          auto_sync: boolean | null
          chat_room_id: string
          connection_id: string
          created_at: string | null
          id: string
          whatsapp_contact_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          chat_room_id: string
          connection_id: string
          created_at?: string | null
          id?: string
          whatsapp_contact_id: string
        }
        Update: {
          auto_sync?: boolean | null
          chat_room_id?: string
          connection_id?: string
          created_at?: string | null
          id?: string
          whatsapp_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_mappings_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_chat_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_chat_mappings_whatsapp_contact_id_fkey"
            columns: ["whatsapp_contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          connection_data: Json | null
          created_at: string | null
          evolution_api_key: string
          evolution_api_url: string
          export_from_date: string | null
          id: string
          instance_name: string
          last_sync_at: string | null
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          connection_data?: Json | null
          created_at?: string | null
          evolution_api_key: string
          evolution_api_url: string
          export_from_date?: string | null
          id?: string
          instance_name: string
          last_sync_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          connection_data?: Json | null
          created_at?: string | null
          evolution_api_key?: string
          evolution_api_url?: string
          export_from_date?: string | null
          id?: string
          instance_name?: string
          last_sync_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          connection_id: string
          created_at: string | null
          group_participants: Json | null
          id: string
          is_group: boolean | null
          name: string
          phone_number: string | null
          profile_picture_url: string | null
          updated_at: string | null
          whatsapp_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          group_participants?: Json | null
          id?: string
          is_group?: boolean | null
          name: string
          phone_number?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          whatsapp_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          group_participants?: Json | null
          id?: string
          is_group?: boolean | null
          name?: string
          phone_number?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          whatsapp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      generate_project_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      insert_system_log: {
        Args: {
          p_log_type?: string
          p_category?: string
          p_message?: string
          p_details?: Json
          p_user_id?: string
        }
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
