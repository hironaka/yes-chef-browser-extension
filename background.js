// background.js

// We'll keep a variable to hold the last recipe data we received.
let lastRecipeData = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // If the content script sends RECIPE_DATA, store it.
  if (message.type === "RECIPE_DATA") {
    lastRecipeData = message.payload;
    console.log("Recipe data received in background script:", lastRecipeData);
  }
  // If the popup requests GET_RECIPE, send back the last recipe we stored.
  else if (message.type === "GET_RECIPE") {
    sendResponse({ recipe: lastRecipeData });
  }
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_RECIPE') {
    sendResponse({ recipe: lastRecipeData });
  }
});
