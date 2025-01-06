// logger.js
// -------------------------------------------------------
// A small utility for controlling log levels, color-coding them in the console,
// and storing them in memory so the popup can display them.
//
// You can adjust "currentLogLevel" to control verbosity. In production, you
// might set it to LOG_LEVELS.INFO or LOG_LEVELS.ERROR to reduce noise.
//
// Supports "pretty printing" for objects (JSON.stringify(..., null, 2)).
//
// -------------------------------------------------------

const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

// Adjust this to the desired minimum level of logs:
let currentLogLevel = LOG_LEVELS.DEBUG;

/**
 * Sets the current log level globally (if you want to change it at runtime).
 * @param {number} level - Must be one of LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, etc.
 */
function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
  }
}

/**
 * We store logs both in memory and chrome.storage.local
 */
const logs = [];

// Load existing logs from storage when the module initializes
chrome.storage.local.get(['logs'], (result) => {
  if (result.logs) {
    logs.push(...result.logs);
  }
});

// Maximum number of logs to keep
const MAX_LOGS = 1000;

/**
 * A helper to get CSS styles for each log level (for color-coded console output).
 */
function getConsoleStyle(levelName) {
  const styles = {
    DEBUG: 'color: #6c757d',
    INFO: 'color: #0d6efd',
    WARN: 'color: #ffc107',
    ERROR: 'color: #dc3545'
  };
  return styles[levelName] || '';
}

/**
 * Master function that handles all logs. It:
 * 1. Checks the log level vs. currentLogLevel
 * 2. Color-codes logs in the console
 * 3. Pretty-prints objects
 * 4. Stores logs in both memory and chrome.storage.local
 */
function logMessage(level, ...args) {
  if (level > currentLogLevel) return;

  const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
  const timestamp = new Date().toISOString();
  
  // Format the message
  const formattedArgs = args.map(arg => {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(arg);
  });
  
  // Create log entry
  const logEntry = {
    level: levelName,
    timestamp,
    message: formattedArgs.join(' ')
  };

  // Add to memory array
  logs.unshift(logEntry);
  
  // Trim logs if they exceed MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS;
  }

  // Save to storage
  chrome.storage.local.set({ logs });

  // Console output with color
  console.log(
    `%c[${levelName}] ${timestamp}:`,
    getConsoleStyle(levelName),
    ...formattedArgs
  );
}

// Export convenience functions for each log level
function debug(...args) {
  logMessage(LOG_LEVELS.DEBUG, ...args);
}

function info(...args) {
  logMessage(LOG_LEVELS.INFO, ...args);
}

function warn(...args) {
  logMessage(LOG_LEVELS.WARN, ...args);
}

function error(...args) {
  logMessage(LOG_LEVELS.ERROR, ...args);
}

export {
  LOG_LEVELS,
  logs,
  setLogLevel,
  debug,
  info,
  warn,
  error
};