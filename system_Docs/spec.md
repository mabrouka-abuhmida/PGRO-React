# PGR Supervision Matching System – Technical Specification

**Owner:** Dr Mabrouka Abuhmida
**Institution:** University of South Wales (Prifysgol De Cymru)
**Version:** 0.1 (Architecture & Requirements)

This document is the **master reference** for designing and implementing the **PGR Supervision Matching System** – an AI-powered tool to help allocate PhD/MRes supervisors.

It defines:

- Product vision & goals
- USW-aligned branding & UX guidelines
- System behaviour & user stories
- Architecture (frontend + microservice backend)
- Data model (entities + relationships)
- API design & service boundaries
- LLM integration strategy
- Project structure for a Cursor-driven monorepo

Everything built for this project should conform to this document unless explicitly updated in version control.

---

## 1. Product Vision

### 1.1 Problem

PGR Leads and Directors of Studies at USW spend substantial time:

- Reading and interpreting PhD / MRes applications
- Manually identifying suitable supervisors
- Checking workload and eligibility constraints
- Keeping spreadsheets or ad-hoc trackers of allocations

This is time-consuming, error-prone, and hard to audit.

### 1.2 Vision

Create an internal **web application** that:

- Ingests PGR applications (PDF or text)
- Uses an LLM to produce **structured summaries**
- Uses embeddings + rules to recommend **ranked supervisor matches**
- Tracks allocations and supervision load
- Exposes an intuitive dashboard aligned with **USW visual identity**

The tool acts as a **“Supervision Matching Copilot”**, not an automatic decision maker: humans always confirm final allocations.

---

## 2. Branding & UX Guidelines (USW Style)

The UI should visually feel like part of the **University of South Wales** digital ecosystem while remaining clearly an internal tool.

### 2.1 Colours (Design Tokens)

Use approximate USW colours as base tokens (can be refined later to exact brand hex):

```ts
// frontend/src/styles/theme.ts
export const colours = {
  uswRed:    '#BE1E2D', // Primary brand red (from hero panels)
  uswGreen:  '#006B3F', // MSc AI hero green
  uswDark:   '#111111', // Body text / headings
  uswOffWhite: '#F5F5F5', // Light background panels
  uswGrey:   '#D9D9D9', // Borders, dividers
  accentAmber: '#FFB81C', // Optional attention accent
  white: '#FFFFFF',
};
```

Usage:

- **Primary actions / headers:** `uswRed` or `uswGreen`
- **Background:** white or `uswOffWhite`
- **Text:** mostly `uswDark` on light background
- **Alerts / highlights:** `accentAmber` sparingly

### 2.2 Typography

Aim to echo USW’s bold, accessible typography:

- Use a **strong sans serif** (e.g. `system-ui`, `Inter`, or `Montserrat` in CSS)
- Headings: uppercase, bold, high contrast (similar to “RANKED TOP 50 IN THE UK”)
- Body text: clear, 16px–18px.

Example CSS:

```css
.h-hero {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.h-section {
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
}

.body {
  font-size: 1rem;
  line-height: 1.5;
}
```

### 2.3 Layout & Components

- Left-aligned hero panels similar to USW homepage (large colour block + content).
- Primary layout: **top navigation bar**, left-aligned content, plenty of white space.
- Use **cards** for:
  - Applicants
  - Staff
  - Match recommendations

Navigation sections:

- **Dashboard**
- **Applicants**
- **Staff**
- **Allocations**
- **Admin**

---

## 3. Core Use Cases & User Stories

### 3.1 Actors

- **PGR Lead / DoS (Mabrouka & peers)** – primary user
- **Academic staff (supervisors)** – view/edit their profile (phase 2+)
- **Admin staff** – can update data & export reports
- **System / LLM services** – background processing

### 3.2 User Stories

