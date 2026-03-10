# Matching and Allocation Logic

## Overview

This document explains how the matching and allocation system works in the PGR Supervision Matching System. The system uses **vector similarity search** (pgvector) combined with **AI-powered explanations** to recommend suitable supervisors for PhD and MRes applicants.

### Key Components

1. **Vector Embeddings:** Both applicants and staff have embeddings (1536-dimensional vectors) generated from their research content
2. **Similarity Search:** Uses PostgreSQL's pgvector extension for fast similarity matching
3. **Filtering:** Applies eligibility, capacity, and quality filters
4. **LLM Explanations:** Generates human-readable justifications for each match
5. **Allocation Management:** Tracks supervisor assignments with status and audit trail
6. **Load Tracking:** Automatically updates supervision counts when allocations are confirmed

---

## Matching Flow

### Step 1: Find Matches (User Action)

1. Navigate to an **Applicant Detail** page
2. Click the **"Find Matches"** button
3. The system processes the request through the matching service

### Step 2: Vector Similarity Search

The matching service performs the following operations:

#### 2.1 Embedding Retrieval

- Retrieves the applicant's embedding vector (1536 dimensions)
- Validates that the embedding exists and is valid

#### 2.2 Database Query

Uses PostgreSQL with pgvector to find similar staff embeddings:

```sql
SELECT 
    id, full_name, email, role_title, school, research_group,
    can_be_dos, can_supervise_phd, can_supervise_mres,
    max_phd_supervisions, max_mres_supervisions,
    current_phd_supervisions, current_mres_supervisions,
    research_interests_text, methods_text, keywords, active,
    1 - (embedding <=> CAST(:embedding AS vector)) as match_score
FROM staff
WHERE 
    active = TRUE
    AND embedding IS NOT NULL
    AND can_supervise_{degree_type} = TRUE
    [AND can_be_dos = TRUE]  -- if require_dos = true
ORDER BY embedding <=> CAST(:embedding AS vector)
LIMIT 20
```

**Key Points:**

- `<=>` is the cosine distance operator in pgvector
- `1 - distance` converts distance to similarity score (0.0 to 1.0)
- Results are ordered by similarity (closest first)
- Default limit is 20 matches

#### 2.3 Capacity Calculation

For each match, the system calculates capacity status:

- **For PhD:** `has_capacity = current_phd_supervisions < max_phd_supervisions`
- **For MRes:** `has_capacity = current_mres_supervisions < max_mres_supervisions`
- **Status:** `"AVAILABLE"` if has capacity, `"FULL"` otherwise

### Step 3: Filtering

The system applies additional filters:

1. **Minimum Score Filter:** Removes matches below `min_score` threshold (default: 0.0)
2. **Capacity Filter:** If `require_capacity = true`, removes staff at full capacity
3. **Active Status:** Only active staff are included (already filtered in SQL)
4. **Degree Type:** Only staff who can supervise the degree type (already filtered in SQL)

### Step 4: LLM Explanation Generation

For each filtered match, the system generates a human-readable explanation:

1. **Collects Information:**

   - Applicant name, degree type, summary, topics, methods
   - Supervisor details: name, research interests, methods, match score, capacity
2. **Calls LLM:**

   - Uses `PROMPT_MATCH_REASONING` (see `prompts.md`)
   - Provides context about applicant and ranked supervisor candidates
   - Requests 2-3 sentence explanations for each match
3. **Maps Explanations:**

   - Matches LLM explanations to staff IDs
   - Handles cases where explanations are missing or malformed
   - Adds error messages if LLM fails

### Step 5: Role Suggestion

The system automatically suggests roles:

- **First eligible match with `can_be_dos = True`:** Suggested as `"DOS"` (Director of Studies)
- **All other matches:** Suggested as `"CO_SUPERVISOR"`

**Note:** Only one DOS suggestion is made per matching request.

### Step 6: Return Results

The matching service returns a list of `MatchResponse` objects:

```typescript
{
  staff_id: string;
  full_name: string;
  email: string;
  role_title: string;
  school: string;
  research_group: string;
  can_be_dos: boolean;
  research_interests: string;
  methods: string;
  keywords: string[];
  match_score: number;  // 0.0 to 1.0
  capacity_status: "AVAILABLE" | "FULL";
  role_suggestion: "DOS" | "CO_SUPERVISOR";
  explanation: string;  // 2-3 sentences from LLM
}
```

### Step 7: Display Matches

