// contentScript.js
// -------------------------------------------------------
// Injected into webpages that match "<all_urls>" (per manifest).
// Attempts to find JSON-LD scripts containing recipe data.
// If found, it sends that data to the background script via "RECIPE_DATA".
//
// Also provides its own logging via messages of type "LOG" so that
// color-coded logs appear in the background script (logger.js).
// -------------------------------------------------------

/**
 * Helper function to send logs to the background script,
 * which then uses logger.js for color-coded, level-based logs.
 */
function log(level, data) {
  chrome.runtime.sendMessage({ type: "LOG", level, data });
}

/**
 * Check if an object qualifies as a "Recipe".
 * Some recipes have "@type" = "Recipe", others have an array for "@type" (e.g. ["Thing","Recipe"]).
 */
function isRecipe(obj) {
  if (!obj || !obj['@type']) return false;
  const type = obj['@type'];
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

/**
 * Extract instructions from a recipe object in a consistent, readable way.
 */
function extractInstructions(recipeData) {
  const instructions = recipeData.recipeInstructions;
  if (!instructions) return [];

  // Handle array of strings
  if (Array.isArray(instructions) && typeof instructions[0] === 'string') {
    return instructions;
  }

  // Handle array of HowToSection objects
  if (Array.isArray(instructions) && instructions[0]['@type'] === 'HowToSection') {
    return instructions
      .filter(section => section.name === 'Recipe Instructions')
      .flatMap(section => section.itemListElement)
      .map(step => step.text)
      .filter(text => text); // Remove any undefined or empty strings
  }

  // Handle single HowToSection object
  if (typeof instructions === 'object' && instructions['@type'] === 'HowToSection') {
    return instructions.itemListElement
      .map(step => step.text)
      .filter(text => text);
  }

  // Handle array of HowToStep objects directly
  if (Array.isArray(instructions) && instructions[0]['@type'] === 'HowToStep') {
    return instructions
      .map(step => step.text)
      .filter(text => text);
  }

  // Handle single string
  if (typeof instructions === 'string') {
    return [instructions];
  }

  return [];
}

/**
 * Extract ingredients from a recipe object, handling various formats.
 */
function extractIngredients(recipeData) {
  const ingredients = recipeData.recipeIngredient;
  if (!ingredients) return [];

  // Handle array of ingredients
  if (Array.isArray(ingredients)) {
    return ingredients;
  }

  // Handle single string
  if (typeof ingredients === 'string') {
    return [ingredients];
  }

  return [];
}

/**
 * Convert a recipe object into the desired plain-text output format.
 * 
 * @param {Object} recipe - The recipe object containing title, ingredients, and instructions
 * @returns {string} A single string containing the desired output format
 */
function convertRecipeToPlainText(recipe) {
  const title = recipe.name || 'Untitled Recipe';
  const ingredients = extractIngredients(recipe);
  const instructions = extractInstructions(recipe);
  
  let output = title + '\n\n';
  
  if (ingredients.length > 0) {
    output += 'Ingredients:\n';
    ingredients.forEach((ingredient, index) => {
      output += `${index + 1}. ${ingredient}\n`;
    });
    output += '\n';
  }
  
  if (instructions.length > 0) {
    output += 'Instructions:\n';
    instructions.forEach((instruction, index) => {
      output += `${index + 1}. ${instruction}\n`;
    });
  }
  
  return output;
}

// Main content script functionality
function init() {
  log("debug", "Content script loaded. Searching for recipe JSON-LD...");

  // Find all script elements
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      
      // Handle both single objects and arrays of objects
      const recipes = Array.isArray(data) ? data : [data];
      
      recipes.forEach(item => {
        if (isRecipe(item)) {
          log("info", "Found recipe data:", item);
          
          // Send to background script
          chrome.runtime.sendMessage({
            type: "RECIPE_DATA",
            payload: item
          });

          // Convert to plain text and log it
          const plainTextOutput = convertRecipeToPlainText(item);
          log("info", "Desired Output:\n" + plainTextOutput);
        }
      });
    } catch (e) {
      log("error", "Error parsing JSON-LD:", e.message);
    }
  });
}

// Run the content script
init();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isRecipe,
    convertRecipeToPlainText,
    extractInstructions,
    extractIngredients
  };
}