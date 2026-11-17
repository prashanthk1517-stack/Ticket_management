import { useMemo, useSyncExternalStore, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getApiMeasurements,
  getApiSummary,
  subscribeToApiMeasurements,
} from '../monitoring/apiMonitor';
import {
  getApplicationErrors,
  subscribeToApplicationErrors,
} from '../monitoring/errorReporter';
import {
  getPerformanceMeasurements,
  subscribeToPerformanceMeasurements,
} from '../monitoring/performanceMonitor';

function DevErrorProbe({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Deliberate development-only rendering failure.');
  return null;
}

export function MonitoringDashboard() {
  const [triggerError, setTriggerError] = useState(false);
  const apiSummary = useSyncExternalStore(subscribeToApiMeasurements, getApiSummary);
  const apiMeasurements = useSyncExternalStore(
    subscribeToApiMeasurements,
    getApiMeasurements,
  );
  const errors = useSyncExternalStore(
    subscribeToApplicationErrors,
    getApplicationErrors,
  );
  const performanceMeasurements = useSyncExternalStore(
    subscribeToPerformanceMeasurements,
    getPerformanceMeasurements,
  );
  const recentMeasurements = useMemo(
    () => performanceMeasurements.slice(0, 10),
    [performanceMeasurements],
  );
  const recentRequests = apiMeasurements.slice(0, 10);

  return (
    <main className="support-overview monitoring-dashboard">
      <p className="eyebrow">INTERNAL TOOLS</p>
      <h1>Monitoring dashboard</h1>
      <p>Local in-memory diagnostics for this browser session.</p>

      <section className="support-stats" aria-label="API request statistics">
        <article><span>Total API requests</span><strong>{apiSummary.totalRequests}</strong></article>
        <article><span>Successful requests</span><strong>{apiSummary.successfulRequests}</strong></article>
        <article><span>Failed requests</span><strong>{apiSummary.failedRequests}</strong></article>
        <article>
          <span>Average response duration</span>
          <strong>{apiSummary.averageDurationMs.toFixed(2)} ms</strong>
        </article>
      </section>

      <section className="monitor-panel" aria-labelledby="api-activity-title">
        <h2 id="api-activity-title">Recent API activity</h2>
        {recentRequests.length ? (
          <div className="monitor-table-wrap">
            <table className="monitor-table">
              <thead>
                <tr><th>Operation</th><th>Method</th><th>Status</th><th>Duration</th><th>Result</th></tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.endpoint}</td>
                    <td>{request.method}</td>
                    <td>{request.status}</td>
                    <td>{request.durationMs.toFixed(2)} ms</td>
                    <td>{request.success ? 'Success' : 'Failed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No API requests recorded yet.</p>}
      </section>

      <section className="monitor-panel" aria-labelledby="frequent-failures-title">
        <h2 id="frequent-failures-title">Frequently failing operations</h2>
        {apiSummary.frequentFailures.length ? (
          <ul className="monitor-list">
            {apiSummary.frequentFailures.map((failure) => (
              <li key={failure.endpoint}>
                <span>{failure.endpoint}</span><strong>{failure.count} failures</strong>
              </li>
            ))}
          </ul>
        ) : <p>No failed API operations recorded.</p>}
      </section>

      <section className="monitor-panel" aria-labelledby="performance-title">
        <h2 id="performance-title">Performance measurements</h2>
        {recentMeasurements.length ? (
          <ul className="monitor-list">
            {recentMeasurements.map((measurement) => (
              <li key={measurement.id}>
                <span>{measurement.name}</span>
                <strong>
                  {measurement.value.toFixed(2)}
                  {measurement.unit === 'ms' ? ' ms' : ''}
                </strong>
              </li>
            ))}
          </ul>
        ) : <p>Performance entries are not available in this browser session yet.</p>}
      </section>

      <section className="monitor-panel" aria-labelledby="application-errors-title">
        <h2 id="application-errors-title">Recent application errors</h2>
        {errors.length ? (
          <ul className="monitor-list">
            {errors.slice(0, 10).map((error) => (
              <li key={error.id}>
                <span>{error.timestamp} · {error.source} · {error.errorName}</span>
                <strong>{error.endpoint ? `${error.endpoint} (${error.status})` : error.message}</strong>
              </li>
            ))}
          </ul>
        ) : <p>No application errors recorded.</p>}
      </section>

      {import.meta.env.DEV && (
        <section className="monitor-panel" aria-labelledby="error-test-title">
          <h2 id="error-test-title">Development error-boundary test</h2>
          <p>Trigger a deliberate render error to verify the global fallback and reporting.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setTriggerError(true)}
          >
            Trigger test error
          </button>
          <DevErrorProbe shouldThrow={triggerError} />
        </section>
      )}

      <Link className="button button--primary" to="/tickets">Back to tickets</Link>
      <p className="monitor-disclaimer">
        Demonstration data is held in memory and cleared on reload. It is not persistent
        production telemetry, and no data is sent to an external monitoring service.
      </p>
    </main>
  );
}