Matches appear in the **"Recommended Supervisors"** sidebar on the Applicant Detail page:

- Staff name and details
- Match score (displayed as percentage: `match_score * 100`)
- Capacity status badge
- Role suggestion badge
- LLM-generated explanation

---

## Requirements for Matching to Work

### Prerequisites

1. **Applicant must have an embedding**

- Generated automatically when applicant is created
- Based on the applicant's summary text
- Uses `text-embedding-3-small` model (1536 dimensions)

2. **Staff members must have embeddings**

- Generated when staff member is created or updated
- Based on research interests, methods, and keywords
- Uses same embedding model

3. **Staff must be active**

- `active = TRUE` in database
- Inactive staff are excluded from matching

4. **Staff must have capacity** (if `require_capacity = true`)

- For PhD: `current_phd_supervisions < max_phd_supervisions`
- For MRes: `current_mres_supervisions < max_mres_supervisions`

5. **Staff must be able to supervise the degree type**

- For PhD: `can_supervise_phd = TRUE`
- For MRes: `can_supervise_mres = TRUE`

6. **LLM Service Available** (for explanations)

- OpenAI API key must be configured
- If unavailable, matches are returned without explanations

---

## Allocation Flow

### Step 1: Create Allocation

1. After finding matches, review the recommendations
2. For each match you want to allocate, click **"Add to Allocations"**
3. The system creates an allocation record with:
   - `applicant_id`: UUID of the applicant
   - `staff_id`: UUID of the supervisor
   - `role`: "DOS", "CO_SUPERVISOR", or "ADVISOR"
   - `match_score`: Similarity score from vector search
   - `explanation`: LLM-generated explanation
   - `is_suggestion`: `true` (default)
   - `is_confirmed`: `false` (default)
   - `created_at`: Timestamp

**Important Notes:**

- Allocations are **NOT automatically created** - you must manually click "Add to Allocations"
- Allocations start as suggestions (`is_confirmed = false`)
- Multiple allocations can be created for the same applicant (e.g., DOS + Co-Supervisors)
- Unique constraint prevents duplicate allocations: `(applicant_id, staff_id, role)`

### Step 2: View Allocations

Navigate to the **Allocations** page to see all allocations.

#### Filters Available:

- **Year:** Filter by intake year (defaults to current year)
- **Term:** Filter by intake term ("FEB", "SEP", or "All")
- **Status:** Filter by confirmation status ("Confirmed", "Suggested", or "All")

#### Allocation Display:

Each allocation card shows:

- Applicant name and details
- Staff name and details
- Role badge (DOS, CO_SUPERVISOR, ADVISOR)
- Confirmation status badge
- Match score (if available)
- Explanation (if available)
- Applicant status checkboxes (NEW, SUPERVISOR_CONTACTED, ACCEPTED, REJECTED)

### Step 3: Update Allocation Status

#### Confirm Allocation

- Click the confirmation checkbox or button
- Sets `is_confirmed = true`
- Records `confirmed_at` timestamp
- Records `confirmed_by_user_id` (when authentication is implemented)
- **Triggers supervision load update** (see below)

#### Update Applicant Status

- Use checkboxes in allocation cards
- Updates the applicant's `status` field
- Status values: `NEW`, `SUPERVISOR_CONTACTED`, `ACCEPTED`, `REJECTED`, `ON_HOLD`

#### Delete Allocation

- Click delete button
- Confirmation dialog appears
- Deletes allocation record
- **Triggers supervision load update** if allocation was confirmed

---

## Supervision Load Tracking

### Automatic Updates

The system automatically updates staff supervision counts when:

1. **Allocation is created** with `is_confirmed = true`
2. **Allocation is updated** and `is_confirmed` changes from `false` to `true`
3. **Allocation is updated** and `is_confirmed` changes from `true` to `false`
4. **Allocation is deleted** and it was confirmed

### Calculation Logic

The `update_staff_supervision_counts()` function:

1. Counts confirmed allocations for the staff member:

   - **PhD count:** Number of confirmed allocations where applicant's `degree_type = 'PHD'`
   - **MRes count:** Number of confirmed allocations where applicant's `degree_type = 'MRES'`
2. Updates staff record:

   - `current_phd_supervisions = phd_count`
   - `current_mres_supervisions = mres_count`
3. **Important:** Only **confirmed** allocations (`is_confirmed = true`) are counted

### Example

If a staff member has:

