// ── Service Registry — single source of truth for every Avasafe service ──────
// Adding a new service = adding one config object here. Nothing else.

export interface DocumentRequirement {
  id: string
  name: string
  description: string
  doc_type: string
  mandatory: boolean
  notes: string | null
  which_pages: string | null
  condition?: 'minor_application' | 'married' | null
}

export interface FieldMapping {
  field_id: string
  source_doc: string
  source_field: string | null
  portal_label: string
  format: string | null
  transform: string | null
}

export interface PortalField {
  id: string
  label: string
  portal_label: string
  field_type: 'text' | 'dropdown' | 'date' | 'file' | 'radio'
  prefill_from: string | null
  format_hint: string | null
  warning: string | null
  required: boolean
}

export interface PortalSection {
  id: string
  title: string
  portal_page: string
  estimated_minutes: number
  fields: PortalField[]
}

export interface ValidationRule {
  id: string
  title: string
  severity: 'blocker' | 'warning' | 'medium' | 'suggestion'
  score_deduction: number
  check: string
  error_message: string
  fix_message: string | null
  fix_field: string | null
  fix_value: string | null
}

export interface VFSStep {
  id: string
  title: string
  description: string
  action_type: 'instruction' | 'upload' | 'payment' | 'download' | 'generate'
  details: string[]
}

export interface ServiceConfig {
  id: string
  name: string
  short_name: string
  description: string
  category: 'oci' | 'passport' | 'visa' | 'pan' | 'other'
  available: boolean
  coming_soon: boolean
  icon: string
  required_documents: DocumentRequirement[]
  optional_documents: DocumentRequirement[]
  prefill_map: FieldMapping[]
  portal_url: string
  portal_sections: PortalSection[]
  vfs_url: string
  vfs_steps: VFSStep[]
  validation_rules: ValidationRule[]
  fees: {
    government_usd: number
    vfs_usd: number
    icwf_usd: number
    avasafe_usd: number
  }
  processing_weeks: string
  form_steps: number
  pdf_template: string
  requirements_search_query: string
}

// ── OCI New Application ───────────────────────────────────────────────────────