1. **Upload and summarise application**

   - As PGR Lead, I upload a PDF or paste a proposal.
   - The system extracts text and generates a structured summary (title, themes, methods, risks).
2. **Get supervisor recommendations**

   - As PGR Lead, I open an application and see a ranked list of recommended supervisors (DoS candidates and possible co-supervisors) with match scores and explanations.
3. **Check capacity & constraints**

   - As PGR Lead, I view each supervisor’s current and maximum load before confirming a new allocation.
4. **Confirm supervision team**

   - As PGR Lead, I assign a DoS and co-supervisors, optionally overriding AI suggestions and recording reasons.
5. **Maintain staff profiles**

   - As Admin or PGR Lead, I edit staff research areas, keywords, supervision preferences, and maximum loads.
6. **Monitor intake status**

   - As PGR Lead, I use a dashboard to see which applicants are unassigned, which are in progress, and which are completed.
7. **Export allocation data**

   - As Admin, I export a CSV for Registry including applicant, programme, intake, DoS, and supervisors.

---

## 4. System Behaviour

### 4.1 Application Ingestion

- **Input:**
  - PDF upload OR pasted text.
- **Steps:**
  1. Extract text (backend `file-service`).
  2. Store raw text in DB (applicant record).
  3. Call LLM summarisation (`llm-service`) to generate structured summary.
  4. Store summary + keywords + themes in DB.
  5. Generate embeddings and store in vector column.

### 4.2 Matching

- For a given application:
  1. Retrieve application embedding.
  2. Query staff embeddings via similarity search (pgvector).
  3. Filter staff by:
     - Degree type support (PhD / MRes)
     - Eligibility (can_be_dos)
     - Current vs max load
  4. Produce a ranked list of candidate staff with numeric scores.
  5. Call LLM with application summary + top staff profiles + scores → generate human-readable justifications.
  6. Persist suggestions to `allocation` table (`is_suggestion = true`).

### 4.3 Allocation & Audit

- Confirming DoS and co-supervisors:
  - Update `allocation` row(s): `is_confirmed = true`, `role = DOS/CO_SUPERVISOR`, `confirmed_at`, `confirmed_by_user_id`.
  - Update staff load counters or record load events.
  - Add optional `applicant_note` explaining override decisions.

---

## 5. Architecture (Microservices + Frontend)

### 5.1 High-Level Overview

- **Frontend:** React + TypeScript, SPA, talking only to **API Gateway**.
- **Backend:** Python FastAPI microservices:
  - `api-gateway` – single entry point for frontend.
  - `auth-service` – authentication & user roles (can start minimal).
  - `staff-service` – CRUD for staff, embeddings management.
  - `applicant-service` – applications, documents, notes.
  - `matching-service` – embeddings, similarity search, LLM match reasoning.
  - `file-service` – file upload, storage, text extraction, document management.
- `email-service` – SendGrid integration for allocation and participant email notifications.
- **Database:** PostgreSQL + `pgvector` extension.
- **LLM Provider:** OpenAI or Azure OpenAI for:
  - Summaries
  - Keyword extraction
  - Match explanation

### 5.2 Monorepo Structure

```plaintext
pgr-matching/
  README.md                  # High-level project readme
  spec.md                    # This document (source of truth)

  frontend/                  # React + TypeScript SPA
    src/
      components/
      pages/
      layouts/
      hooks/
      services/              # Typed API clients
      styles/
      types/
    public/
    package.json
    vite.config.ts

  backend/
    services/
      api-gateway/
        app/
          main.py
          routers/
          config.py
          dependencies.py
      auth-service/
        app/
          main.py
          routers/
          models/
          schemas/
      staff-service/
        app/
          main.py
          routers/
          models/
          schemas/
          embeddings/
      applicant-service/
        app/
          main.py
          routers/
          models/
          schemas/
      matching-service/
        app/
          main.py
          routers/
          logic/
          prompts/
      file-service/
        app/
          main.py
          routers/
          storage/
          text_extraction/

    shared/
      db/
        base.py              # SQLAlchemy base + session
        models/              # Shared models if desired
      config/
        settings.py
      llm/
        client.py
        prompts.py

    tests/

  infra/
    docker-compose.yml
    k8s/                     # Optional later
    migrations/              # Alembic migrations

  docs/
    database_schema.md
    prompts.md
    api_reference.md         # future
```