- 3 confirmed PhD allocations
- 2 confirmed MRes allocations
- 1 unconfirmed PhD allocation

Then:

- `current_phd_supervisions = 3` (unconfirmed not counted)
- `current_mres_supervisions = 2`

---

## Technical Details

### Vector Similarity

**Algorithm:** Cosine Similarity

- **Distance:** `1 - cosine_similarity(applicant_embedding, staff_embedding)`
- **Score Range:** 0.0 (no similarity) to 1.0 (identical)
- **Interpretation:**
  - `0.8 - 1.0`: Excellent match
  - `0.6 - 0.8`: Good match
  - `0.4 - 0.6`: Moderate match
  - `0.0 - 0.4`: Weak match

**Embedding Model:**

- Model: `text-embedding-3-small`
- Dimensions: 1536
- Provider: OpenAI

### Matching Service Architecture

**Service:** `matching-service` (port 8003)

**Components:**

- `Matcher` class (`app/logic/matcher.py`):
  - `find_matching_staff()`: Vector similarity search
  - `apply_filters()`: Post-processing filters
  - `generate_explanations()`: LLM explanation generation

**API Endpoint:**

- `POST /match` (via API Gateway: `POST /api/matching/match`)

**Request Format:**

```json
{
  "applicant_id": "uuid",
  "applicant_name": "Full Name",
  "degree_type": "PHD" | "MRES",
  "applicant_summary": "Research summary text",
  "applicant_topics": ["topic1", "topic2", ...],
  "applicant_methods": ["method1", "method2", ...],
  "applicant_embedding": [0.123, 0.456, ...],  // 1536 numbers
  "require_dos": false,
  "min_score": 0.0,
  "require_capacity": true,
  "limit": 20
}
```

### Allocation Service Architecture

**Service:** `applicant-service` (port 8002) - handles allocations

**Endpoints:**

- `POST /allocations`: Create allocation
- `PUT /allocations/{id}`: Update allocation
- `DELETE /allocations/{id}`: Delete allocation
- `GET /allocations/intake`: Get allocations by intake

**Database Model:**

- Table: `allocation`
- Unique constraint: `(applicant_id, staff_id, role)`
- Foreign keys: `applicant_id` (CASCADE delete), `staff_id` (RESTRICT delete)

---

## Troubleshooting

### No Matches Found?

#### 1. Check Applicant Embedding

- **Symptom:** Error message about missing embedding
- **Solution:**
  - Wait a few moments and refresh the page
  - Embeddings are generated automatically when applicants are created
  - Check applicant detail page - embedding should be present
  - If missing, the applicant may need to be re-processed

#### 2. Check Staff Embeddings

- **Symptom:** No matches returned even with valid applicant
- **Solution:**
  - Go to Staff page
  - Check if staff members have the "Has Embedding" badge
  - If not, edit and save a staff member to regenerate embedding
  - Ensure staff have research interests or methods text

#### 3. Check Staff Capacity

- **Symptom:** Matches found but all show "FULL" capacity
- **Solution:**
  - Check staff supervision loads on Staff page
  - Verify `current_phd_supervisions < max_phd_supervisions` (for PhD)
  - Verify `current_mres_supervisions < max_mres_supervisions` (for MRes)
  - If `require_capacity = false`, full staff will still appear

#### 4. Check Staff Active Status

- **Symptom:** Expected staff not appearing in matches
- **Solution:**
  - Verify staff `active = TRUE` in database
  - Inactive staff are excluded from matching

#### 5. Check Degree Type Compatibility

- **Symptom:** Staff not appearing for specific degree type
- **Solution:**
  - For PhD: Verify `can_supervise_phd = TRUE`
  - For MRes: Verify `can_supervise_mres = TRUE`

#### 6. Check LLM Service

- **Symptom:** Matches found but no explanations
- **Solution:**
  - Verify `OPENAI_API_KEY` is set in environment
  - Check matching service logs for LLM errors
  - Explanations are optional - matches still work without them

### No Allocations Showing?

#### 1. Check Filters

- **Symptom:** Allocations exist but not visible
- **Solution:**
  - Check year filter (defaults to current year)
  - Check term filter (try setting to "All")
  - Check status filter (try setting to "All")
  - Verify allocations match filter criteria

#### 2. Verify Allocation Creation

- **Symptom:** "Add to Allocations" clicked but nothing appears
- **Solution:**
  - Check browser console for errors
  - Verify success message appeared
  - Check that allocation was created in database
  - Try refreshing the page

