/**
 * Logger - Sistema de logging para debug del engine
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

class EngineLogger {
  private enabled: boolean = true;
  private minLevel: LogLevel = 'debug';
  private history: LogEntry[] = [];
  private maxHistory: number = 1000;
  private categoryFilters: Set<string> = new Set();
  
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private styles: Record<LogLevel, string> = {
    debug: 'color: #888; font-style: italic;',
    info: 'color: #4CAF50; font-weight: bold;',
    warn: 'color: #FF9800; font-weight: bold;',
    error: 'color: #f44336; font-weight: bold;',
  };

  /**
   * Configura el logger
   */
  configure(options: {
    enabled?: boolean;
    minLevel?: LogLevel;
    maxHistory?: number;
    categoryFilters?: string[];
  }) {
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.minLevel !== undefined) this.minLevel = options.minLevel;
    if (options.maxHistory !== undefined) this.maxHistory = options.maxHistory;
    if (options.categoryFilters) {
      this.categoryFilters = new Set(options.categoryFilters);
    }
  }

  /**
   * Verifica si debería loggear
   */
  private shouldLog(level: LogLevel, category: string): boolean {
    if (!this.enabled) return false;
    if (this.levels[level] < this.levels[this.minLevel]) return false;
    if (this.categoryFilters.size > 0 && !this.categoryFilters.has(category)) return false;
    return true;
  }

  /**
   * Log interno
   */
  private log(level: LogLevel, category: string, message: string, data?: unknown) {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    // Agregar al historial
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Output a consola
    const prefix = `[${level.toUpperCase()}] [${category}]`;
    const style = this.styles[level];

    if (data !== undefined) {
      console.log(`%c${prefix} ${message}`, style, data);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }
  }

  // Métodos públicos de logging
  debug(category: string, message: string, data?: unknown) {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: unknown) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: unknown) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: unknown) {
    this.log('error', category, message, data);
  }

  /**
   * Crea un logger con categoría preconfigurada
   */
  createCategory(category: string) {
    return {
      debug: (message: string, data?: unknown) => this.debug(category, message, data),
      info: (message: string, data?: unknown) => this.info(category, message, data),
      warn: (message: string, data?: unknown) => this.warn(category, message, data),
      error: (message: string, data?: unknown) => this.error(category, message, data),
    };
  }

  /**
   * Obtiene el historial de logs
   */
  getHistory(filter?: { level?: LogLevel; category?: string; limit?: number }): LogEntry[] {
    let result = [...this.history];

    if (filter?.level) {
      result = result.filter(e => e.level === filter.level);
    }
    if (filter?.category) {
      result = result.filter(e => e.category === filter.category);
    }
    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Timer para medir performance
   */
  time(label: string): () => number {
    const start = performance.now();
    return () => {
      const elapsed = performance.now() - start;
      this.debug('Performance', `${label}: ${elapsed.toFixed(2)}ms`);
      return elapsed;
    };
  }

  /**
   * Group para agrupar logs
   */
  group(label: string, fn: () => void) {
    console.group(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Table para mostrar datos tabulares
   */
  table(data: unknown[], columns?: string[]) {
    if (this.enabled) {
      console.table(data, columns);
    }
  }
}

// Instancia singleton
export const logger = new EngineLogger();

// Loggers por categoría (preconfigurados)
export const engineLog = logger.createCategory('Engine');
export const physicsLog = logger.createCategory('Physics');
export const renderLog = logger.createCategory('Render');
export const inputLog = logger.createCategory('Input');
export const audioLog = logger.createCategory('Audio');
export const networkLog = logger.createCategory('Network');
export const aiLog = logger.createCategory('AI');

export default logger;
