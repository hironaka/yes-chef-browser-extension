/**
 * @file tests/contentScript.test.js
 */

describe('contentScript.js - Unit Tests', () => {
  let isRecipe, convertRecipeToPlainText;

  beforeEach(() => {
    // Reset chrome mock before each test
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          if (callback) callback({ success: true });
        }),
      }
    };

    // Set up jsdom
    document.body.innerHTML = '';

    // Import contentScript after setting up mocks
    jest.isolateModules(() => {
      const contentScript = require('../contentScript.js');
      isRecipe = contentScript.isRecipe;
      convertRecipeToPlainText = contentScript.convertRecipeToPlainText;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.chrome;
    document.body.innerHTML = '';
  });

  describe('isRecipe()', () => {
    it('returns true for @type = Recipe', () => {
      expect(isRecipe({ '@type': 'Recipe' })).toBe(true);
    });

    it('returns true for an array containing "Recipe"', () => {
      expect(isRecipe({ '@type': ['Thing', 'Recipe'] })).toBe(true);
    });

    it('returns false if not a recipe', () => {
      expect(isRecipe({ '@type': 'Article' })).toBe(false);
      expect(isRecipe({})).toBe(false);
      expect(isRecipe(null)).toBe(false);
    });
  });

  describe('convertRecipeToPlainText()', () => {
    it('returns plain text using .name if present', () => {
      const recipe = {
        name: 'My Sample Recipe',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: [
          {
            '@type': 'HowToStep',
            text: 'Mix ingredients'
          }
        ]
      };
      const result = convertRecipeToPlainText(recipe);
      expect(result).toContain('My Sample Recipe');
      expect(result).toContain('2 cups flour');
      expect(result).toContain('Mix ingredients');
    });

    it('falls back to "Untitled Recipe" if no name/title', () => {
      const recipe = {
        recipeIngredient: ['2 cups flour'],
        recipeInstructions: [
          {
            '@type': 'HowToStep',
            text: 'Mix flour'
          }
        ]
      };
      const result = convertRecipeToPlainText(recipe);
      expect(result).toContain('Untitled Recipe');
      expect(result).toContain('2 cups flour');
      expect(result).toContain('Mix flour');
    });
  });

  describe('Script Injection (Integration-ish test)', () => {
    it('parses JSON-LD from the DOM and calls chrome.runtime.sendMessage for a valid recipe', () => {
      // Set up our document body
      document.body.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Recipe",
          "name": "Test Recipe",
          "recipeIngredient": ["Ingredient 1", "Ingredient 2"],
          "recipeInstructions": [
            {
              "@type": "HowToStep",
              "text": "Step 1"
            }
          ]
        }
        </script>
      `;

      // Import contentScript to trigger its initialization
      jest.isolateModules(() => {
        require('../contentScript.js');
      });

      // First message should be a LOG type with debug level
      expect(chrome.runtime.sendMessage.mock.calls[0][0]).toMatchObject({
        type: 'LOG',
        level: 'debug'
      });

      // Find the RECIPE_DATA message
      const recipeDataCall = chrome.runtime.sendMessage.mock.calls.find(
        call => call[0].type === 'RECIPE_DATA'
      );
      expect(recipeDataCall).toBeTruthy();
      expect(recipeDataCall[0]).toMatchObject({
        type: 'RECIPE_DATA',
        payload: expect.objectContaining({
          name: 'Test Recipe'
        })
      });
    });
  });
});