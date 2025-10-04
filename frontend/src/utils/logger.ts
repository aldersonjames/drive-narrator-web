export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (this.isDevelopment) {
      console[level](`[${entry.timestamp}] ${message}`, data || '');
    }

    // In production, you might want to send logs to a service
    // this.sendToLogService(entry);
  }

  private sendToLogService(_entry: LogEntry): void {
    // Implement log service integration here
    // e.g., send to Sentry, LogRocket, or custom logging service
  }
}

export const logger = new Logger();
