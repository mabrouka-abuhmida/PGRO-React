# PGR Supervision Matching System

## Executive Overview for Management

---

## 1. Executive Summary

The **PGR Supervision Matching System** is an AI-powered platform designed to streamline the processing of PhD and MRes applications and the allocation of supervisors at the University of South Wales. This tool significantly reduces manual workload, improves matching accuracy, and provides comprehensive tracking and reporting capabilities.

**Key Benefits:**

- **Time Savings:** Reduces hours of manual work per intake cycle
- **Improved Accuracy:** AI-powered matching ensures better alignment between applicants and supervisors
- **Complete Transparency:** Full audit trail of all decisions and recommendations
- **Scalability:** Handles high volumes of applications efficiently

---

## 2. The Challenge We're Solving

### Current Process Problems

**Manual Workload:**

- PGR Leads spend significant time manually reading and summarizing each application
- Manual matching of applicants to suitable supervisors based on research expertise
- Time-consuming checks of supervisor workload and capacity
- Spreadsheet-based tracking that is error-prone and difficult to audit

**Impact on Operations:**

- Significant time investment required for each intake cycle
- Risk of missing optimal matches due to human limitations
- Difficulty tracking decisions and changes over time
- Challenges in balancing workloads fairly across staff

---

## 3. Our Solution

An internal web application that:

1. **Automatically Processes Applications** – Extracts and summarizes research proposals using AI
2. **Intelligently Recommends Supervisors** – AI-powered matching with clear explanations
3. **Tracks All Allocations** – Centralized dashboard showing all applicants and their status
4. **Manages Capacity** – Real-time tracking of supervision loads to prevent over-allocation
5. **Provides Reporting** – Exportable data for Registry and Faculty reporting

**Human-in-the-Loop Approach:** The system provides recommendations, but PGR Leads always make the final decisions, ensuring human oversight and control.

---

## 4. Key Features & Business Value

### 4.1 Intelligent Application Processing

**What it does:**

- Accepts PDF uploads or pasted text from research proposals
- Automatically extracts and summarizes key information
- Identifies research themes, methods, and keywords
- Generates structured summaries for quick review

**Business value:**

- Saves hours of manual reading and note-taking
- Ensures consistent, comprehensive summaries
- Enables faster triage of applications

### 4.2 AI-Powered Supervisor Matching

**What it does:**

- Analyzes research proposals and compares them to all supervisor profiles
- Ranks supervisors by research alignment and expertise match
- Provides clear explanations for each recommendation
- Considers research areas, methods, and thematic alignment

**Business value:**

- Identifies optimal matches that might be missed manually
- Ensures fair consideration of all supervisors
- Provides transparent reasoning for recommendations
- Considers multiple factors simultaneously (expertise, capacity, eligibility)

### 4.3 Real-Time Capacity Management

**What it does:**

- Tracks current supervision loads for all staff members
- Compares against maximum capacity limits
- Automatically updates when allocations are made or changed
- Prevents over-allocation of supervisors

**Business value:**

- Prevents staff overload
- Ensures fair distribution of supervision workload
- Provides visibility into capacity across the organization
- Automatic updates reduce administrative burden

### 4.4 Comprehensive Allocation Tracking

**What it does:**

- Dashboard showing all applicants for each intake
- Status tracking (New → Contacted → Accepted → Rejected)
- View all allocations in one place
- Filter by year, term, and status

**Business value:**

- Complete visibility into application pipeline
- Easy tracking of applicant progress
- Clear audit trail of all decisions
- Supports planning and resource allocation

### 4.5 Analytics Dashboard

**What it does:**

- Comprehensive data visualization and insights
- Application status and degree type distribution charts
- Research theme and topic analysis
- Accelerator ↔ Research Group theme correlation matrix
- Intake trends over time
- Research group coverage statistics
- Print/PDF export functionality

**Business value:**

- Strategic insights for decision-making
- Identify trends and patterns in applications
- Understand research focus areas and coverage
- Support resource allocation planning
- Visual reporting for leadership presentations

### 4.6 Export & Reporting

**What it does:**

- Export allocation data to CSV format
- Includes applicant details, supervisor assignments, and status
- Ready for use in Excel or other reporting tools

**Business value:**

- Easy reporting to Registry and Faculty leadership
- Data for meetings and strategic planning
- Compliance and record-keeping
- Reduces manual report creation time

### 4.7 Staff Directory Management

**What it does:**

- Centralized database of all academic staff
- Stores research interests, methods, and keywords
- Tracks supervision capacity and eligibility
- Easy editing and updates

**Business value:**

- Up-to-date information for accurate matching
- Single source of truth for staff capabilities
- Supports better decision-making
- Reduces time spent searching for information

### 4.8 Applicant Profiles & Qualifications

**What it does:**

- Stores applicant personal details (date of birth, nationality, country of residence, contact information)
- Records prior degrees and qualifications (degree type, subject area, university, classification, year completed)
- Presents a dedicated applicant profile view combining personal information and educational history
- Allows updates and corrections to applicant details without touching the raw application text

