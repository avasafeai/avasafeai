-- Migration 003: Expand doc_type CHECK constraint to include optional document types
-- Adds: marriage_certificate, birth_certificate, indian_visa

-- Drop the existing constraint (name may vary — drop by listing the table constraint)
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

-- Recreate with expanded values
ALTER TABLE public.documents
  ADD CONSTRAINT documents_doc_type_check CHECK (doc_type IN (
    'us_passport',
    'indian_passport',
    'oci_card',
    'renunciation',
    'pan_card',
    'address_proof',
    'photo',
    'signature',
    'marriage_certificate',
    'birth_certificate',
    'indian_visa'
  ));
