# Avasafe AI — Product Spec & Claude Code Instructions

## Project Overview

**Product:** Avasafe AI  
**Tagline:** Apply once. Reuse everywhere.  
**Mission:** Automatically validate and submit OCI card applications for Indian diaspora in the US — starting with OCI and expanding to every document-driven process.  
**Abbreviation:** Automated Validation and Submission, Always Fast and Effortless  
**AI Assistant:** AVA (the in-product assistant name)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS only — no inline styles, no CSS modules |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Payments | Stripe |
| Document Extraction | Claude API with vision (passport OCR) |
| Validation | Claude API (claude-sonnet-4-6) |
| Email | Resend |
| SMS / WhatsApp | Twilio |

---

## Security — Non-Negotiable

These rules must be followed at all times:

- Row Level Security (RLS) enabled on ALL Supabase tables from day one
- Users can only query rows where user_id = auth.uid()
- All files stored with user-scoped paths: storage/{user_id}/documents/{filename}
- SUPABASE_SERVICE_ROLE_KEY is server-side only — never expose to client
- All API routes return 401 for unauthenticated requests — never 500
- Never console.log sensitive data (passport numbers, extracted fields)
- HTTPS only — enforced at Vercel level
- No human ever accesses user documents — enforced technically

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Database Schema

All tables have RLS enabled. Users only access rows where user_id = auth.uid().

### profiles
```sql
id          uuid  references auth.users  primary key
full_name   text
phone       text
created_at  timestamptz  default now()
```

### applications
```sql
id                uuid     primary key  default gen_random_uuid()
user_id           uuid     references profiles(id)
service_type      text     default 'oci_new'
status            text     default 'draft'
form_data         jsonb
validation_errors jsonb
stripe_payment_id text
vfs_reference     text
created_at        timestamptz  default now()
updated_at        timestamptz  default now()
```

Status values: draft → ready → paid → submitted → approved

### documents
```sql
id               uuid  primary key  default gen_random_uuid()
application_id   uuid  references applications(id)
user_id          uuid  references profiles(id)
doc_type         text
storage_path     text
extracted_data   jsonb
created_at       timestamptz  default now()
```

doc_type values: passport | renunciation | address_proof | photo | signature

---

## User Flow

### Step 1 — Landing page /
- Headline: "Apply for your OCI card without the headache."
- Subheadline: "AI-powered. Self-serve. No human ever sees your documents."
- Single CTA: "Start your application" → routes to /apply
- Three trust signals: Bank-level encryption, No human sees your documents, 98% first-time approval rate
- Clean minimal design

### Step 2 — Auth /auth
- Email + password signup and login using Supabase Auth
- Magic link option
- After auth redirect to /apply
- No social login in v1

### Step 3 — Document upload /apply/upload
- Ask user to upload: current foreign passport and old Indian passport or birth certificate
- Accept PDF and JPG/PNG, max 10MB per file
- On upload call /api/extract-document
- Send passport image to Claude API with vision to extract fields
- Show loading state: "AVA is reading your passport..."
- Display extracted fields for user confirmation: Name, DOB, Passport number, Place of birth, Issue date, Expiry date, Nationality
- User can edit any field before confirming
- Never silently populate — always show and confirm extracted data

### Step 4 — Guided form /apply/form
- Multi-step form, one topic per screen, progress bar at top
- All fields pre-filled from extracted data where possible
- Plain English labels — never copy government jargon
- Real-time validation on each field
- Tooltip "Why do we need this?" on confusing fields
- Form sections: Personal details, Passport details, Indian origin proof, Address and jurisdiction, Family details, Photo and signature upload
- Photo validator: check file format JPG, dimensions square 200-1500px, file size max 500KB
- Jurisdiction auto-detector: based on user state show correct VFS center

### Step 5 — Pre-submission review /apply/review
- Show full application summary
- Run final Claude API validation pass
- Yellow for warnings, red for blockers
- Blockers prevent proceeding
- Clean state shows "Your application is ready" with green checkmark