**Business value:**

- Ensures accurate, up-to-date applicant records for decision-making and reporting
- Reduces time spent chasing basic personal and academic information
- Supports consistent data capture across intakes and programmes
- Provides a clearer picture of applicant background when confirming allocations

### 4.9 Document Management

**What it does:**

- Upload and manage multiple document types for each applicant (Research Proposal, CV, Application Form, Transcript)
- Track document checklist status to ensure all required documents are present
- Download and view documents directly from the system
- Extract structured data from application forms automatically
- Document type classification and organization

**Business value:**

- Centralized document storage reduces file management overhead
- Checklist tracking ensures compliance with application requirements
- Easy access to all applicant documents in one place
- Automated form extraction saves time on data entry
- Clear visibility of missing documents for follow-up

### 4.10 Staff Review System

**What it does:**

- Structured review forms for supervisors to evaluate allocated applicants
- Comprehensive review criteria (research quality, methodology, feasibility, ethics, etc.)
- Risk assessment (overseas research risk, reputational risk)
- AI-generated critical review support (advisory)
- Review submission tracking and audit trail

**Business value:**

- Standardizes review process across all supervisors
- Ensures comprehensive evaluation of all applications
- Captures structured feedback for decision-making
- Supports quality assurance and compliance
- Provides audit trail of review decisions

### 4.11 Interview Records System

**What it does:**

- Structured interview record forms for post-acceptance candidate interviews
- Comprehensive assessment fields covering:
  - Applicant background (education, work, research experience)
  - Research proposal discussion (topic clarity, objectives, methodology, literature awareness)
  - Motivation and commitment assessment
  - Skills evaluation (analytical, writing, critical thinking, technical)
  - Supervision expectations and support needs
  - Overall impression and recommendation
- Status tracking (In Process, Completed)
- Submission tracking with timestamps
- Linked to specific allocations (supervisor-applicant pairs)

**Business value:**

- Standardizes interview assessment process
- Captures detailed candidate evaluations for decision-making and future reference
- Provides structured documentation for compliance and quality assurance
- Supports supervisor-applicant matching decisions
- Creates audit trail of interview outcomes
- Helps identify support needs early in the process

### 4.12 Allocation Notes & Collaboration

**What it does:**

- Allocation-specific notes with threaded conversations (replies)
- Support for both applicant-level and allocation-specific notes
- Staff notification capability (notes can be sent to supervisors)
- Soft delete functionality (notes marked as deleted but retained)
- Edit tracking with timestamps
- Author information and role display
- Organized thread view with parent notes and nested replies

**Business value:**

- Facilitates communication and collaboration between PGR staff and supervisors
- Provides context-specific discussion threads for each allocation
- Creates audit trail of decisions and discussions
- Reduces email clutter by centralizing allocation-related communication
- Enables transparent decision documentation
- Supports knowledge sharing across the team

### 4.13 Email Notifications & Communication

**What it does:**

- Sends allocation emails to supervisors with key applicant details and their role (Director of Studies / Co‑Supervisor / Advisor)
- Sends congratulatory emails to accepted applicants with the confirmed supervisory team copied in
- Logs participant emails (recipients, CC supervisors, roles, subject, status) for audit and follow-up
- Surfaces clear error messages to users if email delivery fails

**Business value:**

- Standardises and streamlines communication around offers and allocations
- Reduces manual drafting of repetitive emails by PGR staff
- Ensures that key allocation communications are recorded for audit and quality assurance
- Helps applicants and supervisors receive timely, consistent information about decisions

---

## 5. Real-World Use Cases

### Scenario 1: New Intake Processing

**Situation:** 50 new PhD applications arrive for the February 2026 intake.

**Traditional Process:**

- PGR Lead spends 2-3 hours reading and summarizing each application
- Manual research to identify potential supervisors
- Time required: 100-150 hours total

**With the System:**

- Applications processed and summarized automatically
- Supervisor recommendations generated in minutes
- PGR Lead reviews summaries and recommendations
- Time required: 20-30 hours total

**Result:** 70-80% time savings, with improved matching quality

### Scenario 2: Finding a Specialist Supervisor

**Situation:** An application requires expertise in a very specific research area.

**Traditional Process:**

- PGR Lead searches through staff profiles manually
- May miss potential matches if keywords don't align exactly
- Time-consuming research process

**With the System:**

- AI understands research context beyond keywords
- Identifies best matches even if exact terms don't match
- Provides clear explanations for recommendations
- PGR Lead can make informed decision quickly

**Result:** Better matches, faster decisions, reduced risk of missing optimal supervisors

### Scenario 3: Workload Balancing

**Situation:** Need to ensure fair distribution of supervision workload.

**Traditional Process:**

- Manual tracking in spreadsheets
- Risk of errors and inconsistencies
- Difficult to see real-time capacity

**With the System:**

- Real-time visibility of all supervision loads
- Automatic capacity checks before recommendations
- Clear dashboard showing who has availability
- Prevents over-allocation automatically

