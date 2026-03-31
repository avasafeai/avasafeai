# Avasafe AI — CLAUDE.md

## What we are building

Avasafe AI is the permanent, secure, intelligent home for every document-driven interaction
the Indian diaspora has with Indian institutions — for life.

The product has two connected layers:

**Layer 1 — The AVA Document Locker**
Users upload their critical identity documents once. AVA reads them, extracts structured
data, and stores everything encrypted. The locker monitors expiry dates and sends proactive
alerts. It powers every future application automatically.

**Layer 2 — Automated Application Preparation**
When a user needs to apply for something — OCI card or Indian passport renewal in v1 — AVA
uses the locker data to fill both required government portals automatically using Playwright,
validates the application against every known rejection cause, and generates a complete,
ready-to-mail PDF package. The user's only job is to drop an envelope at UPS.

**The core promise:** Apply once. Reuse everywhere.
**The trust promise:** AI handles everything by default. Optional human support for edge cases.

---

## Brand

- **Product name:** Avasafe AI
- **Short name:** Avasafe
- **Full meaning:** Automated Validation and Submission, Always Fast and Effortless
- **AI assistant:** AVA
- **Domain:** avasafe.ai
- **Tagline:** Your documents, safe. Your applications, done.
- **Target user:** Indian diaspora in the US — tech professionals, high earners, privacy-conscious
- **Competitor:** Documitra (human-powered, no locker, no reuse, no privacy guarantee)
- **Positioning:** "Documitra is the travel agent. Avasafe AI is Expedia."

---

## Strategic context — read this before building anything

This section explains the *why* behind every product decision. When you hit an ambiguous
choice, use this context to make the right call.

### The core insight

We started with a simple idea — OCI applications are painful and people will pay to avoid
that pain. That was right. But the deeper insight is this:

Every Indian diaspora person in the US has a recurring, lifelong relationship with Indian
bureaucracy. OCI card, passport renewal, PAN card, apostille, family applications. This
never ends. And they have no trusted, private, intelligent place to manage any of it.

That is what we are building. Not an OCI tool. A permanent NRI document manager.

**This distinction matters for every product decision.** The locker is not a feature that
supports the application flow. The application flow is a feature that demonstrates the
locker's value. The locker is the product. Everything else compounds on top of it.

### Why the locker changes the business

Without the locker, a user applies for OCI, pays once, and leaves. No reason to return.
No recurring revenue. No defensibility.

With the locker, users subscribe annually because their documents live here. Every life
event — passport renewal, spouse's OCI, new baby, PAN card — is a return visit and
an upsell. The switching cost grows with every document stored. A family of four generates
$200-400/year in lifetime value from a single household acquisition.

This is the difference between a transaction and a platform.

### The trust problem — our biggest challenge

We are asking users to upload their passport, their family documents, their renunciation
certificate. This is extremely sensitive data. Our biggest competitor, Documitra, wins
today on human trust — a real person guides you through. We are replacing that with
system trust, which is harder to earn.

**How we earn trust:**

1. "Safe" is in our name — Avasafe. This does real work before users read a single word.
2. "No human ever sees your documents" — this is a genuine differentiator for a privacy-
   conscious demographic that is uncomfortable with the Documitra WhatsApp model.
3. The rejection guarantee — "if our validation causes a rejection, we fix it free" —
   removes the fear of financial consequence from trusting us.
4. The UX quality itself — a product that feels polished and professional signals that
   the company behind it is serious and trustworthy.

**One important nuance on the "no humans" positioning:**
"No human ever sees your documents" sounds reassuring but also creates a new fear —
"who do I call when something goes wrong?" The correct positioning is:
"AI handles everything by default. Human support available for complex edge cases."
This removes fear without removing the privacy benefit. Always use this framing.

### The submission model — what AVA does vs what the user does

There is no official API for the OCI portal (ociservices.gov.in) or VFS Global. But
both portals are fully automatable with Playwright. Here is the exact breakdown:

**What AVA handles completely — user never touches any of this:**

1. Government portal (ociservices.gov.in / passportindia.gov.in)
   - Fills every field from locker data
   - Uploads all required documents
   - Submits the form
   - Captures the ARN (Application Reference Number)

2. VFS Global portal (services.vfsglobal.com)
   - Registers the application
   - Links the ARN from the government portal
   - Uploads all supporting documents
   - Selects courier options
   - Generates the pre-addressed shipping label to the correct VFS centre

