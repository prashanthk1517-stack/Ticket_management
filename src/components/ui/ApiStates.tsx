import { Alert } from './Feedback/Feedback';
import { normalizeApiError, type ApiError } from '../../app/api/baseQuery';

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('status' in value)) return false;
  const status = value.status;
  return typeof status === 'number' || status === 'FETCH_ERROR' || status === 'CUSTOM_ERROR';
}

export function toApiError(value: unknown): ApiError {
  if (isApiError(value)) return normalizeApiError(value.status);
  return normalizeApiError('CUSTOM_ERROR');
}

export function ApiErrorMessage({
  error,
  onRetry,
  retrying = false,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const safeError = toApiError(error);
  return (
    <Alert variant="error" className="support-api-error">
      <span>{safeError.message}</span>
      {onRetry && (safeError.kind === 'network' || safeError.status === 503) && (
        <button type="button" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Retry tickets'}
        </button>
      )}
    </Alert>
  );
}

export function LoadingSpinner({ label = 'Loading tickets…' }: { label?: string }) {
  return (
    <div className="support-api-loading" role="status" aria-live="polite">
      <span className="support-api-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({
  title = 'No tickets found',
  message = 'Try changing your search or filters to find tickets.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="support-empty">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
