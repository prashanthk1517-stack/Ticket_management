import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  clearApplicationErrors,
  getApplicationErrors,
} from '../monitoring/errorReporter';
import { logger } from '../monitoring/logger';

afterEach(() => {
  cleanup();
  clearApplicationErrors();
  vi.restoreAllMocks();
});

describe('frontend monitoring', () => {
  it('writes timestamped structured logs without unsafe context fields', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('Request completed.', {
      endpoint: 'tickets.getTickets',
      method: 'GET',
      status: 200,
      token: 'private-token',
      password: 'private-password',
    });

    const output = String(info.mock.calls[0][0]);
    expect(output).toContain('"timestamp"');
    expect(output).toContain('tickets.getTickets');
    expect(output).not.toContain('private-token');
    expect(output).not.toContain('private-password');
  });

  it('catches a rendering failure, shows recovery UI, and reports safe context', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function FailingOnDemand() {
      const [fail, setFail] = useState(false);
      if (fail) throw new Error('Failure details should not appear in telemetry.');
      return (
        <button type="button" onClick={() => setFail(true)}>
          Break component
        </button>
      );
    }

    render(
      <ErrorBoundary>
        <FailingOnDemand />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Break component' }));

    expect(screen.getByRole('alert').textContent).toContain('ran into a problem');
    expect(getApplicationErrors()).toEqual([
      expect.objectContaining({
        source: 'react-boundary',
        errorName: 'Error',
        message: 'Application error captured.',
      }),
    ]);
    expect(JSON.stringify(getApplicationErrors()))
      .not.toContain('Failure details should not appear');
  });
});
