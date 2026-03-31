export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApplicationStatus = 'draft' | 'ready' | 'paid' | 'submitted' | 'approved'
export type DocType = 'passport' | 'renunciation' | 'address_proof' | 'photo' | 'signature'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          user_id: string
          service_type: string
          status: string
          form_data: Json | null
          validation_errors: Json | null
          stripe_payment_id: string | null
          vfs_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_type?: string
          status?: string
          form_data?: Json | null
          validation_errors?: Json | null
          stripe_payment_id?: string | null
          vfs_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_type?: string
          status?: string
          form_data?: Json | null
          validation_errors?: Json | null
          stripe_payment_id?: string | null
          vfs_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          application_id: string
          user_id: string
          doc_type: string
          storage_path: string
          extracted_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          user_id: string
          doc_type: string
          storage_path: string
          extracted_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          user_id?: string
          doc_type?: string
          storage_path?: string
          extracted_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface ExtractedPassportData {
  first_name: string
  last_name: string
  full_name: string
  passport_number: string
  nationality: string
  date_of_birth: string
  place_of_birth: string
  issue_date: string
  expiry_date: string
  issuing_country: string
  gender: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'blocker' | 'warning'
}

export interface ValidationResult {
  errors: ValidationError[]
  warnings: { field: string; message: string }[]
}
