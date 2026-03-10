# PGRO Matching System - Project Peer Review

**Date:** December 14, 2025  
**Classification:** System Audit and Review Report  
**Status:** POC/MVP Assessment

---

## 1. Executive Summary

This peer review evaluates the PGRO Matching System, a microservices-based application for managing postgraduate research applicant-supervisor matching. The system comprises 7 services (API Gateway, Applicant Service, Staff Service, Matching Service, Email Service, File Service, and Auth Service) built with FastAPI, React/TypeScript frontend, PostgreSQL with pgvector, and Redis caching.

### Production Readiness Assessment

The system successfully demonstrates core business logic including LLM-powered application summarization, vector similarity matching for supervisor recommendations, and workflow management. The current implementation is well-suited for demonstration and proof-of-concept purposes. To prepare for production deployment, several areas related to security, testing, and infrastructure would benefit from further development.

---

## 2. Strengths

The following positive aspects were identified:

### Architecture & Design
- Clean microservices architecture with 7 well-separated services
- Modern technology stack: FastAPI, React/TypeScript, PostgreSQL, pgvector, Redis
- Good separation of concerns with distinct service responsibilities

### Database & Data Layer
- Effective pgvector integration for vector embeddings and supervisor matching
- Sensible schema design with proper foreign key relationships
- Database connection pooling configured and functional

### AI/LLM Integration
- Well-designed abstraction layer for OpenAI API
- LLM response caching to reduce API costs and latency
- Text summarization and embedding generation pipeline implemented

### Caching & Configuration
- Redis caching strategy with TTL management
- Cache invalidation patterns present
- Centralized settings via Pydantic BaseSettings
- Basic health endpoints exist for services

### Documentation
- Comprehensive documentation suite including executive overview, tech spec, prompts library, workflow docs

---

## 3. Findings

### 3.1 Correctness

#### COR-001: Duplicate Function Definitions in Email Service

**Severity:** High

**Location:** `backend/services/email-service/app/services/sendgrid_client.py`

**Details:**  
The `send_email` function is defined **6 times** in the same file, and `send_interview_invitation_email` is defined **3 times**. Python will use the last definition; earlier definitions are dead code. This indicates significant code management issues and suggests copy-paste development practices without proper refactoring.

**Affected Functions:**
- `send_email` - defined 6 times (lines ~84, ~139, ~211, ~285, ~360, ~449)
- `send_interview_invitation_email` - defined 3 times (lines ~174, ~320, ~394)

**Recommendation:**  
- Remove all duplicate function definitions; keep only one instance of each function
- Consider using linting tools that detect such issues

---

#### COR-002: Duplicate Route Definition

**Severity:** High

**Location:** `backend/services/email-service/app/routers/email.py`

**Details:**  
The `/allocation-note` POST endpoint is defined twice at approximately lines 62 and 300+. FastAPI will use the first definition; the second is unreachable dead code.

**Recommendation:**  
Remove the duplicate route definition.

---

#### COR-003: Frontend/Backend Type Mismatch - IntakeSummary

**Severity:** Medium

**Location:** `frontend/src/types/index.ts`, `backend/services/applicant-service/app/main.py`

**Details:**  
Frontend `IntakeSummary` type includes fields `under_review` and `on_hold` that are not returned by the backend response.

**Recommendation:**  
Align frontend types with backend response or add missing fields to backend.

---

#### COR-004: Frontend/Backend Type Mismatch - Capacity Status

**Severity:** Medium

**Location:** `frontend/src/types/index.ts`

**Details:**  
Frontend type is more restrictive than backend:
- Frontend: `capacity_status: 'AVAILABLE' | 'FULL'` (2 options)
- Backend returns: `'AVAILABLE' | 'FULL' | 'OVER_CAPACITY' | 'NO_CAPACITY_SET'` (4 options)

**Recommendation:**  
Update frontend types to handle all possible backend values.

---

#### COR-005: Missing Document Type in Frontend

**Severity:** Low

**Location:** `frontend/src/types/index.ts`

**Details:**  
No `Document` or `ApplicantDocument` TypeScript interface defined, but document operations exist in frontend services.

**Recommendation:**  
Add document type definitions to frontend types.

---

#### COR-006: Duplicate Import Statement

**Severity:** Low

**Location:** `backend/services/applicant-service/app/main.py`

**Details:**  
Duplicate import of `settings` from `backend.shared.config.settings`.

