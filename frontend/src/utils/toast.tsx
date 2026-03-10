/**
 * Toast notification utility
 * Provides a consistent API for showing toast notifications
 */
import React from 'react';
import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 */
export const toastSuccess = (message: string) => {
  return toast.success(message, {
    duration: 4000,
    position: 'top-right',
  });
};

/**
 * Show an error toast notification
 */
export const toastError = (message: string) => {
  return toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });
};

/**
 * Show an info toast notification
 */
export const toastInfo = (message: string) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
  });
};

/**
 * Show a warning toast notification
 */
export const toastWarning = (message: string) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: '⚠️',
  });
};

/**
 * Show a loading toast notification
 */
export const toastLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

/**
 * Show a promise toast (for async operations)
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages, {
    position: 'top-right',
  });
};

/**
 * Confirm dialog using toast (non-blocking alternative to window.confirm)
 * Returns a promise that resolves to true/false
 * Note: This is a simple implementation. For critical confirmations, consider a modal dialog.
 */
export const toastConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const toastId = toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>{message}</span>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#BE1E2D',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Don't auto-dismiss
        position: 'top-center',
      }
    );
  });
};