**Result:** Fair workload distribution, reduced administrative errors

### Scenario 4: Reporting to Faculty

**Situation:** Faculty leadership needs allocation data for planning meeting.

**Traditional Process:**

- Manual compilation of data from multiple sources
- Risk of errors and inconsistencies
- Time-consuming report creation

**With the System:**

- One-click export of all allocation data
- Consistent, accurate information
- Ready for immediate use in meetings

**Result:** Faster reporting, accurate data, better decision-making support

---

**Technology Note:** The system uses advanced AI (similar technology to ChatGPT) to understand research content and match applicants to supervisors based on expertise alignment. However, all final decisions remain with human staff members.

---

## 6. Current Implementation Status

### Completed Features

- **Application Processing:** PDF upload, text extraction, AI-powered summarization with quality assessment
- **Quality Assessment:** Priority scoring (0-100) and AI detection probability analysis (0-100) with critical rationale
- **Document Management:** Upload, track, and manage multiple document types (Proposal, CV, Application Form, Transcript)
- **Staff Reviews:** Structured review forms with comprehensive evaluation criteria and risk assessment
- **Interview Records:** Comprehensive interview record system with structured assessment fields and status tracking
- **Allocation Notes:** Threaded conversations with replies, staff notifications, and soft delete functionality
- **Email Notifications:** Automated allocation and participant emails with audit logging
- **Supervisor Matching:** AI-powered recommendations with explanations
- **Allocation Management:** Create, track, and manage supervisor assignments
- **Capacity Tracking:** Real-time supervision load monitoring
- **Dashboard:** Intake overview with statistics and status breakdown
- **Analytics Dashboard:** Comprehensive data visualizations, theme analysis, and correlation matrices (SMT role required)
- **Export Functionality:** CSV export for reporting
- **Staff Directory:** Complete staff profile management
- **Applicant Profiles & Qualifications:** Centralised view and management of applicant personal details and educational history
- **Staff Portal:** Separate portal for staff to view allocations, submit reviews, and complete interview records
- **Role-Based Access:** SMT role with access to analytics dashboard

### In Development

- **User Authentication:** Enhanced authentication system with full SSO integration
- **Batch Operations:** Bulk allocation and status updates
- **Advanced Analytics:** Additional analytics panels and insights

---

## 7. Return on Investment

### Time Savings

**Application Processing:**

- **Before:** 2-3 hours per application (reading, summarizing, note-taking)
- **After:** 10-15 minutes per application (review of AI-generated summary)
- **Savings:** 80% reduction in processing time

**Supervisor Matching:**

- **Before:** 1-3 hours per application (research, profile review, decision-making)
- **After:** 20-30 minutes per application (review recommendations, make decision)
- **Savings:** 75% reduction in matching time

**Reporting:**

- **Before:** 4-6 hours per intake (manual data compilation)
- **After:** 15-30 minutes per intake (automated export)
- **Savings:** 90% reduction in reporting time

### Quality Improvements

- **Better Matching:** AI considers multiple factors simultaneously, leading to more accurate matches
- **Consistency:** Standardized process ensures all applications receive equal attention
- **Workload Balance:** Automatic capacity tracking prevents over-allocation
- **Audit Trail:** Complete record of all decisions for compliance and transparency

### Scalability

- System handles high volumes of applications without proportional increase in time
- Supports growth in PGR programs without additional staff resources
- Reduces bottlenecks during peak intake periods

---

## 8. Security & Compliance

### Data Security

- **Internal Tool:** Accessible only within University network
- **Secure Storage:** All data stored in University-managed database systems
- **Access Control:** Role-based permissions (in development)

### Compliance

- **Audit Trail:** Complete record of all decisions and changes
- **Human Oversight:** All allocations require human confirmation
- **Data Protection:** Compliant with University data protection requirements
- **Transparency:** All AI recommendations are explainable and reviewable

---

## 9. Next Steps

### Immediate Actions

1. **Complete Authentication System:** Finalize user access and role management
2. **Internal Pilot:** Conduct pilot with PGR team to gather feedback
3. **User Training:** Develop training materials and conduct sessions
4. **Refinements:** Incorporate user feedback for improvements

### Short-Term Goals (3-6 months)

1. **Production Deployment:** Move to production environment
2. **Full Rollout:** Deploy to all PGR Leads and administrative staff
3. **Integration:** Connect with existing University systems (where applicable)
4. **Documentation:** Complete user guides and training materials

### Long-Term Vision (6-12 months)

1. **Expansion:** Extend to additional programs or schools
2. **Advanced Analytics:** Enhanced reporting and analytics capabilities
3. **System Integration:** Deeper integration with student information systems
4. **Continuous Improvement:** Regular updates based on user feedback and needs

---

## Project Owner

**Dr. Mabrouka Abuhmida**
Research & Innovation Lead
University of South Wales

**Document Version:** 1.0

**Last Updated:** November 24, 2025

---



*This document provides a high-level overview of the PGR Supervision Matching System for non-technical stakeholders. For technical details, please refer to the Technical Specification document.*