**Recommendation:**  
Remove duplicate import statement.

---

### 3.2 Performance

#### PERF-001: Synchronous LLM Calls Block Requests

**Severity:** Medium

**Location:** `backend/shared/llm/client.py`, applicant and matching services

**Details:**  
LLM summarization operations block HTTP request threads for 5-10 seconds per call during:
- Application text summarization
- Match explanation generation

**Impact:**
- Thread/connection exhaustion under load
- Timeout risks
- Poor user experience

**Recommendation:**  
Move LLM operations to background tasks using Celery or FastAPI BackgroundTasks.

---

### 3.3 Reliability

#### REL-001: No Circuit Breaker for External Services

**Severity:** Medium

**Location:** `backend/shared/llm/client.py`, email service

**Details:**  
Direct calls to external services (OpenAI, SendGrid) without circuit breaker protection. If external services fail or become slow, entire request chain fails with no graceful degradation.

**Recommendation:**  
Implement circuit breaker pattern using `circuitbreaker` library.

---

#### REL-002: Hardcoded Service URLs

**Severity:** High

**Location:** `backend/shared/config/settings.py`

**Details:**  
All service URLs hardcoded:
```python
staff_service_url: str = "http://localhost:8001"
applicant_service_url: str = "http://localhost:8002"
matching_service_url: str = "http://localhost:8003"
file_service_url: str = "http://localhost:8004"
auth_service_url: str = "http://localhost:8005"
email_service_url: str = "http://localhost:8006"
```

Cannot deploy services to different hosts/containers without code changes.

**Recommendation:**  
- Use environment variables for all service URLs
- Consider service discovery for production

---

#### REL-003: Hardcoded Frontend URL in Backend

**Severity:** High

**Location:** `backend/services/email-service/app/routers/email.py`, `backend/services/applicant-service/app/main.py`, `backend/shared/config/settings.py`, `.env` files

**Details:**  
Frontend URL `http://localhost:5173` is hardcoded in **11 locations** across the backend, including:

**Affected Locations:**
- `backend/services/applicant-service/app/main.py` - 4 instances as fallback values
- `backend/services/email-service/app/routers/email.py` - 3 instances in docstrings/examples
- `backend/shared/config/settings.py` - 2 instances as default values
- `backend/services/applicant-service/app/.env` - 1 instance
- `backend/shared/db/models/.env` - 1 instance

**Impact:**
- Emails sent to users will contain localhost URLs that are unreachable in production
- Service-to-service communication references may fail in deployed environments
- No centralized configuration for frontend URL

**Recommendation:**  
- Create a dedicated `FRONTEND_URL` environment variable
- Add `frontend_url` to Settings class with no default value for production
- Remove all hardcoded localhost references as fallbacks
- Inject the proper URL per environment (development, staging, production)

---

#### REL-004: No Graceful Shutdown Handling

**Severity:** Low

**Location:** All services

**Details:**  
Services lack signal handling for graceful shutdown (SIGTERM, SIGINT). In-flight requests may be dropped during deployment or scaling.

**Recommendation:**  
Add signal handlers to allow completion of in-flight requests before shutdown.

---

### 3.4 Maintainability

#### MAINT-001: Monolithic Applicant Service File

**Severity:** Medium

**Location:** `backend/services/applicant-service/app/main.py`

**Details:**  
File contains **4,773 lines** with all endpoints in a single file, contrasting with other services that use router separation. This significantly impacts code maintainability, makes code review difficult, and increases the risk of merge conflicts during collaborative development.

**Affected Areas (estimated breakdown):**
- Applicant CRUD operations: ~800 lines
- Allocation management: ~1,200 lines
- Allocation notes: ~600 lines
- Analytics endpoints: ~500 lines
- Staff reviews: ~400 lines
- Interview records: ~500 lines
- Helper functions and utilities: ~773 lines

**Recommendation:**  
Split into multiple router files: applicants, allocations, allocation_notes, analytics, staff_reviews, interview_records. Each router should be in a separate file under `app/routers/` directory.

---

#### MAINT-002: Inconsistent Request Body Typing

**Severity:** Medium

**Location:** Multiple services

**Details:**  
Mixed patterns for request body handling:
- Some endpoints use typed Pydantic models (staff-service)
- Some endpoints use `dict = Body(...)` (applicant-service, API gateway)
- Email service uses `Dict[str, Any]`

