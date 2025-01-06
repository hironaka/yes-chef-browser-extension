/**
 * @file tests/background.test.js
 */

describe('background.js - Unit Tests', () => {
  let backgroundMessageHandler = null;
  let logs;

  beforeEach(() => {
    // Reset the chrome mock before each test
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn((handler) => {
            // Store the handler so we can call it in tests
            backgroundMessageHandler = handler;
          })
        },
        lastError: null
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };

    // Import background.js after setting up mocks
    jest.isolateModules(() => {
      require('../background.js');
      const logger = require('../logger.js');
      logs = logger.logs;
    });

    // Ensure handler was set
    expect(backgroundMessageHandler).toBeTruthy();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.chrome;
    backgroundMessageHandler = null;
  });

  it('registers a message listener on load', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(typeof backgroundMessageHandler).toBe('function');
  });

  it('handles RECIPE_DATA message by setting lastRecipeData', () => {
    const sendResponse = jest.fn();
    const message = {
      type: 'RECIPE_DATA',
      payload: { title: 'A New Recipe' }
    };
    
    backgroundMessageHandler(message, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('handles unknown message types gracefully', () => {
    const sendResponse = jest.fn();
    const message = {
      type: 'UNKNOWN_TYPE',
      payload: {}
    };
    
    backgroundMessageHandler(message, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown message type' });
  });

  it('returns logs on GET_LOGS', () => {
    const sendResponse = jest.fn();
    backgroundMessageHandler({ type: 'GET_LOGS' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ logs });
  });

  it('handles LOG messages by calling logger methods', () => {
    const sendResponse = jest.fn();
    backgroundMessageHandler(
      { type: 'LOG', level: 'info', data: 'Some log info' },
      {},
      sendResponse
    );
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});