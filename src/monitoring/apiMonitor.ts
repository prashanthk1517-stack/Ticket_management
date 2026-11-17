import type { BaseQueryApi, BaseQueryFn, QueryReturnValue } from '@reduxjs/toolkit/query';
import type { ApiError, TicketApiRequest } from '../app/api/baseQuery';
import { reportApiFailure } from './errorReporter';
import { logger } from './logger';

export interface ApiRequestMeasurement {
  id: number;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number | string;
  durationMs: number;
  success: boolean;
}

export interface ApiSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDurationMs: number;
  frequentFailures: Array<{ endpoint: string; count: number }>;
}

const MAX_REQUESTS = 500;
const methods: Record<TicketApiRequest['operation'], string> = {
  getTickets: 'GET',
  createTicket: 'POST',
  updateTicketDetails: 'PATCH',
  updateTicketStatus: 'PATCH',
  updateTicketPriority: 'PATCH',
  assignTicket: 'PATCH',
  deleteTicket: 'DELETE',
};
let nextRequestId = 1;
let requests: ApiRequestMeasurement[] = [];
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalDurationMs = 0;
let failuresByEndpoint = new Map<string, number>();
let summary: ApiSummary = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageDurationMs: 0,
  frequentFailures: [],
};
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function recordRequest(request: Omit<ApiRequestMeasurement, 'id' | 'timestamp'>): void {
  const measurement = {
    ...request,
    id: nextRequestId++,
    timestamp: new Date().toISOString(),
  };
  requests = [measurement, ...requests].slice(0, MAX_REQUESTS);
  totalRequests += 1;
  totalDurationMs += measurement.durationMs;
  if (measurement.success) successfulRequests += 1;
  else {
    failedRequests += 1;
    failuresByEndpoint.set(
      measurement.endpoint,
      (failuresByEndpoint.get(measurement.endpoint) ?? 0) + 1,
    );
  }
  summary = {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageDurationMs: totalRequests
      ? Math.round((totalDurationMs / totalRequests) * 100) / 100
      : 0,
    frequentFailures: [...failuresByEndpoint.entries()]
      .map(([failedEndpoint, count]) => ({ endpoint: failedEndpoint, count }))
      .sort((left, right) => right.count - left.count),
  };
  notify();

  if (measurement.success) {
    logger.info('API request completed.', {
      endpoint: measurement.endpoint,
      method: measurement.method,
      status: measurement.status,
      durationMs: measurement.durationMs,
    });
  } else {
    logger.error('API request failed.', {
      endpoint: measurement.endpoint,
      method: measurement.method,
      status: measurement.status,
      durationMs: measurement.durationMs,
      category: 'api',
    });
    reportApiFailure(measurement.endpoint, measurement.status);
  }
}

export function monitorApiQuery(
  baseQuery: BaseQueryFn<TicketApiRequest, unknown, ApiError>,
): BaseQueryFn<TicketApiRequest, unknown, ApiError> {
  return async (
    request: TicketApiRequest,
    api: BaseQueryApi,
    extraOptions: Record<string, never>,
  ): Promise<QueryReturnValue<unknown, ApiError, Record<string, never>>> => {
    const startedAt = performance.now();
    const endpoint = `tickets.${request.operation}`;
    const method = methods[request.operation];
    try {
      const result = await baseQuery(request, api, extraOptions);
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      const failure = result.error !== undefined;
      const status = result.error?.status ?? 200;
      recordRequest({
        endpoint,
        method,
        status,
        durationMs,
        success: !failure,
      });
      return result;
    } catch (error) {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      recordRequest({
        endpoint,
        method,
        status: 'NETWORK_ERROR',
        durationMs,
        success: false,
      });
      throw error;
    }
  };
}

export function getApiMeasurements(): readonly ApiRequestMeasurement[] {
  return requests;
}

export function subscribeToApiMeasurements(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApiSummary(): ApiSummary {
  return summary;
}

export function clearApiMeasurements(): void {
  requests = [];
  totalRequests = 0;
  successfulRequests = 0;
  failedRequests = 0;
  totalDurationMs = 0;
  failuresByEndpoint = new Map();
  summary = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageDurationMs: 0,
    frequentFailures: [],
  };
  notify();
}