Untyped dict bodies bypass Pydantic validation benefits.

**Recommendation:**  
Create Pydantic models for all request bodies.

---

#### MAINT-003: Inconsistent Error Handling Patterns

**Severity:** Medium

**Location:** Multiple services

**Details:**  
Different error handling approaches across services:
- Pattern 1: Explicit `db.rollback()` in except block
- Pattern 2: No rollback (relies on session cleanup)
- Pattern 3: Partial rollback (only for non-HTTP exceptions)

**Recommendation:**  
Standardize error handling with consistent rollback policy.

---

#### MAINT-004: Inconsistent Model-to-Dict Conversion

**Severity:** Low

**Location:** Various services

**Details:**  
Multiple patterns for converting SQLAlchemy models to dictionaries: manual dict construction, dict comprehension with `__dict__`, dedicated `item_to_dict()` functions.

**Recommendation:**  
Create consistent serialization patterns using Pydantic `model_validate`.

---

#### MAINT-005: Missing Return Type Annotations

**Severity:** Low

**Location:** Multiple services

**Details:**  
Inconsistent return type annotations across functions. Some functions have annotations, others do not:

```python
# Has return type
async def get_applicant(applicant_id: UUID, db: Session = Depends(get_db)) -> dict:
    ...

# Missing return type
async def create_applicant(applicant_data: dict = Body(...), db: Session = Depends(get_db)):
    ...

# Missing return type
def item_to_dict(applicant: Applicant):
    ...
```

**Recommendation:**  
Add return type annotations to all public functions and endpoint handlers.

---

#### MAINT-006: Inconsistent Parameter Conversion in Gateway

**Severity:** Low

**Location:** `backend/services/api-gateway/app/routers/`

**Details:**  
Different patterns for handling UUID parameters in gateway routers (`allocations.py` uses dict comprehension, `interview_records.py` uses conditional addition).

**Recommendation:**  
Standardize parameter handling pattern across all gateway routers.

---

#### MAINT-007: Inconsistent Cache Key Format

**Severity:** Low

**Location:** Cache-related files

**Details:**  
Different cache key formats: `applicant:{id}`, `applicants:list:{year}:{term}:{status}...`, `llm:summary:{model}:{hash}`.

**Recommendation:**  
Define and document a clear cache key naming convention.

---

#### MAINT-008: Missing Repository/Service Layer Pattern

**Severity:** Medium

**Location:** All services

**Details:**  
Database queries and business logic are embedded directly in route handlers. No separation between data access layer, business logic layer, and HTTP handling layer.

**Recommendation:**  
Implement repository pattern for data access and service layer for business logic.

---

#### MAINT-009: No Code Style Enforcement

**Severity:** Low

**Location:** Repository root

**Details:**  
No linting or formatting configuration: no `pyproject.toml` with tool configurations, no `.pre-commit-config.yaml`, no ruff/black/isort configuration.

**Recommendation:**  
Add code style enforcement with pre-commit hooks.

---

#### MAINT-010: Missing Docstrings

**Severity:** Low

**Location:** Multiple services

**Details:**  
Most functions lack comprehensive docstrings:
- No Google or NumPy style docstrings
- Missing parameter descriptions
- Missing return value documentation
- Missing exception documentation

Industry standard is to have docstrings for all public functions and classes.

**Recommendation:**  
Add Google or NumPy style docstrings to all public functions, classes, and modules.

---

#### MAINT-011: No Dependency Injection Container

**Severity:** Low

**Location:** All services

**Details:**  
Dependencies are created ad-hoc using FastAPI's `Depends()`:
- No centralized dependency management
- Difficult to swap implementations for testing
- No clear dependency graph

Industry standard recommends using DI containers (e.g., `dependency-injector`) for complex applications.

**Recommendation:**  
Consider implementing a dependency injection container for centralized dependency management.

---

### 3.5 Testing

#### TEST-001: Zero Automated Test Coverage

**Severity:** Critical

**Location:** `backend/tests/`

**Details:**  
`backend/tests/` contains only `.gitkeep` file. There are no unit tests, no integration tests, no end-to-end tests, and 0% code coverage. Industry standard is 70-80% minimum coverage for production systems.

**Recommendation:**  
Implement comprehensive test suite with unit tests for business logic, integration tests for API endpoints, and end-to-end tests for workflows. Target minimum 60-70% coverage.

---

### 3.6 Documentation