---

## 6. Data Model (Summary)

Full SQL is in `docs/database_schema.md`. High-level entities:

### 6.1 Staff

- `id: UUID`
- `full_name: TEXT`
- `email: CITEXT`
- `role_title: TEXT`
- `school: TEXT`
- `research_group: TEXT`
- `can_be_dos: BOOLEAN`
- `can_supervise_phd: BOOLEAN`
- `can_supervise_mres: BOOLEAN`
- `max_phd_supervisions: SMALLINT`
- `max_mres_supervisions: SMALLINT`
- `current_phd_supervisions: SMALLINT`
- `current_mres_supervisions: SMALLINT`
- `research_interests_text: TEXT`
- `methods_text: TEXT`
- `keywords: TEXT[]`
- `embedding: VECTOR(1536)`
- `active: BOOLEAN`

### 6.2 Applicant

- `id: UUID`
- `full_name: TEXT`
- `email: CITEXT`
- `degree_type: ENUM(PHD, MRES)`
- `intake_term: TEXT`
- `intake_year: SMALLINT`
- `raw_application_text: TEXT`
- `summary_text: TEXT`
- `summary_last_updated_at: TIMESTAMPTZ`
- `topic_keywords: TEXT[]`
- `method_keywords: TEXT[]`
- `primary_theme: TEXT`
- `secondary_theme: TEXT`
- `status: ENUM(NEW, UNDER_REVIEW, SUPERVISOR_CONTACTED, ACCEPTED, REJECTED, ON_HOLD)`
- `priority_score: NUMERIC(5,2)` (0-100 quality score)
- `ai_detection_probability: NUMERIC(5,2)` (0-100 AI detection likelihood)
- `quality_rationale: TEXT` (explanation for quality and AI detection scores)
- `embedding: VECTOR(1536)`

### 6.3 Allocation

- `id: UUID`
- `applicant_id: UUID (FK)`
- `staff_id: UUID (FK)`
- `role: ENUM(DOS, CO_SUPERVISOR, ADVISOR)`
- `match_score: NUMERIC(5,4)`
- `explanation: TEXT`
- `is_suggestion: BOOLEAN`
- `is_confirmed: BOOLEAN`
- `confirmed_at: TIMESTAMPTZ`
- `confirmed_by_user_id: UUID`

### 6.4 Supporting Entities

- `app_user` – system users and roles
- `applicant_document` – file metadata with document type classification (PROPOSAL, CV, APPLICATION_FORM, TRANSCRIPT)
- `applicant_note` – notes & audit comments (supports both applicant-level and allocation-specific notes with threading/replies)
- `supervision_load_event` – optional load history
- `applicant_profile` – personal details (DOB, nationality, residence, phone, address, how_heard_about_usw) linked 1:1 with applicant
- `applicant_degree` – educational qualifications (degree type, subject, university, classification, year)
- `applicant_email_log` – log of congratulatory emails sent to applicants and CC'd supervisors
- `staff_review` – structured staff reviews of allocated applicants with review form fields
- `interview_record` – interview records for accepted applicants (linked to allocation, staff, and applicant)

---

## 7. API Design (Contracts at Gateway Level)

All frontend calls go to `api-gateway`. The gateway forwards to internal services.

### 7.1 Applicants

`GET /api/applicants?intake_year=2026&status=NEW&intake_term=FEB&degree_type=PHD&page=1&page_size=50`
→ list of applicants (minimal card data)

