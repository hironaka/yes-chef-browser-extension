// popup.js
// -------------------------------------------------------
// This script runs in the popup. It:
// 1. Queries the background script for the most recent recipe data.
// 2. Allows toggling and refreshing of a debug logs area, which is fed
//    by the background script's in-memory log array.
//
// -------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  const recipeInfoDiv = document.getElementById("recipe-info");
  const debugLogsTextArea = document.getElementById("debug-logs");
  const toggleDebugBtn = document.getElementById("toggle-debug");
  const refreshLogsBtn = document.getElementById("refresh-logs");

  // Add markdown-content class to recipe info div
  recipeInfoDiv.classList.add('markdown-content');

  // Fetch the last stored recipe from the background script
  chrome.runtime.sendMessage({ type: "GET_LAST_RECIPE" }, (response) => {
    if (response && response.recipeData) {
      // Display recipe data in a readable format
      const recipe = response.recipeData;
      let output = `${recipe.title}\n\n`;
      
      if (recipe.servings) {
        output += `Servings: ${Array.isArray(recipe.servings) 
          ? recipe.servings.filter(s => s !== null).join(", ") 
          : recipe.servings}\n\n`;
      }
      
      output += "Ingredients:\n";
      recipe.ingredients.forEach(ingredient => {
        output += `• ${ingredient.trim()}\n`;
      });
      output += "\n";
      
      output += "Instructions:\n";
      if (Array.isArray(recipe.instructions)) {
        const mainInstructions = recipe.instructions.find(
          section => section['@type'] === 'HowToSection' && 
                     section.name === 'Recipe Instructions'
        );
        
        if (mainInstructions && Array.isArray(mainInstructions.itemListElement)) {
          mainInstructions.itemListElement.forEach((step, index) => {
            if (step['@type'] === 'HowToStep' && step.text) {
              output += `${index + 1}. ${step.text}\n`;
            }
          });
        }
      }
      
      recipeInfoDiv.textContent = output;
    } else {
      recipeInfoDiv.textContent = "No recipe found. Visit a recipe page and try again.";
    }
  });

  // Show/hide logs
  let debugVisible = false;

  toggleDebugBtn.addEventListener("click", () => {
    debugVisible = !debugVisible;
    if (debugVisible) {
      debugLogsTextArea.style.display = "block";
      fetchLogs();
    } else {
      debugLogsTextArea.style.display = "none";
    }
  });

  // Refresh logs only if debug is visible
  refreshLogsBtn.addEventListener("click", () => {
    if (debugVisible) {
      fetchLogs();
    }
  });

  async function fetchLogs() {
    const debugLogsTextArea = document.getElementById("debug-logs");
    
    chrome.runtime.sendMessage({ type: "GET_LOGS" }, (response) => {
      if (response && response.logs) {
        const formattedLogs = response.logs.map(log => {
          const timestamp = new Date(log.timestamp).toLocaleTimeString();
          const isJson = log.message.trim().startsWith('{') || log.message.trim().startsWith('[');
          
          let formattedMessage = log.message;
          if (isJson) {
            try {
              const obj = JSON.parse(log.message);
              formattedMessage = `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
            } catch (e) {
              // If JSON parsing fails, use the original message
            }
          }

          return `<div class="log-entry">
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level log-level-${log.level}">${log.level}</span>
            <span class="log-message">${formattedMessage}</span>
          </div>`;
        }).join('\n');

        debugLogsTextArea.innerHTML = formattedLogs;
      }
    });
  }
});