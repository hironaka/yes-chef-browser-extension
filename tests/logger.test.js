/**
 * @file tests/logger.test.js
 */

describe('logger.js - Basic Unit Tests', () => {
  let logs, LOG_LEVELS, debug, info, warn, error, setLogLevel;

  beforeEach(() => {
    // Reset the chrome mock before each test
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({ logs: [] })),
          set: jest.fn()
        }
      }
    };

    // Import logger after setting up mocks
    jest.isolateModules(() => {
      const logger = require('../logger.js');
      logs = logger.logs;
      LOG_LEVELS = logger.LOG_LEVELS;
      debug = logger.debug;
      info = logger.info;
      warn = logger.warn;
      error = logger.error;
      setLogLevel = logger.setLogLevel;
    });

    // Clear the logs array manually
    logs.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.chrome;
  });

  it('appends new log entries', () => {
    info('Test info message');
    expect(logs.length).toBe(1);
    expect(logs[0]).toMatchObject({
      level: 'INFO',
      message: 'Test info message'
    });
  });

  it('respects setLogLevel()', () => {
    setLogLevel(LOG_LEVELS.WARN); 
    info('This should not appear');
    warn('This is a warning');
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('WARN');
  });

  it('truncates logs beyond MAX_LOGS', () => {
    // Let's say MAX_LOGS is 1000 in your code
    for (let i = 0; i < 1100; i++) {
      debug(`Message ${i}`);
    }
    expect(logs.length).toBeLessThanOrEqual(1000);
  });

  it('stores logs in chrome.storage.local', () => {
    // Call a log method
    debug('Test store');
    // Expect chrome.storage.local.set to be called
    expect(global.chrome.storage.local.set).toHaveBeenCalledTimes(1);
    const setCall = global.chrome.storage.local.set.mock.calls[0][0];
    expect(Object.keys(setCall)).toContain('logs');
    expect(setCall.logs[0].message).toBe('Test store');
  });
});