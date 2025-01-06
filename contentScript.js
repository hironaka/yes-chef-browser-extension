// contentScript.js

(function() {
  // Find all JSON-LD scripts on the page
  const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');

  let foundRecipe = null;

  ldJsonScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);

      // Some pages embed multiple objects in an array:
      if (Array.isArray(data)) {
        data.forEach(item => {
          console.log("found item: ", item);
          if (item["@type"] === "Recipe" || item["@type"].includes("Recipe")) {
            foundRecipe = item;
          }
        });
      } else {
        // Single JSON-LD object
        console.log("found data: ", data);
        if (data["@type"] === "Recipe" || data["@type"].includes("Recipe")) {
          foundRecipe = data;
        }
      }
    } catch (e) {
      // JSON parse errors can happen if the script isn't valid JSON
      console.error("Error parsing JSON-LD:", e);
    }
  });

  // If we found a recipe object, extract key fields
  if (foundRecipe) {
    const recipe = {
      title: foundRecipe.name || "",
      ingredients: foundRecipe.recipeIngredient || [],
      instructions: extractInstructions(foundRecipe),
      cookTime: foundRecipe.cookTime || "",
      prepTime: foundRecipe.prepTime || "",
      totalTime: foundRecipe.totalTime || "",
      servings: foundRecipe.recipeYield || ""
    };

    console.log("Recipe found:", recipe);

    // Send to background script
    chrome.runtime.sendMessage({
      type: "RECIPE_DATA",
      payload: recipe
    });
  }

  // Helper function to gracefully handle instructions
  function extractInstructions(recipeData) {
    // recipeInstructions can be string or an array of { "@type": "HowToStep", ... }
    // or an array of strings. This tries to unify them.
    if (!recipeData.recipeInstructions) return "";

    if (typeof recipeData.recipeInstructions === "string") {
      // It's just a big text block
      return recipeData.recipeInstructions;
    } else if (Array.isArray(recipeData.recipeInstructions)) {
      // Possibly an array of steps
      return recipeData.recipeInstructions
        .map(step => {
          if (typeof step === "string") return step;
          if (step.text) return step.text;
          return JSON.stringify(step);
        })
        .join("\n");
    }
    // Fallback
    return JSON.stringify(recipeData.recipeInstructions);
  }
})();