3. Application package PDF
   - Every completed form, correctly formatted
   - Every required document copy, correctly sized and labelled
   - Pre-addressed UPS shipping label to the correct VFS jurisdiction centre
   - Signing instructions — red markers on every page that needs a signature
   - Step-by-step mailing checklist

**What the user must do — two steps only:**

1. Pay the government fee directly — AVA opens the payment page pre-filled,
   user taps pay. This cannot be processed through us — it goes directly to
   the Indian government and VFS. One tap.

2. Drop the physical envelope at UPS — originals must be physically mailed.
   This is the one step that can never be automated. Five minutes.

That is it. Two steps. One tap and one UPS drop.

**This IS the TurboTax model.** TurboTax cannot make you not owe taxes. It makes
every step except writing the check disappear. Avasafe AI makes every step except
paying the government fee and dropping an envelope disappear.

**The product positioning that flows from this:**

"Two things. Pay the government fee — one tap. Drop an envelope at UPS — five
minutes. AVA handles everything else."

**Frame this correctly throughout the UI:**
- Never say "you need to submit this yourself"
- Never say "we'll guide you through the portals"
- Say "AVA has completed both applications on your behalf"
- Say "Your only jobs: pay the fee and drop this envelope at UPS"

**Frame this correctly on the landing page and pricing:**
Lead with the two-step promise. Make it concrete and specific. Users who have
been through the VFS nightmare will immediately understand what this means.

### The Playwright automation approach

The government portals change frequently and have no official API. This means our
Playwright automation needs to be built defensively:

- Wrap all portal interactions in try/catch with meaningful error handling
- If automation fails, fall back gracefully — show the user a guided step-by-step
  walkthrough instead. Never show a raw error.
- Log portal failures silently so we can fix them without users knowing
- The user experience must be seamless whether automation succeeded or fell back

The guided fallback is: AVA shows the user their pre-validated answers one field at a
time and guides them through the portal manually. Every answer is displayed — they just
copy and paste. This is still dramatically better than doing it alone.

### Why privacy is our moat vs Documitra

Documitra is a services business — every new user requires a human. Their costs grow
linearly. They cannot scale without hiring. Their model requires users to hand personal
documents to strangers over WhatsApp.

Avasafe AI is software — every new user costs pennies to serve. Margins improve with
scale. No human ever touches user data.

This structural advantage means: win on privacy and automation first, then expand
breadth of services later. Do not try to compete with Documitra on breadth in v1.
Own the "private, automated, reusable" positioning completely.

### The competitive one-liner

Use this framing consistently across the product and marketing:
"Documitra is the travel agent. Avasafe AI is Expedia."

Or in product copy: "Unlike services that send your passport details over WhatsApp —
Avasafe handles everything automatically. No humans. No risk. Just done."

### What we are NOT building in v1

This is as important as what we are building. Do not add scope.

We are not building: PAN card, apostille, visa, EAD, mobile app, browser extension,
admin dashboard, multi-language support, referral system, or automated UPS label
purchase. We are not doing Tier 1 automation (full submission without any user action).

We build OCI and passport renewal with Tier 2 submission. We prove the model. We get
10 paying users. Then we expand.

Every time a new feature feels tempting, ask: does this help us get the first 10 paying
users? If no, it does not belong in v1.

---

## UX Philosophy — the most important section in this file

The quality standard is **TurboTax**. Not a government portal. Not a startup MVP. TurboTax.

Every screen must feel like it was designed by a team that deeply respects the user's time
and emotional state. Our users are stressed. They are afraid of making mistakes on
high-stakes government applications. They have been burned by confusing portals before.
The UI must make them feel calm, guided, and completely confident.

This is not a nice-to-have. This IS the product. A technically correct application that
feels confusing or cold will fail. A slightly less automated product that feels warm,
trustworthy, and effortless will win.

### The five principles — apply to every single screen

**1. One thing at a time**
Never show more than one primary action per screen. Never ask more than one question per
step. Never show more information than the user needs right now. A progress bar must always
be visible so the user knows where they are and how far they have to go. TurboTax never
shows you a form — it shows you one question, then the next. We do the same.

**2. Plain English always**
Zero government jargon anywhere in the product. If a government form says "Furnish details
of present citizenship" we say "What country are you a citizen of?" Every label, tooltip,
and error message must be written as if explaining to a smart friend who has never done
this before. Every confusing field must have a "Why do we need this?" tooltip that explains
in one plain sentence.

