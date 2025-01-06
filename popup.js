// popup.js
document.addEventListener("DOMContentLoaded", async () => {
  // For example, we could ask the background script if we have stored recipe info
  chrome.runtime.sendMessage({ type: "GET_RECIPE" }, (response) => {
    const recipeInfoDiv = document.getElementById("recipe-info");
    if (response && response.recipe) {
      recipeInfoDiv.textContent = JSON.stringify(response.recipe, null, 2);
    } else {
      recipeInfoDiv.textContent = "No recipe found.";
    }
  });
});