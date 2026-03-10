/**
 * ApplicantDetail - Applicant detail page with summary, raw text, and matches panel
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Badge, Button, ProfileModal, ProposalTextModal, ApplicantSummary, ApplicantMatches, ApplicantAllocations, ApplicantDocuments, ManualAllocation } from '@/components';
import { 
  useApplicant, 
  useUpdateApplicant, 
  useDeleteApplicant,
  useStoredMatches,
  useFindMatches,
  useAllocations,
  useCreateAllocation,
  useSendAllocationEmail,
  useDocuments,
  useDocumentChecklist,
  useUploadDocument,
  useDeleteDocument,
  useStaffList
} from '@/hooks';
import { applicantService } from '@/services/applicantService';
import { createApplicantSlug, findApplicantIdBySlug } from '@/utils/slug';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastWarning, toastConfirm } from '@/utils/toast';
import { validateUUID } from '@/utils/paramValidation';
import { sanitizeUrlParam } from '@/utils/sanitize';
import { getStatusBadgeVariant } from '@/utils/badgeVariants';
import type { MatchResponse, AllocationCreate } from '@/types';
import type { StaffReview } from '@/services/staffReviewService';
import './ApplicantDetail.css';

export const ApplicantDetail: React.FC = () => {
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Validate and sanitize URL parameter
  const sanitizedSlugOrId = slugOrId ? sanitizeUrlParam(slugOrId) : null;
  
  // Resolve applicant ID from slug or UUID
  const [resolvedApplicantId, setResolvedApplicantId] = useState<string | null>(
    location.state?.applicantId || null
  );

  // Try to resolve applicant ID if we have slugOrId but no resolved ID
  useEffect(() => {
    if (sanitizedSlugOrId && !resolvedApplicantId) {
      // Validate UUID format if it looks like a UUID
      const isUUID = sanitizedSlugOrId.includes('-') && sanitizedSlugOrId.length === 36;
      if (isUUID) {
        try {
          // Validate UUID format
          validateUUID(sanitizedSlugOrId, 'applicant id');
          setResolvedApplicantId(sanitizedSlugOrId);
        } catch (error) {
          logger.error('Invalid UUID format:', error);
          navigate('/pgro/applicants');
        }
      } else {
        // It's a slug - check cache first, then fetch if needed
        const cacheKey = `applicant_slug_${sanitizedSlugOrId}`;
        const cachedId = sessionStorage.getItem(cacheKey);
        
        if (cachedId) {
          // Use cached ID
          setResolvedApplicantId(cachedId);
          return;
        }
        
        // Not in cache - fetch and cache
        let cancelled = false;
        // Use a smaller page size and search more efficiently
        applicantService.list({ page: 1, page_size: 100 })
          .then(response => {
            if (!cancelled) {
              const id = findApplicantIdBySlug(sanitizedSlugOrId, response.items || []);
              if (id) {
                setResolvedApplicantId(id);
                // Cache the slug-to-ID mapping
                sessionStorage.setItem(cacheKey, id);
              } else if (response.total && response.total > 100) {
                // If not found and there are more results, try next page
                // But for now, just log - could implement pagination search if needed
                logger.warn(`Applicant with slug "${sanitizedSlugOrId}" not found in first 100 results`);
              }
            }
          })
          .catch(() => {
            // Error will be handled by the query
          });
        
        return () => {
          cancelled = true;
        };
      }
    }
  }, [sanitizedSlugOrId, navigate]); // Removed resolvedApplicantId from dependencies to prevent loops

  // Fetch applicant data
  const { data: applicant, isLoading: loading } = useApplicant(resolvedApplicantId || undefined);
  
  // Update resolved ID when applicant loads
  useEffect(() => {
    if (applicant?.id && applicant.id !== resolvedApplicantId) {
      setResolvedApplicantId(applicant.id);
      
      // Update URL to use slug if we used UUID
      if (slugOrId !== applicant.id && applicant.full_name) {
        const slug = createApplicantSlug(applicant.full_name, applicant.id);
        navigate(`/pgro/applicants/${slug}`, { 
          replace: true,
          state: { applicantId: applicant.id } 
        });
      }
    }
  }, [applicant, resolvedApplicantId, slugOrId, navigate]);

  const applicantId = resolvedApplicantId;

  // Fetch matches and timestamp
  const { data: storedMatches = [], isLoading: loadingStoredMatches } = useStoredMatches(applicantId || undefined);
  const matches = storedMatches;

  // Fetch confirmed allocations
  const { data: confirmedAllocations = [] } = useAllocations({ 
    applicant_id: applicantId || undefined, 
    is_confirmed: true 
  });

  // Fetch documents and checklist
  const { data: documents = [] } = useDocuments(applicantId || undefined);
  const { data: documentChecklist } = useDocumentChecklist(applicantId || undefined);

  // Fetch staff list
  const { data: staffListData, isLoading: loadingStaff } = useStaffList({ active: true });
  const staffList = staffListData?.items || [];

  // Fetch reviews and interviews for each allocation in parallel
  const reviewQueries = useQueries({
    queries: confirmedAllocations.map((allocation) => ({
      queryKey: ['staff-review', 'allocation', allocation.id],
      queryFn: async () => {
        const { staffReviewService } = await import('@/services/staffReviewService');
        return staffReviewService.getByAllocation(allocation.id);
      },
      enabled: confirmedAllocations.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnMount: false, // Don't refetch if data is fresh
    })),
  });

  const interviewQueries = useQueries({
    queries: confirmedAllocations.map((allocation) => ({
      queryKey: ['interview-record', 'allocation', allocation.id],
      queryFn: async () => {
        const { interviewRecordService } = await import('@/services/interviewRecordService');
        return interviewRecordService.getByAllocation(allocation.id);
      },
      enabled: confirmedAllocations.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnMount: false, // Don't refetch if data is fresh
    })),
  });

  // Create maps from queries
  const staffReviews = useMemo(() => {
    const reviewsMap = new Map<string, StaffReview | null>();
    reviewQueries.forEach((query, index) => {
      const allocation = confirmedAllocations[index];
      if (allocation && query.data) {
        reviewsMap.set(allocation.id, query.data);
      }
    });
    return reviewsMap;
  }, [reviewQueries, confirmedAllocations]);

  const interviewRecords = useMemo(() => {
    const interviewsMap = new Map<string, { id: string; exists: boolean }>();
    interviewQueries.forEach((query, index) => {
      const allocation = confirmedAllocations[index];
      if (allocation && query.data?.exists && query.data.id) {
        interviewsMap.set(allocation.id, { id: query.data.id, exists: true });
      }
    });
    return interviewsMap;
  }, [interviewQueries, confirmedAllocations]);

  // UI state
  const [creatingAllocations, setCreatingAllocations] = useState<Set<string>>(new Set());
  const [showRawText, setShowRawText] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showFilesChecklist, setShowFilesChecklist] = useState(false);
  const [manualAllocation, setManualAllocation] = useState({
    staff_id: '',
    role: 'DOS' as 'DOS' | 'CO_SUPERVISOR' | 'ADVISOR',
  });
  const [creatingManualAllocation, setCreatingManualAllocation] = useState(false);

  // Mutations
  const findMatchesMutation = useFindMatches();
  const createAllocationMutation = useCreateAllocation();
  const sendEmailMutation = useSendAllocationEmail();
  const updateApplicantMutation = useUpdateApplicant();
  const deleteApplicantMutation = useDeleteApplicant();
  const uploadDocumentMutation = useUploadDocument();
  const deleteDocumentMutation = useDeleteDocument();



  const loadMatches = async () => {
    if (!applicant || !applicantId) return;
    
    // Check if applicant has an embedding
    if (!applicant.embedding || applicant.embedding.length === 0) {
      toastWarning('This applicant does not have an embedding yet. Please wait for the embedding to be generated, or refresh the page.');
      return;
    }
    
    try {
      setLoadingMatches(true);
      
      const request = {
        applicant_id: applicantId,
        applicant_name: applicant.full_name,
        degree_type: applicant.degree_type,
        applicant_summary: applicant.summary_text || '',
        applicant_topics: applicant.topic_keywords || [],
        applicant_methods: applicant.method_keywords || [],
        applicant_embedding: applicant.embedding,
        require_dos: false,
        min_score: 0.0,
        require_capacity: true,
        limit: 20,
      };
      
      const data = await findMatchesMutation.mutateAsync(request);
      logger.log('Matches received:', data);
      
      if (data.length === 0) {
        toastWarning('No matching supervisors found. This could be because:\n- No staff members have embeddings yet\n- No staff members match the degree type\n- All matching staff are at full capacity\n\nPlease check that staff members have embeddings and capacity.');
      }
    } catch (error) {
      logger.error('Error loading matches:', error);
      toastError(`Error finding matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreateAllocation = async (match: MatchResponse) => {
    if (!applicantId) return;
    
    try {
      setCreatingAllocations(prev => new Set(prev).add(match.staff_id));
      
      // Create allocation with match details
      const allocationData: AllocationCreate = {
        applicant_id: applicantId,
        staff_id: match.staff_id,
        role: match.role_suggestion,
        is_confirmed: false,
        match_score: match.match_score,
        explanation: match.explanation,
      };
      
      const created = await createAllocationMutation.mutateAsync(allocationData);
      logger.log('Allocation created:', created);
      
      // Automatically send email to supervisor
      try {
        await sendEmailMutation.mutateAsync(created.id);
        logger.log('Email sent successfully');
      } catch (emailError: unknown) {
        logger.error('Error sending email:', emailError);
        // Continue even if email fails - allocation is still created
        toastWarning(`Allocation created, but email failed to send: ${getErrorMessage(emailError)}`);
      }
      
      // Update applicant status to SUPERVISOR_CONTACTED
      try {
        await updateApplicantMutation.mutateAsync({ id: applicantId, data: { status: 'SUPERVISOR_CONTACTED' } });
        logger.log('Applicant status updated to SUPERVISOR_CONTACTED');
        // Query will automatically refetch due to invalidation
      } catch (statusError: unknown) {
        logger.error('Error updating applicant status:', statusError);
        // Continue even if status update fails
        toastWarning(`Allocation created and email sent, but status update failed: ${getErrorMessage(statusError)}`);
      }
      
      // Show success message
      toastSuccess(`Allocation created for ${match.full_name} as ${match.role_suggestion}. Email has been sent to the supervisor and applicant status updated to "Supervisor Contacted".`);
    } catch (error: unknown) {
      logger.error('Error creating allocation:', error);
      toastError(`Failed to create allocation: ${getErrorMessage(error)}`);
    } finally {
      setCreatingAllocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(match.staff_id);
        return newSet;
      });
    }
  };

  const handleManualAllocation = async () => {
    if (!applicantId || !manualAllocation.staff_id) {
      toastWarning('Please select a staff member');
      return;
    }

    try {
      setCreatingManualAllocation(true);
      
      // Find selected staff member for display
      const selectedStaff = staffList.find(s => s.id === manualAllocation.staff_id);
      const staffName = selectedStaff?.full_name || 'Selected staff';
      
      // Create allocation with manual selection
      const allocationData: AllocationCreate = {
        applicant_id: applicantId,
        staff_id: manualAllocation.staff_id,
        role: manualAllocation.role,
        is_confirmed: false,
        // No match_score or explanation for manual allocations
      };
      
      const created = await createAllocationMutation.mutateAsync(allocationData);
      logger.log('Manual allocation created:', created);
      
      // Automatically send email to supervisor (same as AI match)
      try {
        await sendEmailMutation.mutateAsync(created.id);
        logger.log('Email sent successfully');
      } catch (emailError: unknown) {
        logger.error('Error sending email:', emailError);
        toastWarning(`Allocation created, but email failed to send: ${getErrorMessage(emailError)}`);
      }
      
      // Update applicant status to SUPERVISOR_CONTACTED (same as AI match)
      try {
        await updateApplicantMutation.mutateAsync({ id: applicantId, data: { status: 'SUPERVISOR_CONTACTED' } });
        logger.log('Applicant status updated to SUPERVISOR_CONTACTED');
        // Query will automatically refetch due to invalidation
      } catch (statusError: unknown) {
        logger.error('Error updating applicant status:', statusError);
        toastWarning(`Allocation created and email sent, but status update failed: ${getErrorMessage(statusError)}`);
      }
      
      // Show success message
      toastSuccess(`Allocation created for ${staffName} as ${manualAllocation.role}. Email has been sent to the supervisor and applicant status updated to "Supervisor Contacted".`);
      
      // Reset form
      setManualAllocation({ staff_id: '', role: 'DOS' });
      
      // Queries will automatically refetch due to invalidation
      
    } catch (error: unknown) {
      logger.error('Error creating manual allocation:', error);
      toastError(`Failed to create allocation: ${getErrorMessage(error)}`);
    } finally {
      setCreatingManualAllocation(false);
    }
  };

  const handleDelete = async () => {
    if (!applicantId || !applicant) return;
    
    const confirmed = await toastConfirm(
      `Are you sure you want to delete the application for "${applicant.full_name}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(true);
      await deleteApplicantMutation.mutateAsync(applicantId);
      toastSuccess('Application deleted successfully');
      navigate('/applicants');
    } catch (error: unknown) {
      logger.error('Error deleting applicant:', error);
      toastError(`Failed to delete application: ${getErrorMessage(error)}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT') => {
    if (!applicantId) return;

    try {
      setUploadingDocument(true);
      await uploadDocumentMutation.mutateAsync({
        file,
        applicant_id: applicantId,
        document_type: documentType,
      });
      
      // Queries will automatically refetch due to invalidation
      toastSuccess('Document uploaded successfully');
    } catch (error: unknown) {
      logger.error('Error uploading document:', error);
      toastError(`Failed to upload document: ${getErrorMessage(error)}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (fileId: string) => {
    const confirmed = await toastConfirm('Are you sure you want to delete this document?');
    if (!confirmed) {
      return;
    }

    if (!applicantId) return;

    try {
      await deleteDocumentMutation.mutateAsync({ fileId, applicantId });
      // Queries will automatically refetch due to invalidation in useDeleteDocument hook
      toastSuccess('Document deleted successfully');
    } catch (error: unknown) {
      logger.error('Error deleting document:', error);
      toastError(`Failed to delete document: ${getErrorMessage(error)}`);
    }
  };


  if (loading) {
    return <div className="loading">Loading applicant...</div>;
  }

  if (!applicant) {
    return <div className="error">Applicant not found</div>;
  }

  // Helper function to get AI likelihood label
  const getAILikelihood = () => {
    if (applicant.ai_detection_probability === undefined || applicant.ai_detection_probability === null) {
      return null;
    }
    if (applicant.ai_detection_probability >= 70) return 'High';
    if (applicant.ai_detection_probability >= 40) return 'Medium';
    return 'Low';
  };

  // Helper function to get AI likelihood badge color
  const getAILikelihoodBadgeColor = () => {
    if (applicant.ai_detection_probability === undefined || applicant.ai_detection_probability === null) {
      return '#FF9800'; // Default orange
    }
    if (applicant.ai_detection_probability >= 70) return '#d32f2f'; // Red for high
    if (applicant.ai_detection_probability >= 40) return '#FF9800'; // Orange for medium
    return '#4CAF50'; // Green for low
  };

  const aiLikelihood = getAILikelihood();
  const aiLikelihoodColor = getAILikelihoodBadgeColor();
  const intakeDisplay = applicant.intake_term && applicant.intake_year 
    ? `${applicant.intake_term} ${applicant.intake_year} INTAKE`
    : null;

  // Contextual "next step" action to guide PGRO staff
  const nextAction = (() => {
    // If we have no matches yet, recommend generating matches (if embedding exists)
    if (!matches.length) {
      const hasEmbedding = applicant.embedding && applicant.embedding.length > 0;
      return {
        label: loadingMatches || loadingStoredMatches
          ? 'Loading matches...'
          : hasEmbedding
            ? 'Find Matches'
            : 'Waiting for AI processing',
        onClick: hasEmbedding ? loadMatches : undefined,
        disabled: !hasEmbedding || loadingMatches || loadingStoredMatches,
        helperText: hasEmbedding
          ? 'Generate supervisor suggestions for this applicant.'
          : 'Embedding is still being generated; refresh this page in a moment.',
      };
    }

    // Fallback: no guided action
    return null;
  })();

  return (
    <div className="applicant-detail">
      <div className="detail-header">
        <Link to="/applicants">
          <Button variant="text">← Back to Applicants</Button>
        </Link>
        <div className="header-actions">
          <Button 
            variant="outline" 
            size="sm"
            className="btn-files-checklist"
            onClick={() => setShowFilesChecklist(true)}
          >
            Files Checklist
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowRawText(true)}
          >
            Show Proposal Text
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowProfileModal(true)}
          >
            Show Profile
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={loadMatches} 
            disabled={loadingMatches || loadingStoredMatches}
          >
            {loadingMatches ? 'Generating...' : matches.length > 0 ? 'Refresh Matches' : 'Find Matches'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete} 
            disabled={deleting}
            className="btn-delete"
          >
            {deleting ? 'Deleting...' : 'Delete Application'}
          </Button>
        </div>
      </div>

      {/* Contextual next step bar for PGRO staff */}
      {nextAction && (
        <div className="next-actions-bar">
          <span className="next-actions-label">Next step:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={nextAction.onClick}
            disabled={nextAction.disabled}
          >
            {nextAction.label}
          </Button>
          {nextAction.helperText && (
            <span className="next-actions-helper">
              {nextAction.helperText}
            </span>
          )}
        </div>
      )}

      {/* Header Bar with Proposal Info */}
      <div className="proposal-header-bar">
        <div className="proposal-header-left">
          <span className="proposal-identifier">{applicant.full_name}</span>
          {intakeDisplay && <span className="proposal-intake">{intakeDisplay}</span>}
          <span className="proposal-status">
            Status: <Badge variant={getStatusBadgeVariant(applicant.status)}>
              {applicant.status.replace('_', ' ')}
            </Badge>
          </span>
        </div>
        {aiLikelihood && applicant.ai_detection_probability !== null && applicant.ai_detection_probability !== undefined && (
          <div 
            className="ai-likelihood-badge"
            style={{ background: aiLikelihoodColor }}
          >
            AI Likelihood: {aiLikelihood} ({applicant.ai_detection_probability.toFixed(0)}%)
          </div>
        )}
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <ApplicantSummary applicant={applicant} />

          {/* Staff Reviews Section */}
          <ApplicantAllocations
            allocations={confirmedAllocations}
            staffReviews={staffReviews}
            interviewRecords={interviewRecords}
            applicantName={applicant?.full_name}
          />
        </div>

        <div className="detail-sidebar">
          <ApplicantMatches
            matches={matches}
            loading={loadingMatches || loadingStoredMatches}
            onCreateAllocation={handleCreateAllocation}
            creatingAllocations={creatingAllocations}
            hasEmbedding={!!(applicant.embedding && applicant.embedding.length > 0)}
          />

          {/* Manual Allocation Section */}
          <ManualAllocation
            staffList={staffList}
            loadingStaff={loadingStaff}
            manualAllocation={manualAllocation}
            onAllocationChange={setManualAllocation}
            onCreateAllocation={handleManualAllocation}
            creating={creatingManualAllocation}
          />
        </div>
      </div>

      {/* Files Checklist Modal */}
      {showFilesChecklist && applicantId && (
        <div className="modal-overlay" onClick={() => setShowFilesChecklist(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="h-section">Files Checklist & Documents</h2>
              <button className="modal-close" onClick={() => setShowFilesChecklist(false)}>×</button>
            </div>
            <div className="modal-body">
              <ApplicantDocuments
                applicantId={applicantId}
                documents={documents}
                documentChecklist={documentChecklist}
                onUpload={handleDocumentUpload}
                onDelete={handleDeleteDocument}
                uploading={uploadingDocument}
              />
            </div>
          </div>
        </div>
      )}

      {/* Proposal Text Modal */}
      {showRawText && applicant && (
        <ProposalTextModal
          isOpen={showRawText}
          onClose={() => setShowRawText(false)}
          text={applicant.raw_application_text}
        />
      )}

      {/* Profile Modal */}
      {applicantId && (
        <ProfileModal
          applicantId={applicantId}
          applicantName={applicant.full_name}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
            onProfileUpdated={() => {
              // Query will automatically refetch due to invalidation
            }}
        />
      )}
    </div>
  );
};