**3. Show progress visibly**
Users must always know: how many steps total, which step they are on, what comes next.
Progress must feel satisfying — each completed step feels like an accomplishment. Use
visual completion indicators. Never let the user feel lost or wonder how much is left.

**4. Errors prevent, not punish**
Validation happens in real time as the user types — not after they hit submit. Error
messages must explain what is wrong AND exactly what to do to fix it. Never show a generic
"invalid input" message. If a photo is wrong, say "Your photo needs to be square — yours
is 400x600px. Resize it to 400x400px." If a name doesn't match, say exactly which
documents conflict and how to resolve it.

**5. AVA has a voice**
AVA is warm, calm, reassuring, and expert. She speaks in first person. "I've read your
passport and pre-filled your details. Take a moment to confirm everything looks right."
Not "Document extraction complete." She acknowledges stress. "OCI applications can feel
overwhelming. I'll guide you through every step." She celebrates completion. "Your
application package is ready. You did it." Every message from AVA must feel like it came
from a knowledgeable friend, not a system notification.

### The UX quality bar — before any screen ships

Before any screen is considered done, check every item:

- [ ] AVA has spoken on this screen if the user needs guidance
- [ ] There is only one primary action visible at a time
- [ ] All copy is in plain English — zero jargon
- [ ] Progress is visible if this is part of a multi-step flow
- [ ] All form fields validate in real time with helpful error messages
- [ ] Loading states exist for every async action — no frozen screens
- [ ] Empty states are warm and encouraging, not blank
- [ ] Mobile responsive — works perfectly on iPhone
- [ ] Tap targets minimum 44px on mobile
- [ ] Trust badge row shown on any screen involving documents or payment

---

## Design system

### Visual aesthetic
Refined, calm, trustworthy. Premium fintech meets Indian heritage. Not corporate sterile.
Not startup colourful. Not generic AI product. Distinctly Avasafe.

### Colours
```css
:root {
  --color-navy:       #0F2D52;  /* primary — trust, security, depth */
  --color-gold:       #C9882A;  /* accent — heritage, quality, action */
  --color-background: #FAFAF8;  /* warm off-white, not clinical white */
  --color-surface:    #FFFFFF;
  --color-border:     #E5E7EB;
  --color-text-primary:   #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary:  #9CA3AF;
  --color-success:    #1A6B3A;
  --color-warning:    #92400E;
  --color-error:      #B91C1C;
  --color-success-bg: #F0FFF4;
  --color-warning-bg: #FFFBEB;
  --color-error-bg:   #FEF2F2;
}
```

### Typography
```css
/* Google Fonts — import both */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono&display=swap');

--font-display: 'Playfair Display', Georgia, serif;   /* headlines, AVA voice */
--font-body:    'DM Sans', system-ui, sans-serif;      /* all UI copy, labels */
--font-mono:    'DM Mono', monospace;                  /* reference numbers, codes */
```

### Spacing and layout
- 8px base spacing grid throughout
- Max content width: 640px on forms, 900px on dashboards
- Card padding: 24px. Border radius: 12px. Border: 1px solid var(--color-border)
- Card shadow: 0 1px 3px rgba(0,0,0,0.08)
- Generous white space — never cramped

### Component specifications

**Progress bar:** Thin 4px navy bar at top of every form screen. Shows "Step X of Y" and
current step name. Never skip this.

**AVA message bubble:** Left-aligned. Off-white background with subtle navy left border.
Playfair Display italic text. Small "AVA" badge. Used for guidance, explanations,
celebrations. This is AVA's voice — make it feel warm and distinct from system UI.

**Form field:** Label above (never inside). 48px height input. 1px border, 4px border on
focus in navy. Real-time validation. Error message below in red with fix instruction.
Pre-filled fields show a subtle "From your passport" badge in gold.

**Document upload zone:** Large dashed border area. Drag and drop. Shows processing
animation after upload. Fields appear one by one with green checkmarks as AVA extracts
them. This is the product's magic moment — animate it beautifully.

**Status timeline:** Vertical timeline. Completed stages green with checkmark. Current
stage navy with pulsing dot. Future stages grey. Estimated dates shown.

**Trust badge row:** Three items inline — lock "Bank-level encryption", shield "No human
sees your documents", star "Rejection guarantee". Show on upload, review, and payment
screens. This reassures users at every moment of doubt.

