import { useEffect } from 'react';

interface ConfirmDialogProps {
  employeeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  employeeName,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="dialog-card confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13a2 2 0 0 0-3.4-.1Z" /></svg>
        </div>
        <h2 id="confirm-title">Delete employee?</h2>
        <p id="confirm-description">
          Are you sure you want to delete <strong>{employeeName}</strong>? This action cannot be undone.
        </p>
        <div className="form-actions">
          <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className="button button--danger" type="button" onClick={onConfirm}>Delete employee</button>
        </div>
      </section>
    </div>
  );
}
