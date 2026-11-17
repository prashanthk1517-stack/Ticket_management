import { logger } from './logger';

export interface PerformanceMeasurement {
  id: number;
  timestamp: string;
  name: string;
  value: number;
  unit: 'ms' | 'unitless';
}

const MAX_MEASUREMENTS = 100;
let nextMeasurementId = 1;
let measurements: PerformanceMeasurement[] = [];
const listeners = new Set<() => void>();
let initialized = false;
let cumulativeLayoutShift = 0;
let largestInteractionDuration = 0;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function recordPerformanceMeasurement(
  name: string,
  value: number,
  unit: PerformanceMeasurement['unit'] = 'ms',
): void {
  if (!Number.isFinite(value) || value < 0) return;

  measurements = [{
    id: nextMeasurementId++,
    timestamp: new Date().toISOString(),
    name,
    value: Math.round(value * 100) / 100,
    unit,
  }, ...measurements].slice(0, MAX_MEASUREMENTS);
  notify();
  logger.debug('Performance measurement recorded.', {
    metric: name,
    value: Math.round(value * 100) / 100,
  });
}

function recordNavigationMetrics(): void {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!navigation) return;

  if (navigation.responseStart > 0) {
    recordPerformanceMeasurement('Time to First Byte', navigation.responseStart - navigation.startTime);
  }
  if (navigation.domContentLoadedEventEnd > 0) {
    recordPerformanceMeasurement('DOM content loaded', navigation.domContentLoadedEventEnd - navigation.startTime);
  }
  if (navigation.loadEventEnd > 0) {
    recordPerformanceMeasurement('Page load', navigation.loadEventEnd - navigation.startTime);
  } else {
    recordPerformanceMeasurement('Page load', performance.now());
  }

  const paintEntries = performance.getEntriesByType('paint');
  for (const entry of paintEntries) {
    if (entry.name === 'first-contentful-paint') {
      recordPerformanceMeasurement('First Contentful Paint', entry.startTime);
    }
  }
}

export function initializePerformanceMonitoring(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if (document.readyState === 'complete') recordNavigationMetrics();
  else window.addEventListener('load', recordNavigationMetrics, { once: true });

  if (typeof PerformanceObserver === 'undefined') return;

  const observe = (
    type: string,
    callback: (entry: PerformanceEntry) => void,
    options?: PerformanceObserverInit,
  ) => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe(options ?? { type, buffered: true });
    } catch {
      // Unsupported entry types are optional across browsers.
    }
  };

  observe('largest-contentful-paint', (entry) => {
    recordPerformanceMeasurement('Largest Contentful Paint', entry.startTime);
  });
  observe('layout-shift', (entry) => {
    const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
    if (!shift.hadRecentInput && shift.value) {
      cumulativeLayoutShift += shift.value;
      recordPerformanceMeasurement('Cumulative Layout Shift', cumulativeLayoutShift, 'unitless');
    }
  });
  observe('event', (entry) => {
    if (entry.duration > largestInteractionDuration) {
      largestInteractionDuration = entry.duration;
      recordPerformanceMeasurement('Interaction to Next Paint', largestInteractionDuration);
    }
  }, { type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
}

export function getPerformanceMeasurements(): readonly PerformanceMeasurement[] {
  return measurements;
}

export function subscribeToPerformanceMeasurements(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearPerformanceMeasurements(): void {
  measurements = [];
  notify();
}