### Motion
- Page transitions: 200ms ease fade
- Form step transitions: slide in from right, out to left — 250ms ease
- Field extraction: each field slides in and settles — 150ms staggered
- Success state: gentle scale 1.0 → 1.02 → 1.0 — 200ms
- Error shake: 3 small horizontal shakes — 300ms
- AVA typing: three pulsing dots when processing
- Principle: only animate what adds meaning. No decorative animation for its own sake.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript strict mode |
| Styling | Tailwind CSS + CSS variables above |
| Fonts | Playfair Display + DM Sans + DM Mono via Google Fonts |
| Hosting | Vercel |
| Database | Supabase PostgreSQL with RLS |
| Auth | Supabase Auth — email + magic link |
| File storage | Supabase Storage — encrypted, user-scoped |
| Payments | Stripe — subscriptions + one-time |
| Document extraction | Claude API vision (claude-sonnet-4-6) |
| Validation | Claude API (claude-sonnet-4-6) |
| Portal automation | Playwright |
| Email | Resend |
| SMS / WhatsApp | Twilio |
| Icons | Lucide React |
| Animations | Framer Motion |

---

## Security — non-negotiable

- RLS enabled on ALL Supabase tables from day one
- Users only query rows where user_id = auth.uid()
- Files stored at storage/{user_id}/documents/{filename}
- SUPABASE_SERVICE_ROLE_KEY server-side only — never in client code
- All API routes return 401 for unauthenticated requests
- Never console.log passport numbers or personal data fields
- Raw document images deleted after extraction — only store structured fields
- Explicit consent checkbox before any document upload
- Delete all my data button in account settings — must work completely
- HTTPS enforced at Vercel level

---

## Environment variables

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

## Pricing

**Locker — $19/year**
Secure document storage, AI extraction, smart expiry alerts, 2 family profiles

**Locker + Apply — $49/year + $29 per application**
Everything in Locker + automated application preparation, validated PDF package,
status tracking, 5 family profiles

**Family — $99/year + $29 per application**
Everything in Locker + Apply + unlimited profiles, shared locker, priority support

**Guarantee — display on pricing, review, and checkout screens:**
"If your application is rejected due to an error in our validation, we will fix it
at no cost."

---

## Database schema

All tables have RLS enabled. All queries scoped to auth.uid().

### profiles
```sql
id            uuid  references auth.users  primary key
full_name     text
phone         text
plan          text  default 'locker'   -- locker | apply | family
plan_expires  timestamptz
created_at    timestamptz  default now()
```

### documents
```sql
id              uuid  primary key  default gen_random_uuid()
user_id         uuid  references profiles(id)
doc_type        text
-- us_passport | indian_passport | oci_card | renunciation | pan_card | address_proof | photo | signature
storage_path    text   -- raw image deleted after extraction
extracted_data  jsonb  -- structured fields from Claude
expires_at      timestamptz
created_at      timestamptz  default now()
```

Extracted data fields by doc_type:
- us_passport / indian_passport: first_name, last_name, full_name_as_printed,
  passport_number, date_of_birth, place_of_birth, issue_date, expiry_date,
  nationality, gender
- oci_card: oci_number, issue_date
- renunciation: certificate_number, date, issuing_authority

### applications
```sql
id                uuid  primary key  default gen_random_uuid()
user_id           uuid  references profiles(id)
service_type      text  -- oci_new | oci_renewal | passport_renewal
status            text  default 'draft'
form_data         jsonb
validation_errors jsonb
stripe_payment_id text
arn               text  -- from government portal after Playwright
vfs_reference     text
package_url       text  -- signed URL to PDF package
created_at        timestamptz  default now()
updated_at        timestamptz  default now()
```

Status flow: draft → locker_ready → form_complete → validated → paid →
package_generated → submitted → approved

### alerts
```sql
id           uuid  primary key  default gen_random_uuid()
user_id      uuid  references profiles(id)
document_id  uuid  references documents(id)
alert_type   text  -- expiry_warning | expiry_critical | update_required
message      text
sent_at      timestamptz
read_at      timestamptz
created_at   timestamptz  default now()
```

---

## Complete user flow — screen by screen

### Screen 1 — Landing page /
**Goal:** Convert visitor to signup in under 10 seconds.