### Step 6 — Payment /apply/payment
- Single price: $39
- Stripe Checkout
- On success: webhook fires, update status to paid, redirect to /apply/status
- On cancel: return to review page, application saved

### Step 7 — Status dashboard /apply/status
- Show current status with timeline
- Statuses: Paid → Preparing submission → Submitted to VFS → Under review → Approved → Card dispatched
- WhatsApp and email notification at each status change
- VFS reference number shown once submitted

---

## API Routes

| Route | Description |
|-------|-------------|
| POST /api/extract-document | Send passport image to Claude API vision, return structured fields |
| POST /api/validate-application | Send form_data to Claude API, return errors with plain English explanations |
| POST /api/create-checkout | Create Stripe checkout session for $39, return checkout URL |
| POST /api/stripe-webhook | Handle payment success, update application status to paid |
| POST /api/submit-application | Triggered after payment, update status to submitted |
| GET /api/application-status | Return current status and timeline for authenticated user |

---

## Claude API Usage

### Document extraction prompt pattern
```
System: You are a document extraction specialist. Extract all fields from this passport image and return them as a JSON object. Be precise — extract exactly what is printed on the document.

User: Extract all fields from this passport image and return JSON with these fields:
{
  first_name, last_name, full_name,
  passport_number, nationality,
  date_of_birth, place_of_birth,
  issue_date, expiry_date,
  issuing_country, gender
}
Return JSON only. No explanation.
```

### Validation prompt pattern
```
System: You are an expert OCI card application reviewer. Identify errors that would cause rejection. Be specific and actionable. Explain in plain English. Return JSON only.

User: Review this OCI application and return:
{ errors: [{field, message, severity}], warnings: [{field, message}] }

Severity: blocker (prevents submission) or warning (should fix but can proceed)

Application data: {form_data}
```

---

## Coding Conventions

- TypeScript strict mode — no any types
- All API routes validate input with zod before processing
- All Supabase queries use typed client
- Error responses always return { error: string }
- Success responses always return { data: T }
- Never console.log sensitive data
- Server-side secrets only in API routes — never in client components
- Use Next.js server components by default — only use client when needed
- Tailwind only for styling
- Component files: PascalCase
- Utility files: camelCase
- Constants: SCREAMING_SNAKE_CASE

---

## Weekend Build Plan

### Weekend 1 — Prove the magic
**Day 1**
- Next.js project init with TypeScript and Tailwind
- Supabase setup — create tables, enable RLS
- Deploy skeleton to Vercel
- Landing page live

**Day 2**
- Supabase Auth working
- Document upload UI
- Claude API passport extraction end-to-end
- Show extracted fields to user

### Weekend 2 — Make it sellable
**Day 3**
- Multi-step guided form
- Real-time field validation
- Photo and signature validator
- Jurisdiction auto-detection

**Day 4**
- Claude API validation layer
- Stripe Checkout integration
- Stripe webhook
- Status dashboard
- Resend email confirmation
- Get 3 beta users

---

## Out of Scope for v1

Do not build any of the following until 10 paying users:

- Passport renewal flow
- PAN card, apostille, or any other service
- Mobile app
- Multiple pricing tiers
- Admin dashboard
- Multi-language support
- Referral system
- Automated VFS submission — use hybrid for v1
- Any marketing beyond one diaspora community post

---

## Brand

- **Product name:** Avasafe AI
- **Short name:** Avasafe
- **Assistant name:** AVA
- **Domain:** avasafe.ai
- **Vision:** Apply once. Reuse everywhere.
- **Tagline:** Your applications, completed automatically.
- **Target user:** Indian diaspora in the US — tech workers, professionals, high earners
- **Competitor:** Documitra (human-powered, no AI, no self-serve)
- **Differentiator:** AI-powered, fully self-serve, no human ever sees your documents
- **Pricing:** $39 per OCI application (v1)