`GET /api/applicants/dashboard/intake-summary`
→ aggregated statistics by intake year, term, and status:

```json
{
  "2026": {
    "FEB": {
      "new": 5,
      "supervisor_contacted": 3,
      "accepted": 2,
      "rejected": 1
    },
    "SEP": { ... }
  }
}
```

`GET /api/applicants/analytics/topics-by-theme`
→ topics grouped by primary and secondary themes

`GET /api/applicants/analytics/statistics`
→ comprehensive application statistics (status breakdown, degree breakdown, intake trends, research group coverage)

`GET /api/applicants/analytics/accelerator-research-theme-correlation`
→ correlation matrix between accelerators and research themes

`POST /api/applicants`
Body:

```json
{
  "full_name": "Applicant Name",
  "email": "applicant@example.com",
  "degree_type": "PHD",
  "intake_term": "FEB",
  "intake_year": 2026,
  "raw_application_text": "...."
}
```

Behaviour:

- Creates applicant
- Triggers summarisation + embedding generation
- Returns created entity with `summary_text` and `embedding` once ready

`POST /api/applicants/batch-upload`

- Upload multiple PDF files
- Extracts text and creates applicants automatically
- Optional auto-matching

`GET /api/applicants/{id}`
→ full applicant record including `embedding`, `summary_text`, `topic_keywords`, `method_keywords`

`PUT /api/applicants/{id}`
→ update applicant (triggers re-embedding if relevant fields change)

`DELETE /api/applicants/{id}`
→ hard delete applicant (cascades to allocations and documents)

`GET /api/applicants/{id}/documents/checklist`
→ document checklist status (PROPOSAL, CV, APPLICATION_FORM, TRANSCRIPT)

`GET /api/applicants/{id}/documents`
→ list of uploaded documents for applicant

`POST /api/applicants/{id}/extract-application-form`
→ extract structured data from uploaded application form document

`GET /api/applicants/{id}/profile`
→ applicant personal profile + degrees:

```json
{
  "applicant_id": "uuid",
  "full_name": "Applicant Name",
  "email": "applicant@example.com",
  "profile": {
    "date_of_birth": "1995-03-10",
    "nationality": "Libyan",
    "country_of_residence": "United Kingdom",
    "phone_number": "+44..."
  },
  "degrees": [
    {
      "id": "uuid",
      "degree_type": "MSc",
      "subject_area": "Artificial Intelligence",
      "university": "USW",
      "university_country": "UK",
      "classification": "Distinction",
      "year_completed": 2024
    }
  ]
}
```

`PUT /api/applicants/{id}/profile`
→ create or update applicant profile (DOB, nationality, residence, phone, email).

`POST /api/applicants/{id}/degrees`
→ add an educational qualification for the applicant.

`PUT /api/applicants/{id}/degrees/{degree_id}`
→ update an existing degree.

`DELETE /api/applicants/{id}/degrees/{degree_id}`
→ delete a degree record.

`GET /api/applicants/{id}/can-email-participant`
→ validation endpoint used by the UI to decide whether to enable the “Email participant” button. Checks:

- application status must be `ACCEPTED`
- applicant must have an email
- at least one confirmed allocation exists

Returns:

```json
{
  "canEmail": true,
  "reason": null
}
```

`POST /api/applicants/{id}/email-participant`
→ send congratulatory email to the applicant with confirmed supervisors CC'd and log the event in `applicant_email_log`.

### 7.5 Files

`POST /api/files/upload`
→ upload file (PDF, DOCX, etc.) with document type classification

`GET /api/files/{file_id}`
→ get file metadata

`GET /api/files/{file_id}/download`
→ download file

`GET /api/files/{file_id}/extract-text`
→ extract text from file

`DELETE /api/files/{file_id}`
→ delete file

### 7.6 Staff Reviews

`GET /api/staff-reviews/allocation/{allocation_id}`
→ get staff review for allocation