Hero: Full viewport. Navy background. Gold accent. Playfair Display headline.

Headline: "Your OCI card. Your passport renewal. Done in minutes, not weeks."
Subheadline: "AVA securely stores your documents and automatically prepares every
application — so you never have to navigate a government portal again."
CTA: One gold button — "Start for free"

Below fold:
- Trust signals row: lock "Bank-level encryption", shield "No human sees your
  documents", guarantee "Rejection guarantee included"
- How it works: three illustrated steps — Upload your documents / AVA prepares
  everything / Drop an envelope at UPS
- Testimonials from real NRIs
- Pricing section with three tiers
- FAQ addressing the trust objections directly

No navigation clutter. One job on this page: get them to click Start.

### Screen 2 — Onboarding /onboarding
**Goal:** Upload first document and show the magic immediately.

AVA message (Playfair italic): "Hi, I'm AVA. I'm going to make sure you never
have to struggle with a government application again. Let's start by reading
your US passport."

Single large upload zone. Drag and drop. Clear instructions.

After upload: animated processing state.
AVA: "Reading your passport..." with pulsing dots.

Then: extracted fields appear one by one, each sliding in with a green checkmark.
Name. Date of birth. Passport number. Expiry date.

AVA: "I've read your passport. Take a moment to confirm everything looks right —
then we're done with the hard part."

User reviews extracted fields. Can edit any. Clicks Confirm.

This is the product's magic moment. The animation of fields appearing must be
beautiful and satisfying. Invest in getting this right.

### Screen 3 — Dashboard /dashboard
**Goal:** The user's permanent NRI document home. Calm, organised, at a glance.

Left sidebar navigation: Dashboard, My Documents, Applications, Alerts, Account.

If alerts exist: amber card at top of main area. Clear message. Action button.
Example: "Your Indian passport expires in 8 months. Start your renewal now →"

Document locker section: card grid. Each card shows document type, key field
preview, expiry indicator (green/amber/red), last updated date.

Applications section: list with status badges.

Empty locker state (warm, not blank):
"Your locker is ready. Add your Indian passport and OCI card so AVA can monitor
everything and pre-fill your next application automatically."

### Screen 4 — Start application /apply/[service]
**Goal:** Show user that AVA already knows what she needs.

AVA: "I already have most of what I need from your documents. Let me show you
what your OCI application looks like so far."

Preview card: grayed-out pre-filled fields with "From your passport" badges.
Highlighted fields still needed.

Progress bar: Step 1 of 5 — "Let's confirm your details"
CTA: "Review and complete"

### Screen 5 — Guided form /apply/[service]/form
**Goal:** One question at a time. Zero confusion. Constant validation.

Top: progress bar with step name.
Centre: one question. Large label. Input below. "Why do we need this?" tooltip.

AVA speaks when fields are tricky — inline in her bubble voice.

Real-time validation: green checkmark when valid, red message with fix instruction
when invalid.

Pre-filled fields: subtle gold "From your passport" badge. User can edit.

Photo upload screen: shows exact requirements (square, 200-1500px, white
background, no glasses). Instant format and size validation. Preview with crop.

Jurisdiction screen: auto-detected from address.
AVA: "Based on your Texas address, you'll submit to the Houston VFS centre."
Edit option available. Never just a dropdown.

Bottom: Back and Continue. Continue disabled until current field is valid.

### Screen 6 — Review and validate /apply/[service]/review
**Goal:** Complete confidence before payment.

AVA reviews everything and speaks first.

Clean state: green banner "Everything looks perfect — no errors found."
Full application summary: every field, every document, cleanly laid out in
two-column format.

Warning state: amber banner "A few things to double-check."
List of warnings with fix buttons inline.

Blocker state: red banner "I found an issue that would likely cause rejection."
Cannot proceed to payment until resolved.

Document checklist: every required document with green checkmark or missing badge.

Bottom: Guarantee badge — "Protected by our rejection guarantee."

### Screen 7 — Payment /apply/[service]/payment
**Goal:** Clear value, zero friction, fast.

Left: Application summary — service, what's included, price breakdown.
Right: Stripe Elements embedded card form — not a redirect.

Below form: lock icon "Secured by Stripe. We never store your card details."

After payment: immediate redirect to package screen.

### Screen 8 — Package ready /apply/[service]/package
**Goal:** Make the two remaining steps feel trivial. User should feel basically done.

