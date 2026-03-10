# Database Schema for PGR Supervision Matching System

**PostgreSQL + pgvector Architecture**

---

## Entity Relationship Diagram

![1765470790353](image/database_schema/1765470790353.png)

---

## 0. Extensions & Enums

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE degree_type_enum AS ENUM ('PHD', 'MRES');

CREATE TYPE applicant_status_enum AS ENUM (
    'NEW',
    'UNDER_REVIEW',
    'SUPERVISOR_CONTACTED',
    'ACCEPTED',
    'REJECTED',
    'ON_HOLD'
);

CREATE TYPE allocation_role_enum AS ENUM (
    'DOS',
    'CO_SUPERVISOR',
    'ADVISOR'
);

CREATE TYPE user_role_enum AS ENUM (
    'ADMIN',
    'PGR_LEAD',
    'STAFF',
    'VIEW_ONLY',
    'SMT'
);

CREATE TYPE interview_status_enum AS ENUM (
    'IN_PROCESS',
    'COMPLETED'
);
```

---

## 1. Users Table

```sql
CREATE TABLE app_user (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           CITEXT UNIQUE NOT NULL,
    full_name       TEXT NOT NULL,
    role            user_role_enum NOT NULL DEFAULT 'VIEW_ONLY',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_user_role ON app_user(role);
```

---

## 2. Staff Table

```sql
CREATE TABLE staff (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name                   TEXT NOT NULL,
    email                       CITEXT UNIQUE NOT NULL,
    role_title                  TEXT,
    school                      TEXT,
    research_group              TEXT,
    can_be_dos                  BOOLEAN NOT NULL DEFAULT FALSE,
    can_supervise_phd           BOOLEAN NOT NULL DEFAULT TRUE,
    can_supervise_mres          BOOLEAN NOT NULL DEFAULT TRUE,
    max_phd_supervisions        SMALLINT NOT NULL DEFAULT 0,
    max_mres_supervisions       SMALLINT NOT NULL DEFAULT 0,
    current_phd_supervisions    SMALLINT NOT NULL DEFAULT 0,
    current_mres_supervisions   SMALLINT NOT NULL DEFAULT 0,
    research_interests_text     TEXT,
    methods_text                TEXT,
    keywords                    TEXT[],
    excluded_topics_text        TEXT,
    embedding                   VECTOR(1536),
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_active ON staff(active);
CREATE INDEX idx_staff_keywords_gin ON staff USING GIN (keywords);
CREATE INDEX idx_staff_embedding_ivfflat
ON staff USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);
```

---

## 3. Applicants Table

```sql
CREATE TABLE applicant (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name               TEXT NOT NULL,
    email                   CITEXT,
    degree_type             degree_type_enum NOT NULL,
    intake_term             TEXT,
    intake_year             SMALLINT,
    raw_application_text    TEXT NOT NULL,
    summary_text            TEXT,
    summary_last_updated_at TIMESTAMPTZ,
    topic_keywords          TEXT[],
    method_keywords         TEXT[],
    primary_theme           TEXT,
    secondary_theme         TEXT,
    status                  applicant_status_enum NOT NULL DEFAULT 'NEW',
    priority_score          NUMERIC(5,2),
    ai_detection_probability NUMERIC(5,2),
    quality_rationale       TEXT,
    embedding               VECTOR(1536),
    created_by_user_id      UUID REFERENCES app_user(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applicant_status ON applicant(status);
CREATE INDEX idx_applicant_degree_intake ON applicant(degree_type, intake_year, intake_term);
CREATE INDEX idx_applicant_topic_keywords_gin ON applicant USING GIN (topic_keywords);
CREATE INDEX idx_applicant_priority_score ON applicant(priority_score);
CREATE INDEX idx_applicant_embedding_ivfflat
ON applicant USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);
```

---

## 4. Applicant Documents Table

```sql
CREATE TABLE applicant_document (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id    UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    storage_path    TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    file_size_bytes BIGINT,
    document_type   VARCHAR(50) NOT NULL DEFAULT 'PROPOSAL',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_document_type CHECK (document_type IN ('PROPOSAL', 'CV', 'APPLICATION_FORM', 'TRANSCRIPT'))
);

CREATE INDEX idx_applicant_document_applicant_id 
ON applicant_document(applicant_id);
CREATE INDEX idx_applicant_document_type 
ON applicant_document(document_type);
```

---

## 5. Allocations Table

```sql
CREATE TABLE allocation (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id            UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    staff_id                UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    role                    allocation_role_enum NOT NULL,
    match_score             NUMERIC(5,4),
    explanation             TEXT,
    is_suggestion           BOOLEAN NOT NULL DEFAULT TRUE,
    is_confirmed            BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at            TIMESTAMPTZ,
    confirmed_by_user_id    UUID REFERENCES app_user(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_allocation_unique_role_per_applicant_staff
        UNIQUE (applicant_id, staff_id, role)
);

CREATE INDEX idx_allocation_applicant ON allocation(applicant_id);
CREATE INDEX idx_allocation_staff ON allocation(staff_id);
CREATE INDEX idx_allocation_confirmed ON allocation(is_confirmed);
```

---

## 6. Applicant Notes Table

```sql
CREATE TABLE applicant_note (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    allocation_id       UUID REFERENCES allocation(id) ON DELETE CASCADE,
    parent_note_id      UUID REFERENCES applicant_note(id) ON DELETE CASCADE,
    author_user_id      UUID NOT NULL REFERENCES app_user(id),
    note_text           TEXT NOT NULL,
    is_sent_to_staff    BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at             TIMESTAMPTZ,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_applicant_note_applicant_id 
ON applicant_note(applicant_id);
CREATE INDEX idx_note_allocation 
ON applicant_note(allocation_id);
CREATE INDEX idx_note_parent 
ON applicant_note(parent_note_id);
CREATE INDEX idx_note_sent_to_staff 
ON applicant_note(is_sent_to_staff);
```

**Notes:**

- `allocation_id` is nullable to support both applicant-level and allocation-specific notes
- `parent_note_id` enables threaded conversations (replies to notes)
- `is_sent_to_staff` and `sent_at` track if/when note was sent as notification
- `is_deleted` enables soft delete functionality
- `updated_at` tracks when a note was last edited

---

## 7. Applicant Profile Table

```sql
CREATE TABLE applicant_profile (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id            UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    date_of_birth           DATE,
    nationality             TEXT,
    country_of_residence    TEXT,
    phone_number            TEXT,
    address                 TEXT,
    how_heard_about_usw    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE applicant_profile
    ADD CONSTRAINT uq_applicant_profile_applicant
    UNIQUE (applicant_id);
```

---

## 8. Applicant Degree Table

```sql
CREATE TABLE applicant_degree (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    degree_type         TEXT NOT NULL,
    subject_area        TEXT,
    university          TEXT,
    university_country  TEXT,
    classification      TEXT,
    year_completed      SMALLINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applicant_degree_applicant 
ON applicant_degree(applicant_id);
```

---

## 9. Applicant Email Log Table

```sql
CREATE TABLE applicant_email_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_to_email       CITEXT NOT NULL,
    cc_emails           CITEXT[] NOT NULL,
    supervisor_names    TEXT[] NOT NULL,
    supervisor_roles    TEXT[] NOT NULL,
    email_subject       TEXT,
    email_message_id    TEXT,
    error_message       TEXT,
    created_by_user_id  UUID REFERENCES app_user(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applicant_email_log_applicant 
ON applicant_email_log(applicant_id);

CREATE INDEX idx_applicant_email_log_sent_at 
ON applicant_email_log(sent_at);
```

---

## 10. Staff Review Table

```sql
CREATE TABLE staff_review (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id                   UUID NOT NULL REFERENCES allocation(id) ON DELETE CASCADE,
    staff_id                        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    applicant_id                   UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
    decision                        TEXT,
    reviewer_name                   TEXT,
    applicant_name_review           TEXT,
    review_date                     DATE,
    research_question_acceptable    BOOLEAN,
    research_framework_acceptable   BOOLEAN,
    writing_structure_acceptable    BOOLEAN,
    contribution_to_field           BOOLEAN,
    recommend_for_supervision       BOOLEAN,
    prepared_to_supervise           BOOLEAN,
    sufficient_ethics               BOOLEAN,
    suggested_supervisors           TEXT,
    overseas_research_risk           BOOLEAN,
    reputational_risk                BOOLEAN,
    risk_matrix_completed           BOOLEAN,
    recommendation                  TEXT,
    reasons_summary                 TEXT,
    comments_to_applicant           TEXT,
    date_returned_to_graduate_school DATE,
    research_quality_score         TEXT,
    research_quality_comments       TEXT,
    methodology_score               TEXT,
    methodology_comments            TEXT,
    feasibility_score               TEXT,
    feasibility_comments            TEXT,
    originality_score               TEXT,
    originality_comments             TEXT,
    alignment_with_supervisor_expertise TEXT,
    applicant_background_score      TEXT,
    applicant_background_comments    TEXT,
    overall_assessment              TEXT,
    strengths                        TEXT,
    weaknesses                       TEXT,
    recommendations                  TEXT,
    additional_comments              TEXT,
    ai_critical_review               TEXT,
    ai_review_generated_at           TIMESTAMPTZ,
    is_submitted                     BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at                     TIMESTAMPTZ,
    created_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_review_allocation ON staff_review(allocation_id);
CREATE INDEX idx_staff_review_staff ON staff_review(staff_id);
CREATE INDEX idx_staff_review_applicant ON staff_review(applicant_id);
CREATE INDEX idx_staff_review_submitted ON staff_review(is_submitted);
```

---

## 11. Interview Record Table

```sql
CREATE TABLE interview_record (
    id                                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id                       UUID NOT NULL REFERENCES allocation(id) ON DELETE CASCADE,
    staff_id                            UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    applicant_id                        UUID NOT NULL REFERENCES applicant(id) ON DELETE CASCADE,
  
    -- Status
    status                              interview_status_enum NOT NULL DEFAULT 'IN_PROCESS',
  
    -- Interview form header fields
    interviewer_name                    TEXT,
    applicant_name_interview            TEXT,
    interview_date                      DATE,
    interview_location                  TEXT,
  
    -- Applicant Background
    educational_background              TEXT,
    work_experience                     TEXT,
    research_experience                 TEXT,
  
    -- Research Proposal Discussion
    research_topic_clarity              TEXT,
    research_objectives_understanding   TEXT,
    methodology_knowledge               TEXT,
    literature_awareness                TEXT,
  
    -- Motivation and Commitment
    motivation_for_research             TEXT,
    understanding_of_phd_demands        BOOLEAN,
    time_commitment_feasibility         TEXT,
  
    -- Skills Assessment
    analytical_skills                   TEXT,
    writing_communication_skills        TEXT,
    critical_thinking                   TEXT,
    technical_skills                    TEXT,
  
    -- Supervision and Support
    expectations_from_supervision       TEXT,
    working_style_preference            TEXT,
    support_needs                       TEXT,
  
    -- Overall Assessment
    strengths_observed                  TEXT,
    areas_of_concern                    TEXT,
    overall_impression                  TEXT,
    recommendation                      TEXT,
    additional_notes                    TEXT,
  
    -- Submission tracking
    is_submitted                        BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at                        TIMESTAMPTZ,
  
    -- Timestamps
    created_at                          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_record_allocation ON interview_record(allocation_id);
CREATE INDEX idx_interview_record_staff ON interview_record(staff_id);
CREATE INDEX idx_interview_record_applicant ON interview_record(applicant_id);
CREATE INDEX idx_interview_record_status ON interview_record(status);
CREATE INDEX idx_interview_record_submitted ON interview_record(is_submitted);
```

**Notes:**

- Interview records are tied to allocations (supervisor-applicant pairs)
- Used for recording detailed interview assessments after applicants are accepted
- Status tracks whether interview is in progress or completed
- Rich set of fields for comprehensive applicant assessment

---

## 12. Supervision Load Events

```sql
CREATE TABLE supervision_load_event (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id            UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    applicant_id        UUID REFERENCES applicant(id) ON DELETE SET NULL,
    event_type          TEXT NOT NULL,
    degree_type         degree_type_enum,
    role                allocation_role_enum,
    delta               SMALLINT NOT NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id  UUID REFERENCES app_user(id)
);

CREATE INDEX idx_supervision_load_staff ON supervision_load_event(staff_id);
```

---

## 13. Seed Admin User

```sql
INSERT INTO app_user (email, full_name, role)
VALUES ('mabrouka.abuhmida@usw.ac.uk', 'Dr Mabrouka Abuhmida', 'ADMIN');
```

**End of Schema**

---

## Maintainer

Dr. Mabrouka Abuhmida
Research & Innovation Lead
University of South Wales

**Last Updated:** November 24, 2025

<style>#mermaid-1765470775045{font-family:sans-serif;font-size:16px;fill:#333;}#mermaid-1765470775045 .error-icon{fill:#552222;}#mermaid-1765470775045 .error-text{fill:#552222;stroke:#552222;}#mermaid-1765470775045 .edge-thickness-normal{stroke-width:2px;}#mermaid-1765470775045 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1765470775045 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1765470775045 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1765470775045 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1765470775045 .marker{fill:#333333;}#mermaid-1765470775045 .marker.cross{stroke:#333333;}#mermaid-1765470775045 svg{font-family:sans-serif;font-size:16px;}#mermaid-1765470775045 .label{font-family:sans-serif;color:#333;}#mermaid-1765470775045 .label text{fill:#333;}#mermaid-1765470775045 .node rect,#mermaid-1765470775045 .node circle,#mermaid-1765470775045 .node ellipse,#mermaid-1765470775045 .node polygon,#mermaid-1765470775045 .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-1765470775045 .node .label{text-align:center;}#mermaid-1765470775045 .node.clickable{cursor:pointer;}#mermaid-1765470775045 .arrowheadPath{fill:#333333;}#mermaid-1765470775045 .edgePath .path{stroke:#333333;stroke-width:1.5px;}#mermaid-1765470775045 .flowchart-link{stroke:#333333;fill:none;}#mermaid-1765470775045 .edgeLabel{background-color:#e8e8e8;text-align:center;}#mermaid-1765470775045 .edgeLabel rect{opacity:0.5;background-color:#e8e8e8;fill:#e8e8e8;}#mermaid-1765470775045 .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-1765470775045 .cluster text{fill:#333;}#mermaid-1765470775045 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:sans-serif;font-size:12px;background:hsl(80,100%,96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1765470775045:root{--mermaid-font-family:sans-serif;}#mermaid-1765470775045:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1765470775045 flowchart{fill:apa;}</style>