`POST /api/staff-reviews`
→ create or update staff review

`POST /api/staff-reviews/{allocation_id}/generate-ai-review`
→ generate AI-powered review for allocation

### 7.7 Interview Records

`GET /api/interview-records`
→ list interview records with optional filters (applicant_id, staff_id, status)

`GET /api/interview-records/{record_id}`
→ get specific interview record with full details

`GET /api/interview-records/allocation/{allocation_id}`
→ get interview record for specific allocation

`POST /api/interview-records`
→ create or update interview record

### 7.8 Allocation Notes

`GET /api/allocations/{allocation_id}/notes`
→ get all notes for an allocation, organized as threads

`POST /api/allocations/{allocation_id}/notes`
→ create a new note for an allocation

`POST /api/allocations/{allocation_id}/notes/{parent_note_id}/reply`
→ reply to an existing note (threading)

`PUT /api/allocations/{allocation_id}/notes/{note_id}`
→ update an existing note

`DELETE /api/allocations/{allocation_id}/notes/{note_id}`
→ soft delete a note

### 7.9 Analytics

All analytics endpoints require SMT role:

`GET /api/applicants/analytics/topics`
→ topic distribution analytics

`GET /api/applicants/analytics/topics-by-research-group`
→ topics grouped by research group

`GET /api/applicants/analytics/topics-by-theme`
→ topics grouped by primary and secondary themes

`GET /api/applicants/analytics/statistics`
→ comprehensive application statistics

`GET /api/applicants/analytics/accelerator-research-theme-correlation`
→ correlation matrix between accelerators and research themes

`GET /api/applicants/analytics/staff-capacity`
→ staff capacity and load analytics

`GET /api/applicants/analytics/acceptance-rates`
→ acceptance rate analytics

### 7.2 Matching

`POST /api/matching/match`
Body:

```json
{
  "applicant_id": "uuid",
  "applicant_name": "John Doe",
  "degree_type": "PHD",
  "applicant_summary": "...",
  "applicant_topics": ["AI", "ML"],
  "applicant_methods": ["quantitative"],
  "applicant_embedding": [0.1, 0.2, ...],
  "require_dos": false,
  "min_score": 0.0,
  "require_capacity": true,
  "limit": 20
}
```

Returns list of recommended staff:

```json
[
  {
    "staff_id": "uuid",
    "full_name": "Dr X",
    "role_suggestion": "DOS",
    "match_score": 0.93,
    "explanation": "Dr X works on ...",
    "capacity_status": "AVAILABLE",
    "research_interests": "..."
  }
]
```

### 7.3 Allocations

`GET /api/allocations?applicant_id=uuid&staff_id=uuid&is_confirmed=true&year=2026&term=FEB`
→ list allocations with filters. Returns enriched data:

```json
[
  {
    "id": "uuid",
    "applicant_id": "uuid",
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_status": "NEW",
    "staff_id": "uuid",
    "staff_name": "Dr X",
    "staff_email": "x@usw.ac.uk",
    "role": "DOS",
    "match_score": 0.93,
    "explanation": "...",
    "is_confirmed": false
  }
]
```

`GET /api/allocations/intake?year=2026&term=FEB`
→ allocations for specific intake

`POST /api/allocations`
Body:

```json
{
  "applicant_id": "uuid",
  "staff_id": "uuid",
  "role": "DOS",
  "is_confirmed": false,
  "match_score": 0.93,
  "explanation": "..."
}
```

- Automatically updates staff supervision counts when `is_confirmed` changes

`PUT /api/allocations/{id}`→ update allocation (e.g., confirm/unconfirm, change role)

- Updates staff supervision counts if confirmation status changes

`DELETE /api/allocations/{id}`→ delete allocation

- Automatically updates staff supervision counts

### 7.4 Staff

`GET /api/staff?active=true&keyword=AI&can_be_dos=true&has_capacity_phd=true&page=1&page_size=50`
→ list staff with filters

