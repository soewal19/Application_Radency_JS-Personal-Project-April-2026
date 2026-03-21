/**
 * @module Logger
 * @description Structured logging utility following 12-factor app methodology.
 * Supports log levels, timestamps, and context metadata.
 * In production, logs can be forwarded to external services (Datadog, Sentry, etc.)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: unknown;
  stack?: string;
}

const LOG_LEVEL = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;

const formatEntry = (entry: LogEntry): string => {
  const emoji = entry.level === 'ERROR' ? '❌' : entry.level === 'WARN' ? '⚠️' : entry.level === 'INFO' ? 'ℹ️' : '🔍';
  return `${emoji} [${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ''} ${entry.message}`;
};

const createEntry = (level: string, message: string, context?: string, data?: unknown): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
  data,
});

export const logger = {
  debug(message: string, context?: string, data?: unknown) {
    if (LOG_LEVEL > LogLevel.DEBUG) return;
    const entry = createEntry('DEBUG', message, context, data);
    console.debug(formatEntry(entry), data ?? '');
  },

  info(message: string, context?: string, data?: unknown) {
    if (LOG_LEVEL > LogLevel.INFO) return;
    const entry = createEntry('INFO', message, context, data);
    console.info(formatEntry(entry), data ?? '');
  },

  warn(message: string, context?: string, data?: unknown) {
    if (LOG_LEVEL > LogLevel.WARN) return;
    const entry = createEntry('WARN', message, context, data);
    console.warn(formatEntry(entry), data ?? '');
  },

  error(message: string, context?: string, error?: unknown) {
    const entry = createEntry('ERROR', message, context);
    if (error instanceof Error) {
      entry.stack = error.stack;
      entry.data = { name: error.name, message: error.message };
    } else {
      entry.data = error;
    }
    console.error(formatEntry(entry), entry.data ?? '');
  },

  /** Log navigation events */
  navigation(path: string, status: number = 200) {
    this.info(`Navigation → ${path} [${status}]`, 'Router');
  },

  /** Log API requests */
  api(method: string, url: string, status?: number, duration?: number) {
    const msg = `${method.toUpperCase()} ${url}${status ? ` → ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    if (status && status >= 400) {
      this.error(msg, 'API');
    } else {
      this.info(msg, 'API');
    }
  },

  /** Log store actions */
  store(storeName: string, action: string, data?: unknown) {
    this.debug(`${action}`, `Store:${storeName}`, data);
  },
};
