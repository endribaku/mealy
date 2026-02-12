import { MealPlan } from '../core/schemas/schemas.js'

/**
 * Mock Meal Plans
 * 
 * These are realistic meal plans used for testing sessions.
 * Each plan corresponds to a session in mock-sessions.ts
 */

export const mockMealPlans: Record<string, MealPlan> = {
  /**
   * Plan 001 - Balanced omnivore plan
   * Used by: session-001
   */
  'plan-001': {
    days: [
      {
        dayNumber: 1,
        meals: {
          breakfast: {
            name: 'Greek Yogurt Parfait',
            cuisine: 'american',
            ingredients: [
              { name: 'greek yogurt', amount: 200, unit: 'g' },
              { name: 'granola', amount: 50, unit: 'g' },
              { name: 'mixed berries', amount: 100, unit: 'g' },
              { name: 'honey', amount: 15, unit: 'ml' }
            ],
            nutrition: {
              calories: 380,
              protein: 20,
              carbs: 52,
              fat: 10
            },
            instructions: [
              'Layer yogurt in a bowl',
              'Top with granola and berries',
              'Drizzle with honey'
            ],
            prepTime: 5,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          lunch: {
            name: 'Chicken Caesar Salad',
            cuisine: 'american',
            ingredients: [
              { name: 'romaine lettuce', amount: 150, unit: 'g' },
              { name: 'grilled chicken breast', amount: 150, unit: 'g' },
              { name: 'parmesan cheese', amount: 30, unit: 'g' },
              { name: 'caesar dressing', amount: 40, unit: 'ml' },
              { name: 'croutons', amount: 30, unit: 'g' }
            ],
            nutrition: {
              calories: 520,
              protein: 42,
              carbs: 28,
              fat: 26
            },
            instructions: [
              'Grill and slice chicken breast',
              'Chop romaine lettuce',
              'Toss with dressing',
              'Top with chicken, parmesan, and croutons'
            ],
            prepTime: 20,
            spiceLevel: 'none',
            complexity: 'simple'
          },
          dinner: {
            name: 'Baked Salmon with Roasted Vegetables',
            cuisine: 'american',
            ingredients: [
              { name: 'salmon fillet', amount: 180, unit: 'g' },
              { name: 'broccoli', amount: 150, unit: 'g' },
              { name: 'carrots', amount: 100, unit: 'g' },
              { name: 'olive oil', amount: 15, unit: 'ml' },
              { name: 'lemon', amount: 1, unit: 'piece' },
              { name: 'garlic', amount: 2, unit: 'piece' }
            ],
            nutrition: {
              calories: 480,
              protein: 38,
              carbs: 22,
              fat: 26
            },
            instructions: [
              'Preheat oven to 400°F',
              'Season salmon with salt, pepper, and lemon juice',
              'Cut vegetables into chunks',
              'Toss vegetables with olive oil and minced garlic',
              'Bake salmon and vegetables for 18-20 minutes'
            ],
            prepTime: 30,
            spiceLevel: 'none',
            complexity: 'simple'
          }
        }
      },
      {
        dayNumber: 2,
        meals: {
          breakfast: {
            name: 'Scrambled Eggs with Toast',
            cuisine: 'american',
            ingredients: [
              { name: 'eggs', amount: 3, unit: 'piece' },
              { name: 'whole wheat bread', amount: 2, unit: 'piece' },
              { name: 'butter', amount: 10, unit: 'g' },
              { name: 'milk', amount: 30, unit: 'ml' }
            ],
            nutrition: {
              calories: 420,
              protein: 24,
              carbs: 36,
              fat: 18
            },
            instructions: [
              'Beat eggs with milk',
              'Scramble in buttered pan over medium heat',
              'Toast bread and butter',
              'Serve eggs with toast'
            ],
            prepTime: 10,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          lunch: {
            name: 'Turkey and Avocado Wrap',
            cuisine: 'american',
            ingredients: [
              { name: 'whole wheat tortilla', amount: 1, unit: 'piece' },
              { name: 'turkey breast', amount: 100, unit: 'g' },
              { name: 'avocado', amount: 80, unit: 'g' },
              { name: 'lettuce', amount: 30, unit: 'g' },
              { name: 'tomato', amount: 50, unit: 'g' },
              { name: 'mustard', amount: 10, unit: 'ml' }
            ],
            nutrition: {
              calories: 450,
              protein: 28,
              carbs: 42,
              fat: 18
            },
            instructions: [
              'Lay tortilla flat',
              'Layer turkey, sliced avocado, lettuce, and tomato',
              'Spread mustard',
              'Roll tightly and cut in half'
            ],
            prepTime: 8,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          dinner: {
            name: 'Spaghetti Bolognese',
            cuisine: 'italian',
            ingredients: [
              { name: 'spaghetti', amount: 100, unit: 'g' },
              { name: 'ground beef', amount: 150, unit: 'g' },
              { name: 'tomato sauce', amount: 200, unit: 'ml' },
              { name: 'onion', amount: 80, unit: 'g' },
              { name: 'garlic', amount: 2, unit: 'piece' },
              { name: 'parmesan cheese', amount: 20, unit: 'g' }
            ],
            nutrition: {
              calories: 620,
              protein: 38,
              carbs: 68,
              fat: 20
            },
            instructions: [
              'Cook spaghetti according to package directions',
              'Brown ground beef with diced onion and garlic',
              'Add tomato sauce and simmer for 15 minutes',
              'Toss pasta with sauce',
              'Top with parmesan'
            ],
            prepTime: 30,
            spiceLevel: 'none',
            complexity: 'simple'
          }
        }
      },
      {
        dayNumber: 3,
        meals: {
          breakfast: {
            name: 'Oatmeal with Banana',
            cuisine: 'american',
            ingredients: [
              { name: 'rolled oats', amount: 80, unit: 'g' },
              { name: 'milk', amount: 240, unit: 'ml' },
              { name: 'banana', amount: 1, unit: 'piece' },
              { name: 'cinnamon', amount: 2, unit: 'g' },
              { name: 'honey', amount: 15, unit: 'ml' }
            ],
            nutrition: {
              calories: 400,
              protein: 14,
              carbs: 72,
              fat: 8
            },
            instructions: [
              'Cook oats with milk for 5 minutes',
              'Slice banana',
              'Top oatmeal with banana, cinnamon, and honey'
            ],
            prepTime: 10,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          lunch: {
            name: 'Caprese Sandwich',
            cuisine: 'italian',
            ingredients: [
              { name: 'ciabatta bread', amount: 1, unit: 'piece' },
              { name: 'mozzarella cheese', amount: 80, unit: 'g' },
              { name: 'tomato', amount: 100, unit: 'g' },
              { name: 'fresh basil', amount: 10, unit: 'g' },
              { name: 'balsamic glaze', amount: 15, unit: 'ml' },
              { name: 'olive oil', amount: 10, unit: 'ml' }
            ],
            nutrition: {
              calories: 480,
              protein: 22,
              carbs: 48,
              fat: 22
            },
            instructions: [
              'Slice ciabatta in half',
              'Layer mozzarella, tomato, and basil',
              'Drizzle with balsamic and olive oil',
              'Close sandwich and press lightly'
            ],
            prepTime: 8,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          dinner: {
            name: 'Spicy Thai Basil Chicken',
            cuisine: 'thai',
            ingredients: [
              { name: 'chicken breast', amount: 180, unit: 'g' },
              { name: 'thai basil', amount: 20, unit: 'g' },
              { name: 'bell pepper', amount: 100, unit: 'g' },
              { name: 'chili peppers', amount: 15, unit: 'g' },
              { name: 'soy sauce', amount: 20, unit: 'ml' },
              { name: 'fish sauce', amount: 15, unit: 'ml' },
              { name: 'garlic', amount: 3, unit: 'piece' },
              { name: 'jasmine rice', amount: 150, unit: 'g' }
            ],
            nutrition: {
              calories: 580,
              protein: 42,
              carbs: 68,
              fat: 12
            },
            instructions: [
              'Cook jasmine rice',
              'Slice chicken and bell pepper',
              'Stir-fry chicken with garlic and chili',
              'Add bell pepper, sauces, and basil',
              'Serve over rice'
            ],
            prepTime: 25,
            spiceLevel: 'spicy',
            complexity: 'simple'
          }
        }
      }
    ],
    nutritionSummary: {
      avgDailyCalories: 2050,
      avgProtein: 145
    }
  },

  /**
   * Plan 002 - Similar to plan-001 but with user rejections
   * Used by: session-002 (has rejections for day 3 dinner and day 5 lunch)
   */
  'plan-002': {
    days: [
      {
        dayNumber: 1,
        meals: {
          breakfast: {
            name: 'Avocado Toast',
            cuisine: 'american',
            ingredients: [
              { name: 'whole wheat bread', amount: 2, unit: 'piece' },
              { name: 'avocado', amount: 100, unit: 'g' },
              { name: 'eggs', amount: 2, unit: 'piece' },
              { name: 'cherry tomatoes', amount: 50, unit: 'g' }
            ],
            nutrition: {
              calories: 420,
              protein: 18,
              carbs: 38,
              fat: 22
            },
            instructions: [
              'Toast bread',
              'Mash avocado and spread on toast',
              'Fry eggs',
              'Top with eggs and sliced tomatoes'
            ],
            prepTime: 10,
            spiceLevel: 'none',
            complexity: 'simple'
          },
          lunch: {
            name: 'Grilled Chicken Wrap',
            cuisine: 'american',
            ingredients: [
              { name: 'flour tortilla', amount: 1, unit: 'piece' },
              { name: 'grilled chicken', amount: 120, unit: 'g' },
              { name: 'lettuce', amount: 40, unit: 'g' },
              { name: 'tomato', amount: 60, unit: 'g' },
              { name: 'ranch dressing', amount: 30, unit: 'ml' }
            ],
            nutrition: {
              calories: 480,
              protein: 32,
              carbs: 42,
              fat: 18
            },
            instructions: [
              'Grill chicken and slice',
              'Lay tortilla flat',
              'Add chicken, lettuce, tomato, and dressing',
              'Roll tightly'
            ],
            prepTime: 15,
            spiceLevel: 'none',
            complexity: 'simple'
          },
          dinner: {
            name: 'Baked Cod with Quinoa',
            cuisine: 'american',
            ingredients: [
              { name: 'cod fillet', amount: 180, unit: 'g' },
              { name: 'quinoa', amount: 100, unit: 'g' },
              { name: 'green beans', amount: 150, unit: 'g' },
              { name: 'lemon', amount: 1, unit: 'piece' },
              { name: 'olive oil', amount: 15, unit: 'ml' }
            ],
            nutrition: {
              calories: 520,
              protein: 42,
              carbs: 48,
              fat: 16
            },
            instructions: [
              'Cook quinoa',
              'Season cod with lemon and herbs',
              'Bake cod at 375°F for 15 minutes',
              'Steam green beans',
              'Serve together'
            ],
            prepTime: 30,
            spiceLevel: 'none',
            complexity: 'simple'
          }
        }
      },
      {
        dayNumber: 2,
        meals: {
          breakfast: {
            name: 'Banana Pancakes',
            cuisine: 'american',
            ingredients: [
              { name: 'flour', amount: 120, unit: 'g' },
              { name: 'banana', amount: 1, unit: 'piece' },
              { name: 'eggs', amount: 2, unit: 'piece' },
              { name: 'milk', amount: 120, unit: 'ml' },
              { name: 'maple syrup', amount: 30, unit: 'ml' }
            ],
            nutrition: {
              calories: 450,
              protein: 16,
              carbs: 72,
              fat: 12
            },
            instructions: [
              'Mash banana',
              'Mix with flour, eggs, and milk',
              'Cook pancakes on griddle',
              'Serve with syrup'
            ],
            prepTime: 15,
            spiceLevel: 'none',
            complexity: 'simple'
          },
          lunch: {
            name: 'Mediterranean Salad',
            cuisine: 'mediterranean',
            ingredients: [
              { name: 'mixed greens', amount: 100, unit: 'g' },
              { name: 'cucumber', amount: 80, unit: 'g' },
              { name: 'tomato', amount: 80, unit: 'g' },
              { name: 'feta cheese', amount: 60, unit: 'g' },
              { name: 'chickpeas', amount: 100, unit: 'g' },
              { name: 'olive oil', amount: 20, unit: 'ml' }
            ],
            nutrition: {
              calories: 420,
              protein: 18,
              carbs: 38,
              fat: 22
            },
            instructions: [
              'Chop vegetables',
              'Mix with greens and chickpeas',
              'Crumble feta on top',
              'Drizzle with olive oil and lemon'
            ],
            prepTime: 10,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          dinner: {
            name: 'Chicken Parmesan',
            cuisine: 'italian',
            ingredients: [
              { name: 'chicken breast', amount: 180, unit: 'g' },
              { name: 'breadcrumbs', amount: 50, unit: 'g' },
              { name: 'marinara sauce', amount: 150, unit: 'ml' },
              { name: 'mozzarella cheese', amount: 80, unit: 'g' },
              { name: 'pasta', amount: 100, unit: 'g' }
            ],
            nutrition: {
              calories: 680,
              protein: 52,
              carbs: 62,
              fat: 24
            },
            instructions: [
              'Bread chicken breast',
              'Pan fry until golden',
              'Top with marinara and mozzarella',
              'Bake at 375°F for 10 minutes',
              'Serve over pasta'
            ],
            prepTime: 35,
            spiceLevel: 'none',
            complexity: 'moderate'
          }
        }
      },
      {
        dayNumber: 3,
        meals: {
          breakfast: {
            name: 'Berry Smoothie Bowl',
            cuisine: 'american',
            ingredients: [
              { name: 'frozen berries', amount: 150, unit: 'g' },
              { name: 'banana', amount: 1, unit: 'piece' },
              { name: 'greek yogurt', amount: 150, unit: 'g' },
              { name: 'granola', amount: 40, unit: 'g' },
              { name: 'chia seeds', amount: 10, unit: 'g' }
            ],
            nutrition: {
              calories: 380,
              protein: 18,
              carbs: 62,
              fat: 8
            },
            instructions: [
              'Blend berries, banana, and yogurt',
              'Pour into bowl',
              'Top with granola and chia seeds'
            ],
            prepTime: 8,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          lunch: {
            name: 'BLT Sandwich',
            cuisine: 'american',
            ingredients: [
              { name: 'whole wheat bread', amount: 2, unit: 'piece' },
              { name: 'bacon', amount: 60, unit: 'g' },
              { name: 'lettuce', amount: 40, unit: 'g' },
              { name: 'tomato', amount: 80, unit: 'g' },
              { name: 'mayonnaise', amount: 20, unit: 'ml' }
            ],
            nutrition: {
              calories: 520,
              protein: 24,
              carbs: 42,
              fat: 28
            },
            instructions: [
              'Cook bacon until crispy',
              'Toast bread',
              'Layer bacon, lettuce, and tomato',
              'Spread mayo'
            ],
            prepTime: 12,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          dinner: {
            name: 'Spicy Thai Curry',
            cuisine: 'thai',
            ingredients: [
              { name: 'chicken thigh', amount: 180, unit: 'g' },
              { name: 'red curry paste', amount: 30, unit: 'g' },
              { name: 'coconut milk', amount: 200, unit: 'ml' },
              { name: 'bell pepper', amount: 100, unit: 'g' },
              { name: 'bamboo shoots', amount: 80, unit: 'g' },
              { name: 'jasmine rice', amount: 150, unit: 'g' }
            ],
            nutrition: {
              calories: 620,
              protein: 38,
              carbs: 68,
              fat: 22
            },
            instructions: [
              'Cook jasmine rice',
              'Sauté curry paste',
              'Add chicken and cook through',
              'Pour in coconut milk',
              'Add vegetables and simmer',
              'Serve over rice'
            ],
            prepTime: 30,
            spiceLevel: 'spicy',
            complexity: 'simple'
          }
        }
      }
    ],
    nutritionSummary: {
      avgDailyCalories: 2100,
      avgProtein: 138
    }
  },

  /**
   * Plan 003 - Vegetarian plan for picky eater
   * Used by: session-003
   */
  'plan-003': {
    days: [
      {
        dayNumber: 1,
        meals: {
          breakfast: {
            name: 'Peanut Butter Toast',
            cuisine: 'american',
            ingredients: [
              { name: 'whole wheat bread', amount: 2, unit: 'piece' },
              { name: 'peanut butter', amount: 30, unit: 'g' },
              { name: 'banana', amount: 1, unit: 'piece' }
            ],
            nutrition: {
              calories: 380,
              protein: 14,
              carbs: 52,
              fat: 14
            },
            instructions: [
              'Toast bread',
              'Spread peanut butter',
              'Slice banana on top'
            ],
            prepTime: 5,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          lunch: {
            name: 'Grilled Cheese Sandwich',
            cuisine: 'american',
            ingredients: [
              { name: 'white bread', amount: 2, unit: 'piece' },
              { name: 'cheddar cheese', amount: 60, unit: 'g' },
              { name: 'butter', amount: 15, unit: 'g' }
            ],
            nutrition: {
              calories: 420,
              protein: 18,
              carbs: 38,
              fat: 22
            },
            instructions: [
              'Butter bread on outside',
              'Place cheese between slices',
              'Grill until golden and cheese melts'
            ],
            prepTime: 8,
            spiceLevel: 'none',
            complexity: 'very-simple'
          },
          dinner: {
            name: 'Mac and Cheese',
            cuisine: 'american',
            ingredients: [
              { name: 'elbow macaroni', amount: 120, unit: 'g' },
              { name: 'cheddar cheese', amount: 100, unit: 'g' },
              { name: 'milk', amount: 150, unit: 'ml' },
              { name: 'butter', amount: 20, unit: 'g' }
            ],
            nutrition: {
              calories: 580,
              protein: 26,
              carbs: 62,
              fat: 24
            },
            instructions: [
              'Cook macaroni',
              'Melt butter in pan',
              'Add milk and cheese',
              'Stir until smooth',
              'Mix with pasta'
            ],
            prepTime: 15,
            spiceLevel: 'none',
            complexity: 'very-simple'
          }
        }
      }
    ],
    nutritionSummary: {
      avgDailyCalories: 1800,
      avgProtein: 112
    }
  }
}

export type MockMealPlanId = keyof typeof mockMealPlans