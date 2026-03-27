/**
 * Utility functions for determining badge variants based on status, role, etc.
 * Centralizes badge variant logic to avoid duplication across components.
 */

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'purple';

/**
 * Gets the badge variant for an applicant status
 */
export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'NEW': return 'default';
    case 'UNDER_REVIEW': return 'warning';
    case 'SUPERVISOR_CONTACTED': return 'warning';
    case 'ACCEPTED': return 'success';
    case 'REJECTED': return 'error';
    case 'ON_HOLD': return 'default';
    default: return 'default';
  }
}

/**
 * Gets the badge variant for a staff role
 */
export function getRoleBadgeVariant(role: string): BadgeVariant {
  switch (role) {
    case 'DOS': return 'info';
    case 'CO_SUPERVISOR': return 'primary';
    case 'ADVISOR': return 'default';
    default: return 'default';
  }
}

/**
 * Gets the badge variant for a review recommendation
 */
export function getRecommendationBadgeVariant(recommendation?: string | null): BadgeVariant {
  if (!recommendation) return 'default';
  
  switch (recommendation) {
    case 'ACCEPT': return 'success';
    case 'REJECT': return 'error';
    case 'INTERVIEW_APPLICANT': return 'warning';
    case 'REVISE_PROPOSAL': return 'warning';
    default: return 'default';
  }
}

/**
 * Gets the badge variant for an interview status
 */
export function getInterviewStatusBadgeVariant(status: 'IN_PROCESS' | 'COMPLETED' | null): BadgeVariant {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROCESS': return 'warning';
    default: return 'default';
  }
}

/**
 * Gets the badge variant for a review status
 */
export function getReviewStatusBadgeVariant(status: 'submitted' | 'draft' | null): BadgeVariant {
  switch (status) {
    case 'submitted': return 'success';
    case 'draft': return 'warning';
    default: return 'default';
  }
}

