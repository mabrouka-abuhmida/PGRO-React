/**
 * ProposalTextModal - Modal component for displaying proposal text
 */
import React from 'react';
import { useModal } from '@/hooks/useModal';
import { sanitizePreText } from '@/utils/sanitize';
import './ProposalTextModal.css';

interface ProposalTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export const ProposalTextModal: React.FC<ProposalTextModalProps> = ({
  isOpen,
  onClose,
  text,
}) => {
  const { handleOverlayClick } = useModal({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
    >
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="proposal-modal-title" className="h-section">Proposal Text</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close proposal text modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <pre className="raw-text-modal">{sanitizePreText(text)}</pre>
        </div>
      </div>
    </div>
  );
};

