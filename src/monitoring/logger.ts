export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogContext = Record<string, string | number | boolean | undefined>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

const safeContextKeys = new Set([
  'endpoint',
  'method',
  'status',
  'durationMs',
  'category',
  'component',
  'operation',
  'phase',
  'metric',
  'value',
]);

function safeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const entries = Object.entries(context).filter(([key, value]) =>
    safeContextKeys.has(key) &&
    (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
  );
  return entries.length ? Object.fromEntries(entries) as LogContext : undefined;
}

function writeLog(level: LogLevel, message: string, context?: LogContext): void {
  if (level === 'debug' && !import.meta.env.DEV) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(safeContext(context) ? { context: safeContext(context) } : {}),
  };
  const output = JSON.stringify(entry);

  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else if (level === 'debug') console.debug(output);
  else console.info(output);
}

export const logger = {
  info: (message: string, context?: LogContext) => writeLog('info', message, context),
  warn: (message: string, context?: LogContext) => writeLog('warn', message, context),
  error: (message: string, context?: LogContext) => writeLog('error', message, context),
  debug: (message: string, context?: LogContext) => writeLog('debug', message, context),
};
