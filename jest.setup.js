// Polyfill TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock chrome.runtime API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
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
