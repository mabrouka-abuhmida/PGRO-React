/**
 * AllocationNotes component - Display and manage notes for an allocation
 */
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Badge } from "@/components";
import { allocationNoteService } from "@/services/allocationNoteService";
import { logger } from "@/utils/logger";
import { getErrorMessage } from "@/types";
import { toastError, toastConfirm } from "@/utils/toast";
import type {
  AllocationNote,
  AllocationNoteCreate,
  AllocationNoteReply,
} from "@/types";
import "./AllocationNotes.css";

interface AllocationNotesProps {
  allocationId: string;
  canCreate?: boolean; // Whether the user can create new notes (PGRO admin)
}

export const AllocationNotes: React.FC<AllocationNotesProps> = ({
  allocationId,
  canCreate = false,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<AllocationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState("");
  const [sendToStaff, setSendToStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await allocationNoteService.list(allocationId);
      setNotes(data);
      // Auto-expand all notes
      const allNoteIds = new Set<string>();
      data.forEach((note) => {
        allNoteIds.add(note.id);
        note.replies?.forEach((reply) => allNoteIds.add(reply.id));
      });
      setExpandedNotes(allNoteIds);
    } catch (error) {
      logger.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  }, [allocationId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async () => {
    if (!newNoteText.trim() || !user) return;

    try {
      setSubmitting(true);
      const noteData: AllocationNoteCreate = {
        note_text: newNoteText.trim(),
        send_to_staff: sendToStaff,
        author_user_id: user.id,
      };
      await allocationNoteService.create(allocationId, noteData);
      setNewNoteText("");
      setSendToStaff(false);
      setShowCreateForm(false);
      await loadNotes();
    } catch (error: unknown) {
      logger.error("Error creating note:", error);
      toastError(getErrorMessage(error, "Failed to create note"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentNoteId: string) => {
    if (!replyText.trim() || !user) return;

    try {
      setSubmitting(true);
      const replyData: AllocationNoteReply = {
        note_text: replyText.trim(),
        author_user_id: user.id,
      };
      await allocationNoteService.reply(allocationId, parentNoteId, replyData);
      setReplyText("");
      setReplyingTo(null);
      await loadNotes();
    } catch (error: unknown) {
      logger.error("Error replying to note:", error);
      toastError(getErrorMessage(error, "Failed to reply"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editText.trim() || !user) return;

    try {
      setSubmitting(true);
      await allocationNoteService.update(allocationId, noteId, {
        note_text: editText.trim(),
        author_user_id: user.id,
      });
      setEditText("");
      setEditingNote(null);
      await loadNotes();
    } catch (error: unknown) {
      logger.error("Error updating note:", error);
      toastError(getErrorMessage(error, "Failed to update note"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!user) return;

    const confirmed = await toastConfirm(
      "Are you sure you want to delete this note?",
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await allocationNoteService.delete(allocationId, noteId, user.id);
      await loadNotes();
    } catch (error: unknown) {
      logger.error("Error deleting note:", error);
      toastError(getErrorMessage(error, "Failed to delete note"));
    } finally {
      setSubmitting(false);
    }
  };

  const canEditNote = (note: AllocationNote): boolean => {
    // Compare by email since frontend has mock IDs and backend has real UUIDs
    // Case-insensitive comparison
    const userEmail = user?.email?.toLowerCase();
    const authorEmail = note.author_email?.toLowerCase();
    return userEmail === authorEmail;
  };

  const canReplyToNote = (note: AllocationNote): boolean => {
    // Staff can reply to admin notes, admins can reply to any note
    if (!user) return false;
    if (user.role === "PGR_LEAD" || user.role === "ADMIN") return true;
    if (
      user.role === "STAFF" &&
      (note.author_role === "PGR_LEAD" || note.author_role === "ADMIN")
    ) {
      return true;
    }
    return false;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const toggleNoteExpanded = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="allocation-notes-loading">Loading notes...</div>;
  }

  return (
    <div className="allocation-notes">
      <div className="allocation-notes-header">
        <h3>Notes & Communication</h3>
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={submitting}
          >
            {showCreateForm ? "Cancel" : "+ Add Note"}
          </Button>
        )}
      </div>

      {showCreateForm && canCreate && (
        <div className="allocation-notes-create-form">
          <textarea
            className="allocation-notes-textarea"
            placeholder="Enter your note..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={4}
            disabled={submitting}
          />
          <div className="allocation-notes-form-actions">
            <label className="allocation-notes-checkbox">
              <input
                type="checkbox"
                checked={sendToStaff}
                onChange={(e) => setSendToStaff(e.target.checked)}
                disabled={submitting}
              />
              <span>Send to staff via email</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNoteText.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="allocation-notes-empty">
          <p>No notes yet. {canCreate && "Create the first note above."}</p>
        </div>
      ) : (
        <div className="allocation-notes-list">
          {notes.map((note) => (
            <div key={note.id}>
              <NoteItem
                note={note}
                canEdit={canEditNote(note)}
                canReply={canReplyToNote(note)}
                isExpanded={expandedNotes.has(note.id)}
                isReplying={replyingTo === note.id}
                onToggleExpanded={() => toggleNoteExpanded(note.id)}
                onReply={() => {
                  setReplyingTo(note.id);
                  setReplyText("");
                }}
                onEdit={() => {
                  setEditingNote(note.id);
                  setEditText(note.note_text);
                }}
                onDelete={() => handleDelete(note.id)}
                replyText={replyingTo === note.id ? replyText : ""}
                onReplyTextChange={(text) => setReplyText(text)}
                onReplySubmit={() => handleReply(note.id)}
                editText={editingNote === note.id ? editText : ""}
                onEditTextChange={(text) => setEditText(text)}
                onEditSubmit={() => handleEdit(note.id)}
                onEditCancel={() => {
                  setEditingNote(null);
                  setEditText("");
                }}
                submitting={submitting}
                formatDate={formatDate}
                user={user}
                hasReplies={note.replies ? note.replies.length > 0 : false}
                renderReplies={() =>
                  note.replies &&
                  note.replies.length > 0 &&
                  expandedNotes.has(note.id) ? (
                    <div className="allocation-note-replies">
                      {note.replies.map((reply) => (
                        <NoteItem
                          key={reply.id}
                          note={reply}
                          canEdit={canEditNote(reply)}
                          canReply={false}
                          isExpanded={true}
                          isReplying={false}
                          onToggleExpanded={() => {}}
                          onReply={() => {}}
                          onEdit={() => {
                            setEditingNote(reply.id);
                            setEditText(reply.note_text);
                          }}
                          onDelete={() => handleDelete(reply.id)}
                          replyText=""
                          onReplyTextChange={() => {}}
                          onReplySubmit={() => {}}
                          editText={editingNote === reply.id ? editText : ""}
                          onEditTextChange={(text) => setEditText(text)}
                          onEditSubmit={() => handleEdit(reply.id)}
                          onEditCancel={() => {
                            setEditingNote(null);
                            setEditText("");
                          }}
                          submitting={submitting}
                          formatDate={formatDate}
                          user={user}
                          hasReplies={false}
                          renderReplies={() => null}
                        />
                      ))}
                    </div>
                  ) : null
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface NoteItemProps {
  note: AllocationNote;
  canEdit: boolean;
  canReply: boolean;
  isExpanded: boolean;
  isReplying: boolean;
  onToggleExpanded: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: () => void;
  editText: string;
  onEditTextChange: (text: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  submitting: boolean;
  formatDate: (date: string) => string;
  user: { id: string; email?: string; role?: string } | null;
  hasReplies: boolean;
  renderReplies: () => React.ReactNode;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  canEdit,
  canReply,
  isExpanded,
  isReplying,
  onToggleExpanded,
  onReply,
  onEdit,
  onDelete,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  editText,
  onEditTextChange,
  onEditSubmit,
  onEditCancel,
  submitting,
  formatDate,
  user: _user,
  hasReplies,
  renderReplies,
}) => {
  const isEditing = editText !== "";

  return (
    <div
      className={`allocation-note-item ${note.parent_note_id ? "allocation-note-reply" : ""}`}
    >
      <div className="allocation-note-header">
        <div className="allocation-note-author">
          <strong>{note.author_name || "Unknown User"}</strong>
          {note.author_role && (
            <Badge
              variant={
                note.author_role === "PGR_LEAD" || note.author_role === "ADMIN"
                  ? "info"
                  : "default"
              }
            >
              {note.author_role.replace("_", " ")}
            </Badge>
          )}
          {note.is_sent_to_staff && (
            <Badge
              variant="success"
              title={`Sent to staff on ${note.sent_at ? formatDate(note.sent_at) : "unknown"}`}
            >
              📧 Sent
            </Badge>
          )}
        </div>
        <div className="allocation-note-meta">
          <span className="allocation-note-date">
            {formatDate(note.created_at)}
          </span>
          {note.updated_at && note.updated_at !== note.created_at && (
            <span className="allocation-note-edited">(edited)</span>
          )}
          {hasReplies && (
            <button
              className="allocation-note-toggle"
              onClick={onToggleExpanded}
              type="button"
            >
              {isExpanded ? "▼" : "▶"} {note.replies?.length || 0}{" "}
              {note.replies?.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>

      <div className="allocation-note-content">
        {isEditing ? (
          <div className="allocation-note-edit-form">
            <textarea
              className="allocation-notes-textarea"
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <div className="allocation-note-edit-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditSubmit}
                disabled={!editText.trim() || submitting}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="allocation-note-text">{note.note_text}</div>
        )}
      </div>

      <div className="allocation-note-actions">
        {canReply && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReply}
            disabled={submitting || isReplying}
          >
            Reply
          </Button>
        )}
        {canEdit && !isEditing && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={submitting}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={submitting}
              className="btn-delete"
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {isReplying && (
        <div className="allocation-note-reply-form">
          <textarea
            className="allocation-notes-textarea"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            rows={3}
            disabled={submitting}
          />
          <div className="allocation-note-reply-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={onReplySubmit}
              disabled={!replyText.trim() || submitting}
            >
              {submitting ? "Sending..." : "Send Reply"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReplyTextChange("");
                onReply();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {renderReplies()}
    </div>
  );
};