`GET /api/staff/{id}`
→ get staff member by ID

`POST /api/staff`
→ create staff record (generates embedding automatically)

`PUT /api/staff/{id}`
→ update profile & capacity (regenerates embedding if research interests/methods change)

`DELETE /api/staff/{id}`
→ soft delete (sets `active=false`)

---

## 8. LLM Integration Strategy

LLM logic lives in `backend/shared/llm`.

### 8.1 Models & Parameters

- **Embedding model:** `text-embedding-3-small` (1536 dimensions)
- **Completion model:** `gpt-4` or `gpt-4-turbo` (or `gpt-4o-mini` for cheaper ops)
- Temperature: **0.0–0.2** for determinism
- Embedding dimensions: **1536** (fixed for database schema compatibility)

### 8.2 Key Prompts

Use `docs/prompts.md` as the formal prompt library. Core prompts:

- `PROMPT_SUMMARISE_APPLICATION` – generate structured summary.
- `PROMPT_KEYWORDS` – extract topics & methods.
- `PROMPT_MATCH_REASONING` – justify ranked supervisor suggestions.
- `PROMPT_JUSTIFICATION_ONLY` – short justification for confirmed supervisor.
- `PROMPT_CONFLICTS_AND_RISKS` – optional risk analysis.

### 8.3 Workflow Example – Summarisation

1. `applicant-service` receives raw text.
2. Calls `llm.client.summarise_application(raw_text)`
3. Client wraps the prompt and calls OpenAI API.
4. Parsed result updates `summary_text`, `topic_keywords`, `method_keywords` in DB.
5. Embedding is generated from combined summary text.

### 8.4 Workflow Example – Matching

1. `matching-service` loads application embedding and top-K closest staff from Postgres (`pgvector` search).
2. Applies deterministic filters (capacity, eligibility).
3. Calls LLM with `PROMPT_MATCH_REASONING` to transform numeric ranking + metadata into narrative explanation.
4. Stores suggested allocations with `is_suggestion = true`.

---

## 9. Frontend Design & Page Map

### 9.1 Routes

**PGRO Routes (PGR Lead / Admin Portal):**

- `/` – Landing page
- `/pgro` – Dashboard (intake overview with status breakdown)
- `/pgro/applicants` – List view, filters, batch upload, manual entry
- `/pgro/applicants/:id` – Applicant detail + matches + raw text modal + delete
- `/pgro/allocations` – Allocation board with status checkboxes + CSV export + delete
- `/pgro/allocations/:allocationId/notes` – Allocation notes page with threading/replies
- `/pgro/interview-records` – List of interview records with filters
- `/pgro/interview-records/:id` – Interview record detail view
- `/pgro/analytics` – Analytics dashboard with data visualizations and insights (topics, themes, research groups, staff capacity, acceptance rates) - **Requires SMT role**

**Admin Routes:**

- `/admin` – Admin portal
- `/admin/staff` – Staff list & capacity
- `/admin/staff/:id` – Staff profile edit + delete

**Staff Portal Routes:**

- `/staff-portal/allocations` – Staff view of their allocations
- `/staff-portal/allocations/:allocationId/notes` – Allocation notes for staff
- `/staff-portal/profile` – Staff profile editing
- `/staff-portal/review/:allocationId` – Staff review form for an allocation
- `/staff-portal/interviews` – Staff view of their interviews
- `/staff-portal/interviews/:id` – Interview form for staff

### 9.2 Key Components

**PGRO Portal Components:**

