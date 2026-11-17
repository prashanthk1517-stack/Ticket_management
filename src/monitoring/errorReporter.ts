import { logger } from './logger';

export type ErrorSource = 'react-boundary' | 'window' | 'unhandled-rejection' | 'api';

export interface ApplicationError {
  id: number;
  timestamp: string;
  source: ErrorSource;
  errorName: string;
  message: string;
  endpoint?: string;
  status?: number | string;
}

const MAX_ERRORS = 50;
let nextErrorId = 1;
let errors: ApplicationError[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function errorName(error: unknown): string {
  if (error instanceof Error && error.name.length <= 80) return error.name;
  return 'Error';
}

function addError(entry: Omit<ApplicationError, 'id' | 'timestamp'>): void {
  errors = [{
    ...entry,
    id: nextErrorId++,
    timestamp: new Date().toISOString(),
  }, ...errors].slice(0, MAX_ERRORS);
  notify();
}

export function reportApplicationError(
  error: unknown,
  source: Exclude<ErrorSource, 'api'>,
  component?: string,
): void {
  addError({
    source,
    errorName: errorName(error),
    message: 'Application error captured.',
  });
  logger.error('Application error captured.', {
    category: source,
    component,
    operation: errorName(error),
  });
}

export function reportApiFailure(endpoint: string, status: number | string): void {
  addError({
    source: 'api',
    errorName: 'ApiError',
    message: 'An API request failed.',
    endpoint,
    status,
  });
}

export function getApplicationErrors(): readonly ApplicationError[] {
  return errors;
}

export function subscribeToApplicationErrors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) => {
    reportApplicationError(event.error, 'window');
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportApplicationError(event.reason, 'unhandled-rejection');
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}

export function clearApplicationErrors(): void {
  errors = [];
  notify();
}
