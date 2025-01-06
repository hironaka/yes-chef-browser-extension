// Test parser for recipe conversion
const testRecipe = {
  "title": "Best Prime Rib",
  "ingredients": [
    "1 (7-pound), first-cut beef standing rib roast (3 bones), meat removed from bones, bones reserved",
    " , Kosher salt and ground black pepper ",
    "2 teaspoons, vegetable oil "
  ],
  "instructions": [
    {
      "@type": "HowToSection",
      "name": "Recipe Instructions",
      "position": "1",
      "itemListElement": [
        {
          "@type": "HowToStep",
          "text": "Look for a roast with an untrimmed fat cap (ideally ½ inch thick). We prefer the flavor and texture of prime-grade beef, but choice grade will work as well. To remove the bones from the roast, use a sharp knife and run it down the length of the bones, following the contours as closely as possible until the meat is separated. Monitoring the roast with a meat-probe thermometer is best. If you use an instant-read thermometer, open the oven door as little as possible and remove the roast from the oven while taking its temperature. If the roast has not reached the correct temperature in the time range specified in step 3, heat the oven to 200 degrees, wait for 5 minutes, then shut it off, and continue to cook the roast until it reaches the desired temperature."
        },
        {
          "@type": "HowToStep",
          "text": "Using sharp knife, cut slits in surface layer of fat, spaced 1 inch apart, in crosshatch pattern, being careful to cut down to, but not into, meat. Rub 2 tablespoons salt over entire roast and into slits. Place meat back on bones (to save space in refrigerator), transfer to large plate, and refrigerate, uncovered, at least 24 hours and up to 96 hours."
        },
        {
          "@type": "HowToStep",
          "text": "Adjust oven rack to middle position and heat oven to 200 degrees. Heat oil in 12-inch skillet over high heat until just smoking. Sear sides and top of roast (reserving bone) until browned, 6 to 8 minutes total (do not sear side where roast was cut from bone). Place meat back on ribs, so bones fit where they were cut, and let cool for 10 minutes; tie meat to bones with 2 lengths of twine between ribs. Transfer roast, fat side up, to wire rack set in rimmed baking sheet and season with pepper. Roast until meat registers 110 degrees, 3 to 4 hours."
        },
        {
          "@type": "HowToStep",
          "text": "Turn off oven; leave roast in oven, opening door as little as possible, until meat registers about 120 degrees for rare or about 125 degrees for medium-rare, 30 to 75 minutes longer."
        },
        {
          "@type": "HowToStep",
          "text": "Remove roast from oven (leave roast on baking sheet), tent loosely with aluminum foil, and let rest for at least 30 minutes and up to 75 minutes."
        },
        {
          "@type": "HowToStep",
          "text": "Adjust oven rack about 8 inches from broiler element and heat broiler. Remove foil from roast, form into 3-inch ball, and place under ribs to elevate fat cap. Broil until top of roast is well browned and crisp, 2 to 8 minutes."
        },
        {
          "@type": "HowToStep",
          "text": "Transfer roast to carving board; cut twine and remove roast from ribs. Slice meat into 3/4-inch-thick slices. Season with coarse salt to taste, and serve."
        }
      ]
    }
  ]
};

function convertRecipeToPlainText(recipe) {
  let output = '';
  
  // Title
  output += `${recipe.title}\n\n`;
  
  // Ingredients
  output += 'Ingredients\n';
  recipe.ingredients.forEach(ingredient => {
    // Clean up ingredient text
    const cleanIngredient = ingredient.trim().replace(/^,\s*/, '');
    if (cleanIngredient) {
      output += `${cleanIngredient}\n`;
    }
  });
  output += '\n';
  
  // Instructions
  output += 'Instructions\n';
  if (Array.isArray(recipe.instructions)) {
    // Find the main recipe instructions section
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
  
  return output.trim();
}

// Run the test
console.log('Testing recipe conversion...\n');
console.log(convertRecipeToPlainText(testRecipe));