AVA message (Playfair italic): "I've completed both your government application and
your VFS registration. Here's all that's left — two steps."

Two large action cards, numbered, visually dominant:

**Card 1 — Pay the government fee**
"The Indian government requires this fee to be paid directly. I've pre-filled
everything — just tap pay."
Button: "Pay government fee — $275" → opens pre-filled payment page in new tab
Small note beneath: "Paid directly to the Indian government. Takes 30 seconds."
After paid: card turns green. Checkmark. "Government fee paid ✓"

**Card 2 — Drop this envelope at UPS**
"Print your package, sign where marked in red, and drop it at any UPS location.
The label is pre-addressed — you don't need to do anything else."
Button: "Download your package (PDF)"
Small note beneath: "About 5 minutes. Any UPS location. No appointment needed."

The PDF package includes: every completed form, every required document copy,
photo correctly sized, signing instruction markers in red, pre-addressed UPS
shipping label to the correct VFS jurisdiction centre, and a one-page checklist.

Below both cards:
AVA: "That's it. I'll track your application and notify you at every step."
Timeline preview with estimated dates.

**Design principle for this screen:** The two steps must feel lightweight — not
like a burden. Minimal text. Large clear buttons. Green completion states.
The psychological message is: you're basically done.

### Screen 9 — Status /apply/[service]/status
**Goal:** Zero anxiety about where things stand.

Vertical timeline. Each stage with icon, name, date (estimated or actual).
Completed: green checkmark. Current: navy with pulsing dot. Future: grey.

Stages: Package mailed → VFS received → Under review → Approved →
Card dispatched → Delivered

Notification preferences: WhatsApp or email toggle.
Support section: "Something wrong? We're here." — email or chat link.

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| /api/extract-document | POST | Claude vision reads document, returns structured fields |
| /api/validate-application | POST | Claude validates form_data, returns blockers and warnings |
| /api/automate-government-portal | POST | Playwright fills government portal, uploads docs, submits, returns ARN |
| /api/automate-vfs-portal | POST | Playwright registers on VFS, links ARN, uploads docs, generates shipping label |
| /api/generate-package | POST | Generates complete PDF — forms, docs, signing markers, pre-addressed label |
| /api/create-checkout | POST | Creates Stripe checkout for subscription or per-application payment |
| /api/stripe-webhook | POST | Payment confirmed → trigger portal automation sequence |
| /api/application-status | GET | Returns current status and timeline |
| /api/check-alerts | POST | Cron job — checks document expiry dates, creates alerts, sends notifications |

**Portal automation sequence triggered after payment:**
1. /api/automate-government-portal → captures ARN
2. /api/automate-vfs-portal → links ARN, generates shipping label
3. /api/generate-package → assembles complete PDF with label
4. Send email/WhatsApp: "Your package is ready — two steps left"
5. Update application status to package_generated

**Automation failure handling:**
If Playwright fails on either portal, do not show the user a raw error. Fall back
gracefully to a guided step-by-step walkthrough — AVA shows every field answer
pre-calculated, user copies into the portal. Log the failure silently for debugging.
The user experience must be seamless whether automation succeeded or fell back.

---

## Claude API prompts

### Document extraction
```
System: You are a document extraction specialist. Extract all visible fields from
this identity document image with perfect accuracy. Return only valid JSON, no
explanation, no markdown.

User: Extract all fields from this document image:
{
  "document_type": "us_passport | indian_passport | oci_card | other",
  "first_name": "",
  "last_name": "",
  "full_name_as_printed": "",
  "date_of_birth": "YYYY-MM-DD",
  "place_of_birth": "",
  "passport_number": "",
  "nationality": "",
  "issue_date": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "issuing_country": "",
  "gender": "M | F",
  "confidence_notes": "note any fields that were unclear or partially visible"
}
```

### Application validation
```
System: You are an expert OCI card and Indian passport renewal reviewer with deep
knowledge of VFS Global requirements and common rejection causes. Find errors before
submission. Be specific and explain everything in plain English a non-expert can
understand. Return only valid JSON, no markdown.

User: Review this application carefully:
{
  "blockers": [{"field": "", "issue": "", "fix": ""}],
  "warnings": [{"field": "", "issue": "", "fix": ""}],
  "passed_checks": [""]
}

Blocker = will likely cause rejection. Warning = should fix but can proceed.

Check for: name mismatches across documents, photo specification violations,
wrong jurisdiction, passport validity under 6 months, missing required documents,
address proof older than 3 months, apostille requirements, name change affidavits.

Application: {form_data}
```

