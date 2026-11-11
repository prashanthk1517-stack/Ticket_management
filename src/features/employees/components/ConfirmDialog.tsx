import { Button, Modal } from '../../../components/ui';

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
  return (
    <Modal
      open
      onClose={onCancel}
      role="alertdialog"
      ariaLabelledBy="confirm-title"
      className="confirm-card"
      size="sm"
    >
      <Modal.Header className="confirm-heading">
        <div className="confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13a2 2 0 0 0-3.4-.1Z" /></svg>
        </div>
        <h2 id="confirm-title">Delete employee?</h2>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete <strong>{employeeName}</strong>? This action cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer className="form-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" className="button--danger" onClick={onConfirm}>
          Delete employee
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
