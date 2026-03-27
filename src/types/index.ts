/**
 * TypeScript types for the PGR Matching System
 */

export type { ApiError } from "./errors";
export { isApiError, getErrorMessage } from "./errors";

export type DegreeType = "PHD" | "MRES";

export type ApplicantStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "SUPERVISOR_CONTACTED"
  | "ACCEPTED"
  | "REJECTED"
  | "ON_HOLD";

export type AllocationRole = "DOS" | "CO_SUPERVISOR" | "ADVISOR";

export type UserRole = "ADMIN" | "PGR_LEAD" | "STAFF" | "VIEW_ONLY" | "SMT";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface Staff {
  id: string;
  full_name: string;
  email: string;
  role_title?: string;
  school?: string;
  research_group?: string;
  can_be_dos: boolean;
  can_supervise_phd: boolean;
  can_supervise_mres: boolean;
  max_phd_supervisions: number;
  max_mres_supervisions: number;
  current_phd_supervisions: number;
  current_mres_supervisions: number;
  research_interests_text?: string;
  methods_text?: string;
  keywords?: string[];
  excluded_topics_text?: string;
  active: boolean;
  has_embedding: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffCreate {
  full_name: string;
  email: string;
  role_title?: string;
  school?: string;
  research_group?: string;
  can_be_dos?: boolean;
  can_supervise_phd?: boolean;
  can_supervise_mres?: boolean;
  max_phd_supervisions?: number;
  max_mres_supervisions?: number;
  research_interests_text?: string;
  methods_text?: string;
  keywords?: string[];
  excluded_topics_text?: string;
  active?: boolean;
}

export interface StaffUpdate extends Partial<StaffCreate> {
  current_phd_supervisions?: number;
  current_mres_supervisions?: number;
}

export interface ApplicantDegree {
  id: string;
  applicant_id: string;
  degree_type: string;
  subject_area?: string;
  university?: string;
  university_country?: string;
  classification?: string;
  year_completed?: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicantProfile {
  date_of_birth?: string; // ISO date string
  nationality?: string;
  country_of_residence?: string;
  phone_number?: string;
  address?: string;
  how_heard_about_usw?: string;
}

export interface Applicant {
  id: string;
  full_name: string;
  email?: string;
  degree_type: DegreeType;
  intake_term?: string;
  intake_year?: number;
  raw_application_text: string;
  summary_text?: string;
  topic_keywords?: string[];
  method_keywords?: string[];
  primary_theme?: string;
  secondary_theme?: string;
  status: ApplicantStatus;
  priority_score?: number; // Quality score 0-100
  ai_detection_probability?: number; // AI detection likelihood 0-100
  quality_rationale?: string; // Explanation for quality and AI detection scores
  embedding?: number[];
  created_at: string;
  updated_at: string;
  profile?: ApplicantProfile;
  degrees?: ApplicantDegree[];
}

export interface ApplicantCreate {
  full_name: string;
  email?: string;
  degree_type: DegreeType;
  intake_term?: string;
  intake_year?: number;
  raw_application_text: string;
  profile?: {
    date_of_birth?: string;
    nationality?: string;
    country_of_residence?: string;
    phone_number?: string;
  };
  degrees?: Array<{
    degree_type: string;
    subject_area?: string;
    university?: string;
    university_country?: string;
    classification?: string;
    year_completed?: number;
  }>;
}

export interface MatchRequest {
  applicant_id: string;
  applicant_name: string;
  degree_type: DegreeType;
  applicant_summary: string;
  applicant_topics: string[];
  applicant_methods: string[];
  applicant_embedding: number[];
  require_dos?: boolean;
  min_score?: number;
  require_capacity?: boolean;
  limit?: number;
}

export interface MatchResponse {
  staff_id: string;
  full_name: string;
  email: string;
  role_title?: string;
  school?: string;
  research_group?: string;
  can_be_dos: boolean;
  research_interests?: string;
  methods?: string;
  keywords: string[];
  match_score: number;
  capacity_status: "AVAILABLE" | "FULL" | "OVER_CAPACITY" | "NO_CAPACITY_SET";
  explanation: string;
  role_suggestion: "DOS" | "CO_SUPERVISOR";
}

export interface Allocation {
  id: string;
  applicant_id: string;
  staff_id: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_degree_type?: string;
  applicant_intake_year?: number;
  applicant_intake_term?: string;
  applicant_status?: ApplicantStatus;
  applicant_priority_score?: number; // Quality score 0-100
  applicant_ai_detection_probability?: number; // AI detection likelihood 0-100
  staff_name?: string;
  staff_email?: string;
  staff_school?: string;
  role: AllocationRole;
  match_score?: number;
  explanation?: string;
  is_suggestion: boolean;
  is_confirmed: boolean;
  confirmed_at?: string;
  confirmed_by_user_id?: string;
  email_sent_at?: string;
  email_error?: string;
  email_retry_count?: number;
  time_to_confirmation?: string;
  created_at: string;
  updated_at: string;
}

export interface AllocationCreate {
  applicant_id: string;
  staff_id: string;
  role: AllocationRole;
  is_confirmed: boolean;
  match_score?: number;
  explanation?: string;
}

export interface StaffListResponse {
  items: Staff[];
  total: number;
  page: number;
  page_size: number;
}

export interface IntakeSummary {
  year: number;
  term: string;
  total: number;
  new: number;
  under_review?: number;
  supervisor_contacted: number;
  accepted: number;
  rejected: number;
  on_hold?: number;
}

export interface AllocationNote {
  id: string;
  allocation_id: string;
  applicant_id: string;
  author_user_id: string;
  author_name?: string;
  author_email?: string;
  author_role?: string;
  note_text: string;
  parent_note_id?: string;
  is_sent_to_staff: boolean;
  sent_at?: string;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
  replies?: AllocationNote[];
}

export interface AllocationNoteCreate {
  note_text: string;
  send_to_staff?: boolean;
  author_user_id: string;
}

export interface AllocationNoteReply {
  note_text: string;
  author_user_id: string;
}

export interface AllocationNoteUpdate {
  note_text: string;
  author_user_id: string;
}

export type DocumentType =
  | "PROPOSAL"
  | "CV"
  | "APPLICATION_FORM"
  | "TRANSCRIPT"
  | "OTHER";

export interface ApplicantDocument {
  id: string;
  applicant_id: string;
  file_name: string;
  document_type: DocumentType;
  mime_type?: string;
  file_size_bytes?: number;
  storage_path?: string;
  extracted_text?: string;
  has_extracted_text: boolean;
  extracted_text_updated_at?: string;
  created_at: string;
}

export interface DocumentChecklist {
  has_proposal: boolean;
  has_cv: boolean;
  has_application_form: boolean;
  has_transcript: boolean;
  is_complete: boolean;
  missing_documents: string[];
  total_documents: number;
}
