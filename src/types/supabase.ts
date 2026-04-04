export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Plan = 'locker' | 'apply' | 'family'
export type DocType = 'us_passport' | 'indian_passport' | 'oci_card' | 'renunciation' | 'pan_card' | 'address_proof' | 'photo' | 'signature'
export type ApplicationStatus = 'draft' | 'locker_ready' | 'form_complete' | 'validated' | 'paid' | 'package_generated' | 'submitted' | 'approved'
export type ServiceType = 'oci_new' | 'oci_renewal' | 'passport_renewal'
export type AlertType = 'expiry_warning' | 'expiry_critical' | 'update_required'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          plan: string
          plan_expires: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          plan?: string
          plan_expires?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          plan?: string
          plan_expires?: string | null
          created_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          doc_type: string
          storage_path: string | null
          file_type: string | null
          file_size_bytes: number | null
          original_filename: string | null
          extracted_data: Json | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doc_type: string
          storage_path?: string | null
          file_type?: string | null
          file_size_bytes?: number | null
          original_filename?: string | null
          extracted_data?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doc_type?: string
          storage_path?: string | null
          file_type?: string | null
          file_size_bytes?: number | null
          original_filename?: string | null
          extracted_data?: Json | null
          expires_at?: string | null
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
          validation_results: Json | null
          stripe_payment_id: string | null
          arn: string | null
          vfs_reference: string | null
          package_url: string | null
          registration_number: string | null
          vfs_submitted_at: string | null
          package_downloaded_at: string | null
          tracking_number: string | null
          portal_progress: Json | null
          prefill_sources: Json | null
          prefill_coverage: number | null
          readiness_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_type: string
          status?: string
          form_data?: Json | null
          validation_errors?: Json | null
          validation_results?: Json | null
          stripe_payment_id?: string | null
          arn?: string | null
          vfs_reference?: string | null
          package_url?: string | null
          registration_number?: string | null
          vfs_submitted_at?: string | null
          package_downloaded_at?: string | null
          tracking_number?: string | null
          portal_progress?: Json | null
          prefill_sources?: Json | null
          prefill_coverage?: number | null
          readiness_score?: number | null
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
          validation_results?: Json | null
          stripe_payment_id?: string | null
          arn?: string | null
          vfs_reference?: string | null
          package_url?: string | null
          registration_number?: string | null
          vfs_submitted_at?: string | null
          package_downloaded_at?: string | null
          tracking_number?: string | null
          portal_progress?: Json | null
          prefill_sources?: Json | null
          prefill_coverage?: number | null
          readiness_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          document_id: string | null
          alert_type: string
          message: string
          sent_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          alert_type: string
          message: string
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          alert_type?: string
          message?: string
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export interface ExtractedPassportData {
  document_type?: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  place_of_birth: string
  passport_number: string
  nationality: string
  issue_date: string
  expiry_date: string
  issuing_country: string
  gender: string
  confidence_notes?: string
}

export interface ValidationError {
  field: string
  issue: string
  fix: string
}

export interface ValidationResult {
  blockers: ValidationError[]
  warnings: ValidationError[]
  passed_checks: string[]
}

export interface ReadinessCheck {
  id: string
  title: string
  status: 'passed' | 'failed' | 'warning'
  severity: 'blocker' | 'warning' | 'medium' | 'suggestion' | null
  message: string
  fix: string | null
  field: string | null
  correct_value: string | null
}

export interface ReadinessResult {
  score: number
  status: 'ready' | 'almost_ready' | 'needs_attention'
  checks_passed: number
  issues_total: number
  blockers: number
  warnings: number
  checks: ReadinessCheck[]
}