#### DOC-001: No API Documentation Customization

**Severity:** Low

**Location:** All services

**Details:**  
OpenAPI documentation is auto-generated but lacks detailed endpoint descriptions, request/response examples, error response documentation, and authentication requirements.

**Recommendation:**  
Enhance FastAPI endpoint decorators with comprehensive documentation.

---

#### DOC-002: No API Versioning

**Severity:** Medium

**Location:** API Gateway

**Details:**  
API endpoints have no versioning scheme (current: `/applicants`, `/staff`). Breaking changes affect all clients immediately with no deprecation path.

**Recommendation:**  
Implement URL path versioning: `/api/v1/applicants`.

---

### 3.7 Observability

#### OBS-001: No Request Tracing / Correlation IDs

**Severity:** Medium

**Location:** All services

**Details:**  
No request tracing across services: no `X-Request-ID` header propagation, no correlation IDs in logs. Cannot trace requests through microservices.

**Recommendation:**  
Add middleware to generate and propagate correlation IDs.

---

#### OBS-002: Inconsistent Logging Format

**Severity:** Low

**Location:** Multiple services

**Details:**  
Different logging patterns: f-string format, emoji format (`✅`), semi-structured format.

**Recommendation:**  
Implement structured JSON logging for production.

---

#### OBS-003: Basic Health Checks Only

**Severity:** Low

**Location:** All services

**Details:**  
Current health endpoints provide basic status. Missing Kubernetes-compatible probes: liveness, readiness, startup.

**Recommendation:**  
Implement separate `/health/live`, `/health/ready`, `/health/startup` endpoints.

---

#### OBS-004: No Metrics Collection

**Severity:** Low

**Location:** All services

**Details:**  
No Prometheus metrics or similar observability instrumentation: no request latency metrics, no error rate tracking, no business metrics.

**Recommendation:**  
Add Prometheus metrics instrumentation.

---

### 3.8 Architecture / Design

#### ARCH-001: No CI/CD Pipeline

**Severity:** Critical

**Location:** Repository root

**Details:**  
No CI/CD configuration: no `.github/workflows/`, no `Jenkinsfile`, no `gitlab-ci.yml`. Deployments are manual with no quality gates.

**Recommendation:**  
Create CI pipeline with linting, type checking, unit tests, integration tests, and dependency vulnerability scanning.

---

#### ARCH-002: No Containerization

**Severity:** Critical

**Location:** Repository root

**Details:**  
No container configuration: no `Dockerfile` for any service, no `docker-compose.yml` for local development, no Kubernetes manifests. Cannot deploy to modern container platforms.

**Recommendation:**  
Create Dockerfiles for all services and docker-compose for local development.

---

#### ARCH-003: No Dependency Management Files

**Severity:** Critical

**Location:** Repository root

**Details:**  
No `requirements.txt`, `pyproject.toml`, or `poetry.lock` found. Cannot reproduce builds reliably, no version pinning, cannot audit dependencies for CVEs, new developers cannot set up environment.

**Recommendation:**  
Create `requirements.txt` for each service with pinned versions.

---

#### ARCH-004: No Database Migrations

**Severity:** Medium

**Location:** Repository root

**Details:**  
No Alembic migrations folder found. Documentation mentions `infra/migrations/` but the directory does not exist. Schema changes require manual intervention with no rollback capability.

**Recommendation:**  
Set up Alembic with version-controlled migrations.

---

#### ARCH-005: Datetime Handling Inconsistency

**Severity:** Low

**Location:** Multiple files

**Details:**  
Different datetime approaches: `datetime.now(timezone.utc)` (correct), `datetime.utcnow()` (deprecated in Python 3.12), `datetime.now()` without timezone (ambiguous).

**Recommendation:**  
Consistently use `datetime.now(timezone.utc)` throughout codebase.

---

#### ARCH-006: Hardcoded Magic Numbers

**Severity:** Low

**Location:** Various files

**Details:**  
Magic numbers and strings hardcoded: embedding dimension check `if len(embedding) != 1536`, email domain `"noreply@usw.ac.uk"`.

**Recommendation:**  
Move magic numbers and strings to configuration settings.

---

#### ARCH-007: Verbose Error Messages

**Severity:** Low

**Location:** Various services

**Details:**  
Error messages include detailed debugging information that should not be exposed to clients in production:
```python
raise HTTPException(status_code=500, detail=f"Database error: {str(e)}. Check DATABASE_URL configuration.")
```

