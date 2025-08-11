/**
 * Logger utility for debugging and monitoring
 */
export class Logger {
  static LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  }

  static globalLevel = Logger.LogLevel.INFO
  static enableTimestamps = true
  static enableColors = true

  constructor(name) {
    this.name = name
    this.level = Logger.globalLevel
  }

  /**
   * Set global log level
   * @param {number} level - Log level
   */
  static setGlobalLevel(level) {
    Logger.globalLevel = level
  }

  /**
   * Set logger instance level
   * @param {number} level - Log level
   */
  setLevel(level) {
    this.level = level
  }

  /**
   * Format log message
   * @param {string} level - Log level name
   * @param {string} message - Message
   * @returns {string}
   */
  formatMessage(level, message) {
    let formatted = ''
    
    if (Logger.enableTimestamps) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
      formatted += `[${timestamp}] `
    }
    
    formatted += `[${level}] [${this.name}] ${message}`
    
    return formatted
  }

  /**
   * Get console style for log level
   * @param {string} level - Log level name
   * @returns {string}
   */
  getStyle(level) {
    if (!Logger.enableColors) return ''
    
    switch (level) {
      case 'DEBUG': return 'color: #888'
      case 'INFO': return 'color: #4CAF50'
      case 'WARN': return 'color: #FFC107'
      case 'ERROR': return 'color: #F44336; font-weight: bold'
      default: return ''
    }
  }

  /**
   * Log debug message
   * @param {...any} args - Log arguments
   */
  debug(...args) {
    if (this.level <= Logger.LogLevel.DEBUG) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ')
      
      const formatted = this.formatMessage('DEBUG', message)
      const style = this.getStyle('DEBUG')
      
      if (style) {
        console.log(`%c${formatted}`, style)
      } else {
        console.log(formatted)
      }
    }
  }

  /**
   * Log info message
   * @param {...any} args - Log arguments
   */
  info(...args) {
    if (this.level <= Logger.LogLevel.INFO) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ')
      
      const formatted = this.formatMessage('INFO', message)
      const style = this.getStyle('INFO')
      
      if (style) {
        console.log(`%c${formatted}`, style)
      } else {
        console.log(formatted)
      }
    }
  }

  /**
   * Log warning message
   * @param {...any} args - Log arguments
   */
  warn(...args) {
    if (this.level <= Logger.LogLevel.WARN) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ')
      
      const formatted = this.formatMessage('WARN', message)
      const style = this.getStyle('WARN')
      
      if (style) {
        console.warn(`%c${formatted}`, style)
      } else {
        console.warn(formatted)
      }
    }
  }

  /**
   * Log error message
   * @param {...any} args - Log arguments
   */
  error(...args) {
    if (this.level <= Logger.LogLevel.ERROR) {
      const message = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.message}\n${arg.stack}`
        }
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      }).join(' ')
      
      const formatted = this.formatMessage('ERROR', message)
      const style = this.getStyle('ERROR')
      
      if (style) {
        console.error(`%c${formatted}`, style)
      } else {
        console.error(formatted)
      }
    }
  }

  /**
   * Create a performance timer
   * @param {string} label - Timer label
   * @returns {Function} End timer function
   */
  time(label) {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.debug(`${label}: ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * Log a table
   * @param {any} data - Table data
   */
  table(data) {
    if (this.level <= Logger.LogLevel.INFO) {
      console.table(data)
    }
  }
}