/**
 * ApplicantDocuments - Documents section for applicant detail page
 */
import React from "react";
import { Card, Badge, Button } from "@/components";
import { Document, documentService } from "@/services/documentService";
import { logger } from "@/utils/logger";
import { toastError, toastConfirm } from "@/utils/toast";
import { getErrorMessage } from "@/types";
import type { DocumentChecklist } from "@/types";
import "./ApplicantDocuments.css";

interface DocumentX extends Document {
  filename?: string;
}

interface ApplicantDocumentsProps {
  applicantId: string;
  documents: DocumentX[];
  documentChecklist: DocumentChecklist | null;
  onUpload: (
    file: File,
    documentType: "PROPOSAL" | "CV" | "APPLICATION_FORM" | "TRANSCRIPT",
  ) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  uploading: boolean;
}

export const ApplicantDocuments: React.FC<ApplicantDocumentsProps> = ({
  documents,
  documentChecklist,
  onUpload,
  onDelete,
  uploading,
}) => {
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await documentService.download(fileId, fileName);
    } catch (error: unknown) {
      logger.error("Error downloading document:", error);
      toastError(`Failed to download document: ${getErrorMessage(error)}`);
    }
  };

  const handleDeleteClick = async (fileId: string) => {
    const confirmed = await toastConfirm(
      "Are you sure you want to delete this document?",
    );
    if (confirmed) {
      await onDelete(fileId);
    }
  };

  const [selectedDocumentType, setSelectedDocumentType] = React.useState<
    "PROPOSAL" | "CV" | "APPLICATION_FORM" | "TRANSCRIPT"
  >("PROPOSAL");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use the selected document type from the dropdown
    await onUpload(file, selectedDocumentType);
    // Reset input
    e.target.value = "";
  };

  return (
    <Card variant="elevated" className="document-checklist-card">
      <h2 className="h-section" style={{ marginBottom: "1.5rem" }}>
        DOCUMENT CHECKLIST
      </h2>

      {documentChecklist && (
        <>
          <div className="checklist-items">
            <div className="summary-field">
              <strong className="summary-label">Research Proposal:</strong>
              <div className="summary-value">
                {documentChecklist.has_proposal ? (
                  <Badge variant="success">✓ Uploaded</Badge>
                ) : (
                  <Badge variant="purple">✗ Missing</Badge>
                )}
              </div>
            </div>

            <div className="summary-field">
              <strong className="summary-label">CV:</strong>
              <div className="summary-value">
                {documentChecklist.has_cv ? (
                  <Badge variant="success">✓ Uploaded</Badge>
                ) : (
                  <Badge variant="purple">✗ Missing</Badge>
                )}
              </div>
            </div>

            <div className="summary-field">
              <strong className="summary-label">Application Form:</strong>
              <div className="summary-value">
                {documentChecklist.has_application_form ? (
                  <Badge variant="success">✓ Uploaded</Badge>
                ) : (
                  <Badge variant="purple">✗ Missing</Badge>
                )}
              </div>
            </div>

            <div className="summary-field">
              <strong className="summary-label">Transcript:</strong>
              <div className="summary-value">
                {documentChecklist.has_transcript ? (
                  <Badge variant="success">✓ Uploaded</Badge>
                ) : (
                  <Badge variant="default">Optional</Badge>
                )}
              </div>
            </div>
          </div>

          {documentChecklist.missing_documents.length > 0 && (
            <div
              className="checklist-warning"
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#E9D5FF",
                border: "1px solid #7B2CBF",
                borderRadius: "4px",
              }}
            >
              <strong style={{ color: "#5A189A" }}>
                Incomplete Application:
              </strong>
              <p style={{ margin: "0.5rem 0 0 0", color: "#5A189A" }}>
                Missing: {documentChecklist.missing_documents.join(", ")}
              </p>
            </div>
          )}
        </>
      )}

      <div
        style={{
          marginTop: "2rem",
          paddingTop: "2rem",
          borderTop: "1px solid #D9D9D9",
        }}
      >
        <h3 className="h-section" style={{ marginBottom: "1rem" }}>
          Upload Document
        </h3>
        <form onSubmit={(e) => e.preventDefault()}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              Select Document Type
            </label>
            <select
              id="document-type-select"
              value={selectedDocumentType}
              onChange={(e) =>
                setSelectedDocumentType(
                  e.target.value as
                    | "PROPOSAL"
                    | "CV"
                    | "APPLICATION_FORM"
                    | "TRANSCRIPT",
                )
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #D9D9D9",
                borderRadius: "4px",
                fontSize: "0.875rem",
                marginBottom: "0.75rem",
              }}
            >
              <option value="PROPOSAL">Research Proposal</option>
              <option value="CV">CV</option>
              <option value="APPLICATION_FORM">Application Form</option>
              <option value="TRANSCRIPT">Transcript</option>
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #D9D9D9",
                borderRadius: "4px",
              }}
            />
          </div>
        </form>
      </div>

      {documents.length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #D9D9D9",
          }}
        >
          <h3 className="h-section" style={{ marginBottom: "1rem" }}>
            Uploaded Documents
          </h3>
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-info">
                  <strong>{doc.file_name ?? doc.filename}</strong>
                  <Badge variant="default">{doc.document_type}</Badge>
                </div>
                <div className="document-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(doc.id, doc.file_name ?? doc.filename)
                    }
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(doc.id)}
                    className="btn-delete"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <p style={{ marginTop: "1rem", color: "#666", fontStyle: "italic" }}>
          No documents uploaded yet
        </p>
      )}
    </Card>
  );
};