#### 3. Check Database

- **Symptom:** Allocations not persisting
- **Solution:**
  - Verify database connection
  - Check for database errors in logs
  - Verify foreign key constraints are satisfied

### Supervision Loads Not Updating?

#### 1. Check Confirmation Status

- **Symptom:** Loads not increasing after creating allocation
- **Solution:**
  - Only **confirmed** allocations count toward loads
  - Verify `is_confirmed = true` for the allocation
  - Unconfirmed allocations don't affect capacity

#### 2. Check Update Trigger

- **Symptom:** Loads not updating after confirming allocation
- **Solution:**
  - Verify `update_staff_supervision_counts()` is called
  - Check applicant service logs for errors
  - Try manually refreshing the staff page

#### 3. Check Degree Type

- **Symptom:** Wrong load counter updating
- **Solution:**
  - PhD allocations update `current_phd_supervisions`
  - MRes allocations update `current_mres_supervisions`
  - Verify applicant's `degree_type` is correct

---

## Email Notification Flow

### Supervisor Allocation Emails

Supervisor emails are sent per allocation from the **Allocations** view:

1. PGR Lead confirms or reviews an allocation.
2. Triggers `POST /allocations/{allocation_id}/send-email` (via API Gateway to applicant service).
3. Applicant service builds an email payload with:
   - Applicant name, degree type, intake term/year, status
   - Summary text and keywords (if available)
   - Allocation role (DOS, CO_SUPERVISOR, ADVISOR)
   - Supervisor name and email
4. Email service (`email-service`) sends an allocation email using a SendGrid template.
5. Allocation record is updated with:
   - `email_sent_at`: timestamp of successful send
   - `email_error` and `email_retry_count`: populated if sending fails
6. A derived field `time_to_confirmation` is calculated from `email_sent_at` to `confirmed_at` for reporting.

### Participant (Applicant) Emails

Congratulatory emails are sent to accepted applicants with confirmed supervisors CC’d:

1. Frontend checks `GET /api/applicants/{id}/can-email-participant`:
   - Applicant `status` must be `ACCEPTED`
   - Applicant must have an email address recorded
   - At least one confirmed allocation must exist
2. If `canEmail = true`, the UI enables the “Email participant” action.
3. When triggered, the gateway calls `POST /api/applicants/{id}/email-participant` on applicant service.
4. Applicant service:
   - Loads the applicant and all confirmed allocations with staff
   - Builds a `supervisory_team` list (DOS first, then Co‑Supervisors, then Advisors)
   - Collects CC emails and names for supervisors
   - Calls `email-service` `POST /email/participant` with:
     - applicant email/name
     - CC supervisor emails/names
     - structured supervisory team (name, role, email)
5. An `applicant_email_log` row is created with:
   - `applicant_id`, `sent_to_email`
   - `cc_emails`, `supervisor_names`, `supervisor_roles`
   - `email_subject`, `email_message_id` (on success)
   - `error_message` (on failure)
   - `sent_at`, `created_at`
6. Errors from the email service are captured and stored in `applicant_email_log` while returning a clear HTTP error to the UI.

---

### For PGR Leads

1. **Review All Recommendations:** Don't rely solely on the top match - review multiple options
2. **Check Capacity:** Verify staff have capacity before confirming allocations
3. **Consider Multiple Supervisors:** PhD students typically need DOS + Co-Supervisor(s)
4. **Update Status Regularly:** Keep applicant status up-to-date for accurate reporting
5. **Use Explanations:** Read LLM explanations to understand match reasoning

### For System Administrators

1. **Maintain Staff Profiles:** Keep research interests and methods up-to-date
2. **Update Capacity Limits:** Adjust `max_phd_supervisions` and `max_mres_supervisions` as needed
3. **Monitor Embeddings:** Ensure all staff have embeddings generated
4. **Review Loads:** Regularly check supervision loads for balance
5. **Audit Allocations:** Use the audit trail to track decision history

---

## Related Documentation

- **Prompts:** `prompts.md` - LLM prompt library
- **Database Schema:** `database_schema.md` - Data model details
- **Technical Spec:** `docs/spec.md` - System architecture
- **API Reference:** `docs/api_reference.md` - API documentation

---

# **Maintainer**

Dr. Mabrouka Abuhmida
Research & Innovation Lead
University of South Wales

**Last Updated:** 21/11/2025