**Recommendation:**  
Adjust error verbosity based on environment. Log full details server-side; return generic messages to client in production.

---

### 3.9 Security

#### SEC-001: API Key Committed to Repository

**Severity:** Critical  

**Location:** `backend/services/applicant-service/app/.env`, `backend/shared/db/models/.env`

**Details:**
OpenAI API key is stored in plaintext in `.env` files that are checked into the repository. The key format `sk-proj-mcOeO2...` is visible in committed files.

**Impact:**
- Anyone with repo access can use this API key
- Key may already be compromised if repo was ever public
- OpenAI charges accrue to key owner

**Recommendation:**  
- Rotate the API key immediately via OpenAI dashboard
- Add `.env*` to `.gitignore`
- Remove from git history using `git filter-branch` or BFG Repo Cleaner
- Use secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)

---

#### SEC-002: No Authentication Implementation

**Severity:** Critical  

**Location:** `backend/services/api-gateway/app/dependencies.py`, `frontend/src/pages/Landing/Landing.tsx`

**Details:**
Backend returns hardcoded users regardless of input:
```python
async def get_current_user(...):
    return {"user_id": "default-user", "role": "PGR_LEAD"}  # HARDCODED

async def require_smt_role(...):
    return {"user_id": "demo-smt-user", "role": "SMT"}  # HARDCODED ADMIN
```

Frontend sets user role via localStorage click handlers with no server validation. Auth Service (`backend/services/auth-service/app/main.py`) is an empty stub with only 2 lines.

**Impact:**
- Users can access different roles without server validation
- User activity is not tracked
- Data access is not restricted based on authentication
- Personal data handling may not meet GDPR requirements

**Recommendation:**  
- Implement auth-service with JWT or integrate with SSO/LDAP
- Add authentication middleware to API gateway
- Remove all hardcoded user/role returns
- Server-side session management or signed JWT tokens

---

#### SEC-003: Database Credentials in Source Code

**Severity:** Critical

**Location:** `backend/shared/config/settings.py`

**Details:**  
Default database URL with credentials hardcoded:
```python
database_url: str = "postgresql://postgres:admin@localhost:5432/pgr_db"
```

**Recommendation:**  
- Remove default value; require explicit configuration
- Use environment variable injection with no fallback
- Use secrets management for production credentials

---

#### SEC-004: Hardcoded User Identities

**Severity:** High

**Location:** `backend/services/applicant-service/app/main.py` (lines 1144, 1288, 1390, 1486), `frontend/src/pages/Landing/Landing.tsx` (lines 27-32)

**Details:**  
Specific user identity "mabrouka-staff" hardcoded in multiple locations. The system derives email addresses based on this hardcoded identity:
```python
if author_user_id_str == "mabrouka-staff":
    derived_email = "mabrouka.abuhmida@usw.ac.uk"
```

**Recommendation:**  
- Remove all hardcoded user references
- Implement proper `app_user` table usage
- Map users via authenticated identity

---

#### SEC-005: Missing Security Headers

**Severity:** Medium

**Location:** `backend/services/api-gateway/app/main.py`

**Details:**  
API Gateway does not add standard security headers:
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)

**Recommendation:**  
Add security headers middleware to API Gateway:
```python
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
```

---

#### SEC-006: No Rate Limiting

**Severity:** Medium

**Location:** All services

**Details:**  
No rate limiting on any endpoint, including expensive operations:
- LLM API calls (5-10 second operations)
- Email sending via SendGrid
- File uploads

**Impact:**
- Single user can exhaust OpenAI quota
- DoS vulnerability
- Runaway costs

**Recommendation:**  
Implement rate limiting using `slowapi` or similar library.

---

#### SEC-007: Debug Endpoints Exposed

**Severity:** Medium

**Location:** Various services

**Details:**  
Debug and diagnostic endpoints are publicly accessible:
- `/health/db-pool` - Database pool status
- `/health/query-stats` - Query profiling data
- `/debug/allocation/{id}` - Allocation debug info
- `/test-db` - Database connectivity test

**Recommendation:**  
- Require authentication for debug endpoints
- Disable in production via environment flag

---

#### SEC-008: File Upload Security Gaps

**Severity:** Medium

**Location:** `backend/services/file-service/app/routers/files.py`, `file_storage.py`