export const OCI_NEW: ServiceConfig = {
  id: 'oci_new',
  name: 'OCI New Application',
  short_name: 'OCI New',
  description: 'First-time OCI card for foreign nationals of Indian origin',
  category: 'oci',
  available: true,
  coming_soon: false,
  icon: 'Award',

  required_documents: [
    {
      id: 'us_passport',
      name: 'US Passport',
      description: 'Current valid US passport',
      doc_type: 'us_passport',
      mandatory: true,
      notes: 'Must have minimum 6 months validity at time of application',
      which_pages: 'Bio data page (page 2)',
    },
    {
      id: 'indian_passport',
      name: 'Indian Passport or Surrender Certificate',
      description: 'Your cancelled Indian passport showing the citizenship surrender stamp, OR a Surrender Certificate from the Indian consulate if you no longer have the physical passport.',
      doc_type: 'indian_passport',
      mandatory: true,
      notes: 'Upload the bio data page and the page with the "Cancelled on acquiring foreign citizenship" stamp. This stamp IS your proof of renunciation — you do NOT need a separate renunciation certificate if this stamp is present in your passport. If you no longer have the physical passport, upload your Surrender Certificate instead.',
      which_pages: 'Bio data page + page with cancellation stamp',
    },
    {
      id: 'address_proof',
      name: 'Address proof',
      description: 'Utility bill or bank statement less than 3 months old',
      doc_type: 'address_proof',
      mandatory: true,
      notes: 'Must show current US address. Cannot be older than 3 months.',
      which_pages: null,
    },
    {
      id: 'passport_photo',
      name: 'Passport photo',
      description: 'Square photo with white background',
      doc_type: 'photo',
      mandatory: true,
      notes: 'Minimum 51x51mm, white background, 80% face coverage, JPEG format, max 1MB',
      which_pages: null,
    },
  ],

  optional_documents: [
    {
      id: 'father_passport',
      name: "Father's passport",
      description: "Father's current valid passport, bio data page",
      doc_type: 'father_passport',
      mandatory: false,
      notes: "Required for minor child applications. Bio data page only.",
      which_pages: 'Bio data page',
      condition: 'minor_application',
    },
    {
      id: 'mother_passport',
      name: "Mother's passport",
      description: "Mother's current valid passport, bio data page",
      doc_type: 'mother_passport',
      mandatory: false,
      notes: "Required for minor child applications. Bio data page only.",
      which_pages: 'Bio data page',
      condition: 'minor_application',
    },
    {
      id: 'marriage_certificate',
      name: 'Marriage certificate',
      description: 'Required if married and spouse name to be endorsed',
      doc_type: 'marriage_certificate',
      mandatory: false,
      notes: 'Must be apostilled if issued outside India',
      which_pages: null,
    },
    {
      id: 'birth_certificate',
      name: 'Birth certificate',
      description: 'Required if applying through parent Indian origin',
      doc_type: 'birth_certificate',
      mandatory: false,
      notes: null,
      which_pages: null,
    },
    {
      id: 'previous_visa',
      name: 'Previous Indian visa',
      description: 'Copy of previous Indian visa if available',
      doc_type: 'indian_visa',
      mandatory: false,
      notes: null,
      which_pages: null,
    },
    {
      id: 'renunciation',
      name: 'Renunciation Certificate (rare cases only)',
      description: 'Only needed if your Indian passport has no cancellation stamp and you have no Surrender Certificate',
      doc_type: 'renunciation',
      mandatory: false,
      notes: 'Most applicants do NOT need this. If your Indian passport has the "Cancelled on acquiring foreign citizenship" stamp, that stamp is sufficient — skip this. If you have a Surrender Certificate, that is also sufficient — skip this. Only upload a Renunciation Certificate if you naturalized after 2010, your Indian passport lacks the cancellation stamp, and you do not have a Surrender Certificate.',
      which_pages: null,
    },
  ],

  prefill_map: [
    {
      field_id: 'surname',
      source_doc: 'us_passport',
      source_field: 'last_name',
      portal_label: 'Surname (as per passport)',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'given_name',
      source_doc: 'us_passport',
      source_field: 'first_name',
      portal_label: 'Given Name (as per passport)',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'date_of_birth',
      source_doc: 'us_passport',
      source_field: 'date_of_birth',
      portal_label: 'Date of Birth (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'place_of_birth',
      source_doc: 'us_passport',
      source_field: 'place_of_birth',
      portal_label: 'Place of Birth',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'passport_number',
      source_doc: 'us_passport',
      source_field: 'passport_number',
      portal_label: 'Passport No.',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'place_of_issue',
      source_doc: 'us_passport',
      source_field: null,
      portal_label: 'Place of Issue',
      format: null,
      transform: 'hardcode:USDOS',
    },
    {
      field_id: 'date_of_issue',
      source_doc: 'us_passport',
      source_field: 'issue_date',
      portal_label: 'Date of Issue (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'date_of_expiry',
      source_doc: 'us_passport',
      source_field: 'expiry_date',
      portal_label: 'Date of Expiry (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'nationality',
      source_doc: 'us_passport',
      source_field: null,
      portal_label: 'Nationality',
      format: null,
      transform: 'hardcode:United States of America',
    },
    {
      field_id: 'sex',
      source_doc: 'us_passport',
      source_field: 'gender',
      portal_label: 'Sex',
      format: null,
      transform: null,
    },
    {
      field_id: 'father_name',
      source_doc: 'indian_passport',
      source_field: 'father_name',
      portal_label: 'Father / Guardian Name',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'mother_name',
      source_doc: 'indian_passport',
      source_field: 'mother_name',
      portal_label: 'Mother Name',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'address_line1',
      source_doc: 'address_proof',
      source_field: 'address_line1',
      portal_label: 'Address Line 1',
      format: null,
      transform: null,
    },
    {
      field_id: 'city',
      source_doc: 'address_proof',
      source_field: 'city',
      portal_label: 'City',
      format: null,
      transform: null,
    },
    {
      field_id: 'state',
      source_doc: 'address_proof',
      source_field: 'state',
      portal_label: 'State',
      format: null,
      transform: null,
    },
    {
      field_id: 'zip',
      source_doc: 'address_proof',
      source_field: 'postal_code',
      portal_label: 'Zip Code',
      format: null,
      transform: null,
    },
  ],

  portal_url: 'https://ociservices.gov.in',
  portal_sections: [
    {
      id: 'personal',
      title: 'Personal details',
      portal_page: 'Registration Form Part 1',
      estimated_minutes: 2,
      fields: [
        {
          id: 'surname',
          label: 'Surname',
          portal_label: 'Surname (as per passport)',
          field_type: 'text',
          prefill_from: 'surname',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'given_name',
          label: 'Given names',
          portal_label: 'Given Name (as per passport)',
          field_type: 'text',
          prefill_from: 'given_name',
          format_hint: null,
          warning: 'Must include middle name exactly as in your US passport',
          required: true,
        },
        {
          id: 'date_of_birth',
          label: 'Date of birth',
          portal_label: 'Date of Birth (DD/MM/YYYY)',
          field_type: 'date',
          prefill_from: 'date_of_birth',
          format_hint: 'Enter as DD/MM/YYYY',
          warning: null,
          required: true,
        },
        {
          id: 'nationality',
          label: 'Nationality',
          portal_label: 'Nationality',
          field_type: 'dropdown',
          prefill_from: 'nationality',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'place_of_birth',
          label: 'Place of birth',
          portal_label: 'Place of Birth',
          field_type: 'text',
          prefill_from: 'place_of_birth',
          format_hint: null,
          warning: 'Enter exactly as in passport. Do not add city or state if passport says India.',
          required: true,
        },
        {
          id: 'country_of_birth',
          label: 'Country of birth',
          portal_label: 'Country of Birth',
          field_type: 'dropdown',
          prefill_from: null,
          format_hint: null,
          warning: null,
          required: true,
        },
      ],
    },
    {
      id: 'passport',
      title: 'Passport details',
      portal_page: 'Registration Form Part 1',
      estimated_minutes: 2,
      fields: [
        {
          id: 'passport_number',
          label: 'Passport number',
          portal_label: 'Passport No.',
          field_type: 'text',
          prefill_from: 'passport_number',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'place_of_issue',
          label: 'Place of issue',
          portal_label: 'Place of Issue',
          field_type: 'text',
          prefill_from: 'place_of_issue',
          format_hint: null,
          warning: 'Must be USDOS for US passports. Most common rejection cause.',
          required: true,
        },
        {
          id: 'date_of_issue',
          label: 'Date of issue',
          portal_label: 'Date of Issue (DD/MM/YYYY)',
          field_type: 'date',
          prefill_from: 'date_of_issue',
          format_hint: 'Enter as DD/MM/YYYY',
          warning: null,
          required: true,
        },
        {
          id: 'date_of_expiry',
          label: 'Date of expiry',
          portal_label: 'Date of Expiry (DD/MM/YYYY)',
          field_type: 'date',
          prefill_from: 'date_of_expiry',
          format_hint: 'Enter as DD/MM/YYYY',
          warning: null,
          required: true,
        },
        {
          id: 'sex',
          label: 'Sex',
          portal_label: 'Sex',
          field_type: 'dropdown',
          prefill_from: 'sex',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'visible_marks',
          label: 'Visible marks',
          portal_label: 'Visible Distinguishing Marks',
          field_type: 'text',
          prefill_from: null,
          format_hint: 'Enter None if not applicable',
          warning: null,
          required: true,
        },
        {
          id: 'marital_status',
          label: 'Marital status',
          portal_label: 'Marital Status',
          field_type: 'dropdown',
          prefill_from: null,
          format_hint: null,
          warning: null,
          required: true,
        },
      ],
    },
    {
      id: 'family',
      title: 'Family details',
      portal_page: 'Registration Form Part 2',
      estimated_minutes: 1,
      fields: [
        {
          id: 'father_name',
          label: 'Father name',
          portal_label: 'Father / Guardian Name',
          field_type: 'text',
          prefill_from: 'father_name',
          format_hint: 'First Name Middle Name Surname',
          warning: null,
          required: true,
        },
        {
          id: 'mother_name',
          label: 'Mother name',
          portal_label: 'Mother Name',
          field_type: 'text',
          prefill_from: 'mother_name',
          format_hint: 'First Name Middle Name Surname',
          warning: null,
          required: true,
        },
        {
          id: 'spouse_name',
          label: 'Spouse name',
          portal_label: 'Spouse Name',
          field_type: 'text',
          prefill_from: null,
          format_hint: 'Leave blank if not married',
          warning: null,
          required: false,
        },
        {
          id: 'spouse_nationality',
          label: 'Spouse nationality',
          portal_label: 'Spouse Nationality',
          field_type: 'dropdown',
          prefill_from: null,
          format_hint: null,
          warning: null,
          required: false,
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact and address',
      portal_page: 'Registration Form Part 2',
      estimated_minutes: 2,
      fields: [
        {
          id: 'email',
          label: 'Email address',
          portal_label: 'Email Id',
          field_type: 'text',
          prefill_from: 'email',
          format_hint: null,
          warning: 'Use an email you check regularly. All updates will be sent here.',
          required: true,
        },
        {
          id: 'mobile',
          label: 'Mobile number',
          portal_label: 'Mobile No.',
          field_type: 'text',
          prefill_from: 'mobile',
          format_hint: 'Include country code e.g. +1',
          warning: null,
          required: true,
        },
        {
          id: 'occupation',
          label: 'Occupation',
          portal_label: 'Occupation',
          field_type: 'dropdown',
          prefill_from: null,
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'address_line1',
          label: 'Street address',
          portal_label: 'Address Line 1',
          field_type: 'text',
          prefill_from: 'address_line1',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'city',
          label: 'City',
          portal_label: 'City',
          field_type: 'text',
          prefill_from: 'city',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'state',
          label: 'State',
          portal_label: 'State',
          field_type: 'dropdown',
          prefill_from: 'state',
          format_hint: null,
          warning: null,
          required: true,
        },
        {
          id: 'zip',
          label: 'Zip code',
          portal_label: 'Zip Code',
          field_type: 'text',
          prefill_from: 'zip',
          format_hint: null,
          warning: null,
          required: true,
        },
      ],
    },
    {
      id: 'photo',
      title: 'Photo and signature',
      portal_page: 'Photo and Sign Upload',
      estimated_minutes: 2,
      fields: [
        {
          id: 'photo_upload',
          label: 'Passport photo',
          portal_label: 'Upload Photo',
          field_type: 'file',
          prefill_from: null,
          format_hint: 'Square JPEG, white background, min 200x200px, max 1MB',
          warning: 'Physical photo submitted to VFS must be identical to uploaded photo',
          required: true,
        },
        {
          id: 'signature_upload',
          label: 'Signature',
          portal_label: 'Upload Signature',
          field_type: 'file',
          prefill_from: null,
          format_hint: 'JPEG, aspect ratio 1:3 (wide), max 1MB',
          warning: null,
          required: true,
        },
      ],
    },
  ],

  vfs_url: 'https://services.vfsglobal.com/usa/en/ind',
  vfs_steps: [
    {
      id: 'vfs_account',
      title: 'Create VFS account or login',
      description: 'Register at the VFS portal',
      action_type: 'instruction',
      details: [
        'Go to services.vfsglobal.com',
        'Click "New Applicant Registration"',
        'Use a personal email address',
        'Use a different password from your Avasafe account',
      ],
    },
    {
      id: 'vfs_new_application',
      title: 'Start new OCI application',
      description: 'Select OCI services on VFS',
      action_type: 'instruction',
      details: [
        'Click "Apply for OCI Services"',
        'Select "Fresh OCI"',
        'Enter your government portal registration number (USAN...)',
      ],
    },
    {
      id: 'vfs_upload',
      title: 'Upload application form',
      description: 'Upload your generated form PDF',
      action_type: 'upload',
      details: [
        'Download your Avasafe package PDF',
        'Upload the application form page',
        'Upload each supporting document as per the VFS checklist',
      ],
    },
    {
      id: 'vfs_payment',
      title: 'Pay VFS fee',
      description: 'Pay service and ICWF fee',
      action_type: 'payment',
      details: [
        'VFS service fee: $19.00',
        'ICWF contribution: $2.00',
        'Accepted: Visa, Mastercard, Money order, Cashier check',
        'Make checks payable to: VFS Services (USA) Inc.',
      ],
    },
    {
      id: 'vfs_shipping',
      title: 'Generate shipping label',
      description: 'Generate UPS label for mailing',
      action_type: 'generate',
      details: [
        'Select "Third Party Courier Service" on VFS',
        'Generate UPS shipping label',
        'Use UPS Pak or UPS envelope only',
        'One application per package',
      ],
    },
  ],

  validation_rules: [
    {
      id: 'name_match',
      title: 'Name matches passport',
      severity: 'blocker',
      score_deduction: 15,
      check: 'surname_match && given_name_includes_middle',
      error_message: 'Your name must match your US passport exactly including middle name.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'place_of_issue',
      title: 'Place of issue is USDOS',
      severity: 'blocker',
      score_deduction: 15,
      check: 'place_of_issue === USDOS',
      error_message: 'Place of issue must be USDOS for US passports. Most common rejection cause.',
      fix_message: 'Change to: USDOS',
      fix_field: 'passport_issued_by',
      fix_value: 'USDOS',
    },
    {
      id: 'passport_expiry',
      title: 'Passport valid 6+ months',
      severity: 'blocker',
      score_deduction: 15,
      check: 'passport_expiry_months > 6',
      error_message: 'Passport expires in less than 6 months. OCI requires minimum 6 months validity.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'dob_match',
      title: 'Date of birth consistent',
      severity: 'blocker',
      score_deduction: 15,
      check: 'dob_matches_passport',
      error_message: 'Date of birth does not match your stored passport data.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'docs_complete',
      title: 'Required documents present',
      severity: 'blocker',
      score_deduction: 15,
      check: 'all_required_docs_in_locker',
      error_message: 'Missing required document: [document_name]',
      fix_message: 'Upload this document to your locker',
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'place_of_birth',
      title: 'Place of birth format',
      severity: 'warning',
      score_deduction: 8,
      check: 'place_of_birth_no_city',
      error_message: 'Place of birth should match passport exactly. Do not add city or state if passport says India.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'photo_uploaded',
      title: 'Photo uploaded',
      severity: 'warning',
      score_deduction: 8,
      check: 'photo_in_application',
      error_message: 'No photo uploaded. OCI requires square JPEG, white background, minimum 51x51mm.',
      fix_message: 'Upload a photo',
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'vfs_jurisdiction',
      title: 'VFS centre matches address',
      severity: 'warning',
      score_deduction: 8,
      check: 'vfs_centre_correct_for_state',
      error_message: 'Verify your VFS centre matches your state of residence.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'apostille',
      title: 'Foreign documents apostilled',
      severity: 'medium',
      score_deduction: 4,
      check: 'foreign_docs_apostilled',
      error_message: 'Documents issued outside the US must be apostilled.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'email_present',
      title: 'Email address provided',
      severity: 'suggestion',
      score_deduction: 1,
      check: 'email_valid',
      error_message: 'Add a valid email address for application updates.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'parent_docs_for_minor',
      title: 'Parent documents for minor',
      severity: 'warning',
      score_deduction: 8,
      check: 'parent_docs_present_if_minor',
      error_message: "For minor applications, upload both parents' passports so AVA can pre-fill family details automatically.",
      fix_message: 'Upload parent passports to your locker on the prepare screen',
      fix_field: null,
      fix_value: null,
    },
  ],

  fees: {
    government_usd: 274,
    vfs_usd: 19,
    icwf_usd: 2,
    avasafe_usd: 29,
  },
  processing_weeks: '5-8',
  form_steps: 13,
  pdf_template: 'oci_new',
  requirements_search_query: 'OCI new application requirements USA VFS 2025 documents site:services.vfsglobal.com OR site:ociservices.gov.in',
}

// ── Indian Passport Renewal stub ──────────────────────────────────────────────

export const PASSPORT_RENEWAL: ServiceConfig = {
  id: 'passport_renewal',
  name: 'Indian Passport Renewal',
  short_name: 'Passport Renewal',
  description: 'Renew your Indian passport at the Indian consulate',
  category: 'passport',
  available: false,
  coming_soon: true,
  icon: 'BookOpen',
  required_documents: [],
  optional_documents: [],
  prefill_map: [],
  portal_url: 'https://passportindia.gov.in',
  portal_sections: [],
  vfs_url: '',
  vfs_steps: [],
  validation_rules: [],
  fees: {
    government_usd: 0,
    vfs_usd: 0,
    icwf_usd: 0,
    avasafe_usd: 29,
  },
  processing_weeks: 'TBD',
  form_steps: 10,
  pdf_template: 'passport_renewal',
  requirements_search_query: 'Indian passport renewal USA requirements 2025',
}

// ── OCI Miscellaneous Services ────────────────────────────────────────────────

export const OCI_MISC: ServiceConfig = {
  id: 'oci_misc',
  name: 'OCI Miscellaneous Services',
  short_name: 'OCI Renewal',
  description: 'Update your OCI card after a new passport, name change, or when your child turns 20',
  category: 'oci',
  available: true,
  coming_soon: false,
  icon: 'RefreshCw',

  required_documents: [
    {
      id: 'us_passport_new',
      name: 'New US Passport',
      description: 'Your new current valid US passport',
      doc_type: 'us_passport',
      mandatory: true,
      notes: 'Must be your NEW passport that triggered this renewal. Minimum 6 months validity.',
      which_pages: 'Bio data page only',
    },
    {
      id: 'oci_card',
      name: 'Existing OCI Card',
      description: 'Your current OCI card front and back',
      doc_type: 'oci_card',
      mandatory: true,
      notes: 'The OCI card you are updating. Both sides required.',
      which_pages: 'Front and back',
    },
    {
      id: 'old_passport',
      name: 'Old Passport on OCI',
      description: 'The passport that appears on your current OCI card',
      doc_type: 'indian_passport',
      mandatory: true,
      notes: 'The passport used when you originally got your OCI card. Bio data page only.',
      which_pages: 'Bio data page only',
    },
    {
      id: 'passport_photo',
      name: 'Passport photo',
      description: 'Recent passport style photo taken within 6 months',
      doc_type: 'photo',
      mandatory: true,
      notes: 'Square JPEG, white background, minimum 51x51mm, max 1MB.',
      which_pages: null,
    },
    {
      id: 'address_proof',
      name: 'Address proof',
      description: 'Utility bill or bank statement less than 3 months old',
      doc_type: 'address_proof',
      mandatory: true,
      notes: 'Must show current US address. Cannot be older than 3 months.',
      which_pages: null,
    },
  ],

  optional_documents: [
    {
      id: 'marriage_certificate',
      name: 'Marriage certificate',
      description: 'Required if applying due to name change after marriage',
      doc_type: 'other',
      mandatory: false,
      notes: 'Must be apostilled if issued outside India.',
      which_pages: null,
    },
    {
      id: 'police_report',
      name: 'Police report',
      description: 'Required for lost or stolen OCI card only',
      doc_type: 'other',
      mandatory: false,
      notes: 'Required only if OCI card is lost or stolen.',
      which_pages: null,
    },
  ],

  prefill_map: [
    {
      field_id: 'surname',
      source_doc: 'us_passport',
      source_field: 'last_name',
      portal_label: 'Surname (as per passport)',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'given_name',
      source_doc: 'us_passport',
      source_field: 'first_name',
      portal_label: 'Given Name (as per passport)',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'date_of_birth',
      source_doc: 'us_passport',
      source_field: 'date_of_birth',
      portal_label: 'Date of Birth (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'passport_number',
      source_doc: 'us_passport',
      source_field: 'document_number',
      portal_label: 'New Passport No.',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'place_of_issue',
      source_doc: 'us_passport',
      source_field: null,
      portal_label: 'Place of Issue',
      format: null,
      transform: 'hardcode:USDOS',
    },
    {
      field_id: 'date_of_issue',
      source_doc: 'us_passport',
      source_field: 'date_of_issue',
      portal_label: 'Date of Issue (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'date_of_expiry',
      source_doc: 'us_passport',
      source_field: 'date_of_expiry',
      portal_label: 'Date of Expiry (DD/MM/YYYY)',
      format: 'DD/MM/YYYY',
      transform: 'reformat_date',
    },
    {
      field_id: 'nationality',
      source_doc: 'us_passport',
      source_field: null,
      portal_label: 'Nationality',
      format: null,
      transform: 'hardcode:United States of America',
    },
    {
      field_id: 'oci_number',
      source_doc: 'oci_card',
      source_field: 'oci_number',
      portal_label: 'OCI Card Number',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'old_passport_number',
      source_doc: 'indian_passport',
      source_field: 'document_number',
      portal_label: 'Old Passport Number on OCI',
      format: null,
      transform: 'uppercase',
    },
    {
      field_id: 'address_line1',
      source_doc: 'address_proof',
      source_field: 'address_line1',
      portal_label: 'Address Line 1',
      format: null,
      transform: null,
    },
    {
      field_id: 'city',
      source_doc: 'address_proof',
      source_field: 'city',
      portal_label: 'City',
      format: null,
      transform: null,
    },
    {
      field_id: 'state',
      source_doc: 'address_proof',
      source_field: 'state',
      portal_label: 'State',
      format: null,
      transform: null,
    },
    {
      field_id: 'zip',
      source_doc: 'address_proof',
      source_field: 'postal_code',
      portal_label: 'Zip Code',
      format: null,
      transform: null,
    },
  ],

  portal_url: 'https://ociservices.gov.in',

  portal_sections: [
    {
      id: 'personal',
      title: 'Personal details',
      portal_page: 'OCI Misc Registration',
      estimated_minutes: 2,
      fields: [
        { id: 'surname', label: 'Surname', portal_label: 'Surname (as per passport)', field_type: 'text', prefill_from: 'surname', format_hint: null, warning: null, required: true },
        { id: 'given_name', label: 'Given names', portal_label: 'Given Name (as per passport)', field_type: 'text', prefill_from: 'given_name', format_hint: null, warning: 'Must include middle name exactly as in passport', required: true },
        { id: 'date_of_birth', label: 'Date of birth', portal_label: 'Date of Birth (DD/MM/YYYY)', field_type: 'date', prefill_from: 'date_of_birth', format_hint: 'Enter as DD/MM/YYYY', warning: null, required: true },
        { id: 'nationality', label: 'Nationality', portal_label: 'Nationality', field_type: 'dropdown', prefill_from: 'nationality', format_hint: null, warning: null, required: true },
      ],
    },
    {
      id: 'new_passport',
      title: 'New passport details',
      portal_page: 'New Passport Details',
      estimated_minutes: 2,
      fields: [
        { id: 'passport_number', label: 'New passport number', portal_label: 'New Passport No.', field_type: 'text', prefill_from: 'passport_number', format_hint: null, warning: null, required: true },
        { id: 'place_of_issue', label: 'Place of issue', portal_label: 'Place of Issue', field_type: 'text', prefill_from: 'place_of_issue', format_hint: null, warning: 'Must be USDOS for US passports', required: true },
        { id: 'date_of_issue', label: 'Date of issue', portal_label: 'Date of Issue (DD/MM/YYYY)', field_type: 'date', prefill_from: 'date_of_issue', format_hint: 'Enter as DD/MM/YYYY', warning: null, required: true },
        { id: 'date_of_expiry', label: 'Date of expiry', portal_label: 'Date of Expiry (DD/MM/YYYY)', field_type: 'date', prefill_from: 'date_of_expiry', format_hint: 'Enter as DD/MM/YYYY', warning: null, required: true },
      ],
    },
    {
      id: 'oci_details',
      title: 'Existing OCI details',
      portal_page: 'OCI Card Details',
      estimated_minutes: 1,
      fields: [
        { id: 'oci_number', label: 'OCI card number', portal_label: 'OCI Card Number', field_type: 'text', prefill_from: 'oci_number', format_hint: null, warning: 'Find this on the front of your OCI card', required: true },
        { id: 'old_passport_number', label: 'Old passport on OCI', portal_label: 'Old Passport Number on OCI', field_type: 'text', prefill_from: 'old_passport_number', format_hint: 'The passport number shown on your current OCI card', warning: null, required: true },
      ],
    },
    {
      id: 'contact',
      title: 'Contact and address',
      portal_page: 'Contact Details',
      estimated_minutes: 2,
      fields: [
        { id: 'email', label: 'Email address', portal_label: 'Email Id', field_type: 'text', prefill_from: 'email', format_hint: null, warning: 'Use an email you check regularly', required: true },
        { id: 'mobile', label: 'Mobile number', portal_label: 'Mobile No.', field_type: 'text', prefill_from: 'mobile', format_hint: 'Include country code +1', warning: null, required: true },
        { id: 'address_line1', label: 'Street address', portal_label: 'Address Line 1', field_type: 'text', prefill_from: 'address_line1', format_hint: null, warning: null, required: true },
        { id: 'city', label: 'City', portal_label: 'City', field_type: 'text', prefill_from: 'city', format_hint: null, warning: null, required: true },
        { id: 'state', label: 'State', portal_label: 'State', field_type: 'dropdown', prefill_from: 'state', format_hint: null, warning: null, required: true },
        { id: 'zip', label: 'Zip code', portal_label: 'Zip Code', field_type: 'text', prefill_from: 'zip', format_hint: null, warning: null, required: true },
      ],
    },
    {
      id: 'photo',
      title: 'Photo and signature',
      portal_page: 'Photo Upload',
      estimated_minutes: 2,
      fields: [
        { id: 'photo_upload', label: 'Passport photo', portal_label: 'Upload Photo', field_type: 'file', prefill_from: null, format_hint: 'Square JPEG, white background, min 200x200px, max 1MB', warning: null, required: true },
        { id: 'signature_upload', label: 'Signature', portal_label: 'Upload Signature', field_type: 'file', prefill_from: null, format_hint: 'JPEG, aspect ratio 1:3, max 1MB', warning: null, required: true },
      ],
    },
  ],

  vfs_url: 'https://services.vfsglobal.com/usa/en/ind',

  vfs_steps: [
    {
      id: 'vfs_login',
      title: 'Log in to VFS portal',
      description: 'Use existing VFS account or create a new one',
      action_type: 'instruction',
      details: [
        'Go to services.vfsglobal.com',
        'Log in or create account',
        'Select Apply for OCI Services',
        'Select OCI Miscellaneous Services',
      ],
    },
    {
      id: 'vfs_upload',
      title: 'Upload documents',
      description: 'Upload application and supporting documents',
      action_type: 'upload',
      details: [
        'Download your Avasafe checklist',
        'Upload the application form',
        'Upload new passport copy',
        'Upload existing OCI card copy',
        'Upload passport photo',
      ],
    },
    {
      id: 'vfs_payment',
      title: 'Pay VFS fee',
      description: 'Pay government and service fees',
      action_type: 'payment',
      details: [
        'Government fee: $25.00',
        'ICWF contribution: $3.00',
        'VFS service fee: varies by centre',
        'Accepted: Visa, Mastercard, Money order, Cashier check',
      ],
    },
    {
      id: 'vfs_shipping',
      title: 'Generate shipping label',
      description: 'Generate UPS label for mailing',
      action_type: 'generate',
      details: [
        'Select courier service on VFS',
        'Generate UPS shipping label',
        'Use UPS Pak or envelope only',
        'Mail to your VFS centre',
      ],
    },
  ],

  validation_rules: [
    {
      id: 'name_match',
      title: 'Name matches new passport',
      severity: 'blocker',
      score_deduction: 15,
      check: 'surname_match',
      error_message: 'Your name must match your new US passport exactly.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'place_of_issue',
      title: 'Place of issue is USDOS',
      severity: 'blocker',
      score_deduction: 15,
      check: 'place_of_issue === USDOS',
      error_message: 'Place of issue must be USDOS for US passports.',
      fix_message: 'Change to: USDOS',
      fix_field: 'place_of_issue',
      fix_value: 'USDOS',
    },
    {
      id: 'passport_expiry',
      title: 'New passport valid 6+ months',
      severity: 'blocker',
      score_deduction: 15,
      check: 'passport_expiry_months > 6',
      error_message: 'New passport must have minimum 6 months validity.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'oci_card_present',
      title: 'OCI card in locker',
      severity: 'blocker',
      score_deduction: 15,
      check: 'oci_card_in_locker',
      error_message: 'Upload your existing OCI card to your locker. Both sides needed.',
      fix_message: 'Upload OCI card to locker',
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'docs_complete',
      title: 'Required documents present',
      severity: 'blocker',
      score_deduction: 15,
      check: 'all_required_docs_in_locker',
      error_message: 'Missing required document: [document_name]',
      fix_message: 'Upload this document to locker',
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'photo_uploaded',
      title: 'Photo uploaded',
      severity: 'warning',
      score_deduction: 8,
      check: 'photo_in_application',
      error_message: 'No photo uploaded. Must be taken within 6 months.',
      fix_message: 'Upload a recent photo',
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'vfs_jurisdiction',
      title: 'VFS centre matches address',
      severity: 'warning',
      score_deduction: 8,
      check: 'vfs_centre_correct',
      error_message: 'Verify VFS centre matches your state of residence.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
    {
      id: 'dob_match',
      title: 'Date of birth consistent',
      severity: 'blocker',
      score_deduction: 15,
      check: 'dob_matches_passport',
      error_message: 'Date of birth does not match your stored passport data.',
      fix_message: null,
      fix_field: null,
      fix_value: null,
    },
  ],

  fees: {
    government_usd: 25,
    vfs_usd: 19,
    icwf_usd: 3,
    avasafe_usd: 29,
  },
  processing_weeks: '4-6',
  form_steps: 11,
  pdf_template: 'oci_misc',
  requirements_search_query: 'OCI miscellaneous services requirements USA VFS 2025 new passport update documents',
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  oci_new: OCI_NEW,
  oci_misc: OCI_MISC,
  passport_renewal: PASSPORT_RENEWAL,
}

export const getService = (serviceId: string): ServiceConfig | null => {
  return SERVICE_REGISTRY[serviceId] ?? null
}

export const getAvailableServices = (): ServiceConfig[] => {
  return Object.values(SERVICE_REGISTRY).filter(s => s.available)
}

export const getComingSoonServices = (): ServiceConfig[] => {
  return Object.values(SERVICE_REGISTRY).filter(s => s.coming_soon)
}
