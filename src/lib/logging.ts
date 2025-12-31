// Comprehensive logging and monitoring system

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxStorageEntries: number;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      enableRemote: false,
      maxStorageEntries: 1000,
      ...config,
    };
    
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandlers(): void {
    // Global error handling
    window.addEventListener('error', (event) => {
      this.error('Global error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private async log(entry: LogEntry): Promise<void> {
    if (entry.level < this.config.level) return;

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Local storage logging
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.logToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const method = this.getConsoleMethod(entry.level);
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}]`;
    
    if (entry.context) {
      method(prefix, entry.message, entry.context);
    } else {
      method(prefix, entry.message);
    }
  }

  private getConsoleMethod(level: LogLevel): Console['log'] | Console['info'] | Console['warn'] | Console['error'] {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private logToStorage(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs();
      logs.push(entry);
      
      // Keep only the most recent entries
      if (logs.length > this.config.maxStorageEntries) {
        logs.splice(0, logs.length - this.config.maxStorageEntries);
      }
      
      localStorage.setItem('medicare_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('medicare_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, context));
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.FATAL, message, context));
  }

  // User tracking
  setUserId(userId: string): void {
    this.userId = userId;
    this.info(`User session started: ${userId}`);
  }

  clearUserId(): void {
    if (this.userId) {
      this.info(`User session ended: ${this.userId}`);
      this.userId = undefined;
    }
  }

  // Performance logging
  logPerformance(name: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${name}`, {
      duration: `${duration}ms`,
      ...context,
    });
  }

  // API logging
  logApiCall(endpoint: string, method: string, duration: number, status: number, error?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const entry = this.createLogEntry(level, `API: ${method} ${endpoint}`, {
      duration: `${duration}ms`,
      status,
      ...(error && { error: error.message || error }),
    });
    this.log(entry);
  }

  // User action logging
  logUserAction(action: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, context);
  }

  // Get logs
  getLogs(level?: LogLevel): LogEntry[] {
    const logs = this.getStoredLogs();
    return level ? logs.filter(log => log.level >= level) : logs;
  }

  // Clear logs
  clearLogs(): void {
    localStorage.removeItem('medicare_logs');
  }

  // Export logs
  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static observers: PerformanceObserver[] = [];

  static startMonitoring(): void {
    // Monitor navigation timing
    this.observeNavigation();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private static observeNavigation(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load', nav.loadEventEnd - nav.loadEventStart);
            this.recordMetric('dom_content_loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
            this.recordMetric('first_paint', nav.responseStart - nav.requestStart);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  private static observeResources(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            const name = resource.name.split('/').pop() || 'unknown';
            this.recordMetric(`resource_${name}`, resource.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  private static observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long_task', entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      p95: sorted[p95Index] || sorted[sorted.length - 1],
    };
  }

  static getAllMetrics(): Record<string, ReturnType<typeof PerformanceMonitor.getMetrics>> {
    const result: Record<string, ReturnType<typeof PerformanceMonitor.getMetrics>> = {};
    
    for (const [name] of this.metrics.entries()) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }

  static stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Error tracking
export class ErrorTracker {
  private static errors: Array<{
    timestamp: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
  }> = [];

  static track(error: Error, context?: Record<string, any>): void {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
    };
    
    this.errors.push(errorEntry);
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }
  }

  static getErrors(): typeof ErrorTracker.errors {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static getErrorStats(): {
    total: number;
    byMessage: Record<string, number>;
    recent: number;
  } {
    const byMessage: Record<string, number> = {};
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let recent = 0;

    this.errors.forEach(error => {
      // Count by message
      byMessage[error.message] = (byMessage[error.message] || 0) + 1;
      
      // Count recent errors
      if (new Date(error.timestamp).getTime() > oneHourAgo) {
        recent++;
      }
    });

    return {
      total: this.errors.length,
      byMessage,
      recent,
    };
  }
}

// Create default logger instance
export const logger = new Logger({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  enableRemote: !import.meta.env.DEV,
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
});

// Initialize monitoring
if (typeof window !== 'undefined') {
  PerformanceMonitor.startMonitoring();
  
  // Log page load
  window.addEventListener('load', () => {
    logger.info('Page loaded successfully');
  });
}

export default {
  logger,
  PerformanceMonitor,
  ErrorTracker,
  LogLevel,
};