**Details:**  
File upload handling lacks:
- File size limits (no max upload size enforced)
- MIME type content validation (header only, not content)
- Path traversal protection (storage path validation)

**Recommendation:**  
- Add configurable `MAX_FILE_SIZE`
- Validate file content with `python-magic` library
- Ensure storage paths stay within base directory

---

#### SEC-009: No GDPR Compliance Features

**Severity:** Medium

**Location:** System-wide

**Details:**  
System handles personal data (applicant information) without:
- Data deletion endpoint (right to erasure)
- Data export endpoint (data portability)
- Audit logging for data access
- Data retention policy implementation
- Consent tracking

**Recommendation:**  
Implement GDPR-required endpoints and audit logging.

---

#### SEC-010: No Input Sanitization for LLM

**Severity:** Medium

**Location:** `backend/shared/llm/client.py`

**Details:**  
Raw application text is passed directly to OpenAI API without sanitization or truncation:
- No maximum length enforcement
- No content filtering
- No prompt injection prevention

**Recommendation:**  
Implement input sanitization for LLM calls:
- Truncate to maximum token length
- Strip potentially harmful content
- Add basic content validation

---

#### SEC-011: No Email Validation

**Severity:** Low

**Location:** `backend/services/email-service/app/routers/email.py`

**Details:**  
Email addresses are not validated before sending:
- No format validation
- No domain restriction enforcement
- Could send to any email address

**Recommendation:**  
Add email validation using `email-validator` library and consider restricting to organizational domains (`usw.ac.uk`, `southwales.ac.uk`).

---

#### SEC-012: No Database SSL/TLS

**Severity:** Medium

**Location:** `backend/shared/db/base.py`, `backend/shared/config/settings.py`

**Details:**  
Database connections do not enforce SSL/TLS:
- No `sslmode` configuration in connection parameters
- Production database traffic could be intercepted

**Recommendation:**  
Configure database connections with `sslmode=require` for production environments.

---

#### SEC-013: No HTTPS/TLS Configuration

**Severity:** High

**Location:** All services, API Gateway

**Details:**  
Services run on HTTP only with no TLS termination configured:
- All traffic is unencrypted
- Sensitive data (credentials, personal information) transmitted in plaintext
- No SSL certificates configured

**Recommendation:**  
Configure TLS termination at load balancer or reverse proxy level. Implement HTTPS redirect middleware.

---

#### SEC-014: No Audit Logging

**Severity:** Medium

**Location:** System-wide

**Details:**  
No user activity audit trail exists:
- No logging of who accessed what data
- No logging of data modifications
- No compliance-ready audit records
- Cannot investigate security incidents

**Recommendation:**  
Implement audit logging for all data access and mutations with user identity, timestamp, and action details.

---

## 4. Documentation vs. Implementation Discrepancies

This section documents gaps between what the documentation claims exists and what was actually found in the codebase. These are cross-referenced to the corresponding findings in Section 3.

### DISC-001: Infrastructure Documentation Gap

**Documented:** `infra/docker-compose.yml`, `k8s/`, `migrations/` directories exist

**Found:** These directories do **not** exist in repository

**Related Findings:** See ARCH-002 (No Containerization) and ARCH-004 (No Database Migrations)

---

### DISC-002: Auth Service Documentation Gap

**Documented:** "auth-service – authentication & user roles"

**Found:** Auth service is an empty stub with only 1 line (a comment), not implemented

**Related Finding:** See SEC-002 (No Authentication Implementation)

---

### DISC-003: Role-based Permissions Documentation Gap

**Documented:**
- "Role-based permissions (in development)"
- "Security: Access Control"
- "Internal only, behind USW VPN/SSO"

**Found:**
- Currently using hardcoded demo roles for POC purposes
- Access control features are pending implementation
- SSO integration is not yet configured

**Related Findings:** See SEC-002 (No Authentication Implementation) and SEC-004 (Hardcoded User Identities)

---

**Note:** The missing requirements files issue is documented in ARCH-003 (No Dependency Management Files) and is not duplicated here

---

## 5. Findings Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Correctness | 0 | 2 | 2 | 2 | 6 |
| Performance | 0 | 0 | 1 | 0 | 1 |
| Reliability | 0 | 2 | 1 | 1 | 4 |
| Maintainability | 0 | 0 | 4 | 7 | 11 |
| Testing | 1 | 0 | 0 | 0 | 1 |
| Documentation | 0 | 0 | 1 | 1 | 2 |
| Observability | 0 | 0 | 1 | 3 | 4 |
| Architecture/Design | 3 | 0 | 1 | 3 | 7 |
| Security | 3 | 2 | 8 | 1 | 14 |
| **Total** | **7** | **6** | **19** | **18** | **50** |

