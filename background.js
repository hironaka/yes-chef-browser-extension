// background.js
// -------------------------------------------------------
// The background service worker for the extension.
// Responsibilities:
// 1. Listens for messages from content scripts / popup.
// 2. Stores the latest recipe data.
// 3. Maintains a log (via logger.js) that can be retrieved by the popup.
//
// -------------------------------------------------------

import {
  logs,
  debug,
  info,
  warn,
  error
} from './logger.js';

let lastRecipeData = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RECIPE_DATA") {
    lastRecipeData = message.payload;
    info("Recipe data received in background script", lastRecipeData);
    sendResponse({ success: true });
    return true;
  } else if (message.type === "GET_LAST_RECIPE") {
    sendResponse({ recipeData: lastRecipeData });
    return true;
  } else if (message.type === "GET_LOGS") {
    sendResponse({ logs });
    return true;
  } else if (message.type === "LOG") {
    // Handle logs from content script
    switch (message.level) {
      case "debug":
        debug(message.data);
        break;
      case "info":
        info(message.data);
        break;
      case "warn":
        warn(message.data);
        break;
      case "error":
        error(message.data);
        break;
    }
    sendResponse({ success: true });
    return true;
  }
  
  // Handle unknown message types
  warn(`Received unknown message type: ${message.type}`);
  sendResponse({ error: 'Unknown message type' });
  return true;
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_RECIPE') {
    sendResponse({ recipe: lastRecipeData });
  }
});