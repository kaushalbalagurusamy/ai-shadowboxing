export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  conversationId?: string;
  traceId?: string;
  event?: string;
  [key: string]: unknown;
}

export class Logger {
  private defaultContext: LogContext;

  constructor(context: LogContext = {}) {
    this.defaultContext = context;
  }

  public child(extraContext: LogContext): Logger {
    return new Logger({ ...this.defaultContext, ...extraContext });
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const merged = { ...this.defaultContext, ...context };
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...merged,
    };
    return JSON.stringify(logEntry);
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack } 
      : { errorMessage: String(error) };

    console.error(this.formatMessage('error', message, { ...errorDetails, ...context }));
  }
}

export const logger = new Logger({ service: 'ai-shadowboxing' });