### Findings by Priority Level

#### Critical Priority (7 items)

| ID | Category | Finding |
|----|----------|---------|
| SEC-001 | Security | API Key Committed to Repository |
| SEC-002 | Security | No Authentication Implementation |
| SEC-003 | Security | Database Credentials in Source Code |
| TEST-001 | Testing | Zero Automated Test Coverage |
| ARCH-001 | Architecture | No CI/CD Pipeline |
| ARCH-002 | Architecture | No Containerization |
| ARCH-003 | Architecture | No Dependency Management Files |

#### High Priority (6 items)

| ID | Category | Finding |
|----|----------|---------|
| SEC-004 | Security | Hardcoded User Identities |
| SEC-013 | Security | No HTTPS/TLS Configuration |
| COR-001 | Correctness | Duplicate Function Definitions in Email Service |
| COR-002 | Correctness | Duplicate Route Definition |
| REL-002 | Reliability | Hardcoded Service URLs |
| REL-003 | Reliability | Hardcoded Frontend URL in Backend |

#### Medium Priority (19 items)

| ID | Category | Finding |
|----|----------|---------|
| SEC-005 | Security | Missing Security Headers |
| SEC-006 | Security | No Rate Limiting |
| SEC-007 | Security | Debug Endpoints Exposed |
| SEC-008 | Security | File Upload Security Gaps |
| SEC-009 | Security | No GDPR Compliance Features |
| SEC-010 | Security | No Input Sanitization for LLM |
| SEC-012 | Security | No Database SSL/TLS |
| SEC-014 | Security | No Audit Logging |
| COR-003 | Correctness | Frontend/Backend Type Mismatch - IntakeSummary |
| COR-004 | Correctness | Frontend/Backend Type Mismatch - Capacity Status |
| PERF-001 | Performance | Synchronous LLM Calls Block Requests |
| REL-001 | Reliability | No Circuit Breaker for External Services |
| MAINT-001 | Maintainability | Monolithic Applicant Service File |
| MAINT-002 | Maintainability | Inconsistent Request Body Typing |
| MAINT-003 | Maintainability | Inconsistent Error Handling Patterns |
| MAINT-008 | Maintainability | Missing Repository/Service Layer Pattern |
| DOC-002 | Documentation | No API Versioning |
| OBS-001 | Observability | No Request Tracing / Correlation IDs |
| ARCH-004 | Architecture | No Database Migrations |

#### Low Priority (18 items)

| ID | Category | Finding |
|----|----------|---------|
| SEC-011 | Security | No Email Validation |
| COR-005 | Correctness | Missing Document Type in Frontend |
| COR-006 | Correctness | Duplicate Import Statement |
| REL-004 | Reliability | No Graceful Shutdown Handling |
| MAINT-004 | Maintainability | Inconsistent Model-to-Dict Conversion |
| MAINT-005 | Maintainability | Missing Return Type Annotations |
| MAINT-006 | Maintainability | Inconsistent Parameter Conversion in Gateway |
| MAINT-007 | Maintainability | Inconsistent Cache Key Format |
| MAINT-009 | Maintainability | No Code Style Enforcement |
| MAINT-010 | Maintainability | Missing Docstrings |
| MAINT-011 | Maintainability | No Dependency Injection Container |
| DOC-001 | Documentation | No API Documentation Customization |
| OBS-002 | Observability | Inconsistent Logging Format |
| OBS-003 | Observability | Basic Health Checks Only |
| OBS-004 | Observability | No Metrics Collection |
| ARCH-005 | Architecture | Datetime Handling Inconsistency |
| ARCH-006 | Architecture | Hardcoded Magic Numbers |
| ARCH-007 | Architecture | Verbose Error Messages |

### Priority Levels

| Priority | Definition |
|----------|------------|
| **Critical** | Important item to address before production deployment; recommended for immediate attention |
| **High** | Significant item that should be addressed during production preparation |
| **Medium** | Notable item that would benefit from attention; can be addressed in upcoming development cycles |
| **Low** | Enhancement opportunity; can be incorporated as part of ongoing development |

---