---

## Coding conventions

- TypeScript strict — no `any` types
- Zod validation on all API route inputs before processing
- Typed Supabase client throughout
- Error responses: `{ error: string, code: string }`
- Success responses: `{ data: T }`
- Never log sensitive data
- Server secrets only in API routes — never in client components
- Server components by default — client components only when needed
- Tailwind only — no inline styles, no CSS modules
- All user-facing copy reviewed for plain English before shipping
- Every form field has a visible label — never rely on placeholder alone
- Loading states on every async action — never freeze the UI
- Every destructive action requires a confirmation step
- Component names: PascalCase
- Utility names: camelCase
- Constants: SCREAMING_SNAKE_CASE

---

## MVP scope — v1 only

### Build in v1
- Landing page — production quality, leads with the two-step promise
- Onboarding — US passport upload and Claude extraction with animated field reveal
- Document locker — store, display, expiry monitoring for all document types
- Alert system — expiry warnings via email and WhatsApp
- OCI card application:
  - Guided form — all fields pre-filled from locker, one question at a time
  - Claude validation — blockers and warnings in plain English
  - Playwright — government portal automation (fill, upload, submit, capture ARN)
  - Playwright — VFS portal automation (register, link ARN, upload, generate label)
  - PDF package generation — forms, docs, signing markers, pre-addressed label
  - Government fee payment — pre-filled payment page, user taps pay
- Indian passport renewal — same model as OCI, same automation
- Stripe subscriptions — Locker $19/year, Locker + Apply $49/year
- Per-application payment — $29
- Status dashboard — full timeline with estimated dates
- Account settings — full data deletion, notification preferences
- Privacy policy and terms of service pages

### Do NOT build in v1
- PAN card, apostille, visa, EAD, or any other service
- Mobile app
- Browser extension
- Admin dashboard
- Multi-language support
- Referral program
- Automated UPS label purchase (include pre-addressed label in PDF, user creates UPS label at store)
- Any feature not on the list above — ship it, then expand

---

## Weekend build plan

### Weekend 1 — Foundation and magic moment
- Next.js setup: TypeScript, Tailwind, design system CSS variables
- Google Fonts: Playfair Display + DM Sans + DM Mono
- Supabase: schema, RLS, auth
- Landing page: production quality with all sections
- Onboarding: passport upload + Claude extraction with animated field reveal
- Deploy to Vercel: live URL from day one

### Weekend 2 — Locker and alerts
- Document locker dashboard: card grid, expiry indicators
- Multiple document types: upload + extraction
- Expiry monitoring: cron job + alert creation
- Email alerts: Resend integration
- WhatsApp alerts: Twilio integration
- Stripe: Locker plan $19/year

### Weekend 3 — OCI application
- Guided form: all OCI fields, pre-filled from locker, one question at a time
- Claude validation: blockers and warnings with plain English
- Playwright: government portal + VFS portal automation
- PDF package: complete ready-to-mail package generation
- Stripe: $29 per-application payment
- Status dashboard: timeline with all stages

### Weekend 4 — Passport renewal and polish
- Indian passport renewal: same model as OCI
- Mobile responsiveness: iPhone-first QA
- Animation polish: form transitions, extraction reveal, success states
- AVA voice review: every message reviewed for warmth and clarity
- Privacy policy + terms of service
- Soft launch: post in one Indian diaspora community

---

## First Claude Code instruction

When you open this project on Saturday morning, paste this exactly:

"Read CLAUDE.md completely before writing a single line of code.

I am building Avasafe AI — a secure NRI document locker and automated application
preparation platform for Indian diaspora in the US.

The quality standard is TurboTax. Every screen must feel calm, trustworthy, and
effortless. The UX philosophy in CLAUDE.md is as important as the technical spec.

Start with:
1. Next.js 14 project setup with TypeScript strict mode and Tailwind CSS
2. Google Fonts: Playfair Display, DM Sans, DM Mono
3. Design system CSS variables from CLAUDE.md — set these up in globals.css
4. Supabase connection with the schema from CLAUDE.md
5. Deploy skeleton to Vercel — live URL before building any features
6. Build the landing page — production quality, not a placeholder

Here are my environment variables: [paste from avasafe-env-keys.txt]"