- `Layout/MainLayout` – top nav, USW-style header for PGRO routes.
- `Dashboard/Dashboard` – intake overview cards with status breakdown (New, Contacted, Accepted, Rejected).
- `Applicants/Applicants` – list view with filters, batch upload modal, manual entry modal.
- `Applicants/ApplicantCard` – applicant card with status badge.
- `Applicants/ApplicantDetail` – summary, raw text modal, matches panel, delete button.
- `Matching/MatchList` – supervisor suggestions with explanation and "Add to Allocations" button.
- `Allocations/Allocations` – allocation board with:
  - Filters (year, term, status)
  - Status update checkboxes (Contacted, Accepted, Rejected)
  - CSV export button
  - Delete buttons
  - Display of applicant/staff names and explanations
- `AllocationNotes/AllocationNotesPage` – allocation-specific notes with threading, replies, and staff notifications.
- `InterviewRecords/InterviewRecords` – list view of interview records with filters.
- `InterviewDetail/InterviewDetail` – interview record detail view.
- `Analytics/Analytics` – comprehensive analytics dashboard with panels for various metrics (SMT role required).

**Admin Portal Components:**

- `Layout/AdminLayout` – admin portal layout for staff management.
- `AdminStaff/AdminStaff` – staff list with capacity indicators.
- `AdminStaff/StaffCard` – staff card showing supervision loads.
- `AdminStaffDetail/AdminStaffDetail` – staff profile edit form, delete button.

**Staff Portal Components:**

- `Layout/StaffLayout` – staff portal layout.
- `StaffAllocations/StaffAllocations` – staff view of their allocations.
- `StaffProfile/StaffProfile` – staff profile editing page.
- `StaffReview/StaffReview` – staff review form for allocated applicants.
- `StaffInterviews/StaffInterviews` – staff view of their interviews.
- `StaffInterviewForm/StaffInterviewForm` – interview form for staff to fill out.

Use **modular, reusable components** (e.g. `Card`, `Badge`, `Button`, `TagList`, `AllocationNotes`) to keep UI consistent.

---

## 10. Environment & Configuration

### 10.1 Backend `.env` (example)

```env
DATABASE_URL=postgresql://pgr_user:password@localhost:5432/pgr_db
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4
ALLOWED_ORIGINS=http://localhost:5173
STAFF_SERVICE_URL=http://localhost:8001
APPLICANT_SERVICE_URL=http://localhost:8002
MATCHING_SERVICE_URL=http://localhost:8003
FILE_SERVICE_URL=http://localhost:8004
```

### 10.2 Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 11. Implementation Phases (Sprints)

### Sprint 1 – Foundations

- Set up monorepo structure in Cursor using this spec.
- Implement Postgres schema + migrations.
- Implement `staff-service` basic CRUD + embedding column.
- Basic React app with USW-inspired shell (header, colours).

### Sprint 2 – Applicant Ingestion

- `file-service` for upload + text extraction (start with text only).
- `applicant-service` for CRUD + summarisation.
- Applicant list and detail pages.

### Sprint 3 – Matching Engine

- `matching-service` for embeddings + similarity search.
- Initial match endpoint + UI panel showing scores (no LLM reasoning yet).

### Sprint 4 – LLM Reasoning & Allocation

- Plug in `PROMPT_MATCH_REASONING`.
- Allocation confirmation flow (DoS, co-supervisors).
- Dashboard for intake overview.

### Sprint 5 – Polish & Export

- CSV export for allocations.
- Notes, small UX improvements, capacity visualisation.
- Role-based access (auth-service simple implementation).

---

## 12. Non-Functional Requirements

- **Security:** internal only, behind USW VPN / SSO when integrated.
- **Privacy:** applications and staff data never sent to public endpoints outside agreed LLM provider.
- **Auditability:** store summaries, suggestions, and final decisions.
- **Maintainability:** code modular by service; shared logic via `backend/shared`.
- **Extensibility:** support additional programmes / schools in future without DB redesign.

---

**End of spec.**
This file should be kept under version control (e.g. `spec.md`) and updated as the system evolves.

## Maintainer

Dr. Mabrouka Abuhmida
Research & Innovation Lead
University of South Wales

**Last Updated:** November 24, 2025
