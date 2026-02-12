import { z } from 'zod'

/**
 * Detailed Recipe Schema
 * 
 * This is more detailed than the basic instructions in MealPlan.
 * Generated AFTER user confirms the meal plan.
 */

// Enhanced ingredient with prep notes
export const DetailedIngredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  prepNotes: z.string().optional() // "diced", "finely chopped", "room temperature"
})

// Cooking step with detailed timing and technique
export const CookingStepSchema = z.object({
  stepNumber: z.number(),
  instruction: z.string(),
  duration: z.number().optional(), // in minutes
  technique: z.string().optional(), // "sauté", "boil", "roast", "simmer"
  temperature: z.string().optional(), // "medium heat", "350°F", "high heat"
  visualCue: z.string().optional() // "until golden brown", "until tender"
})

// Complete detailed recipe
export const DetailedRecipeSchema = z.object({
  mealId: z.string(), // e.g., "breakfast-day1", "lunch-day3"
  name: z.string(),
  cuisine: z.string(),
  servings: z.number(),
  
  // Enhanced ingredients
  ingredients: z.array(DetailedIngredientSchema),
  
  // Detailed cooking steps
  steps: z.array(CookingStepSchema),
  
  // Timing breakdown
  timing: z.object({
    prep: z.number(), // minutes
    cook: z.number(), // minutes
    total: z.number() // minutes
  }),
  
  // Nutrition (copied from meal plan)
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number()
  }),
  
  // Equipment needed
  equipment: z.array(z.string()), // ["large pot", "wooden spoon", "baking sheet"]
  
  // Difficulty
  difficulty: z.enum(['very-easy', 'easy', 'medium', 'hard']),
  
  // Optional enhancements
  tips: z.array(z.string()).optional(), // Chef's tips
  makeAhead: z.string().optional(), // "Can be prepared 1 day ahead"
  storage: z.string().optional(), // "Store in airtight container for up to 3 days"
  variations: z.array(z.string()).optional(), // Alternative ingredients or methods
  pairingNotes: z.string().optional() // "Pairs well with..."
})

// Collection of recipes for a meal plan
export const RecipeCollectionSchema = z.object({
  recipes: z.array(DetailedRecipeSchema),
  totalRecipes: z.number()
})

// Type exports
export type DetailedIngredient = z.infer<typeof DetailedIngredientSchema>
export type CookingStep = z.infer<typeof CookingStepSchema>
export type DetailedRecipe = z.infer<typeof DetailedRecipeSchema>
export type RecipeCollection = z.infer<typeof RecipeCollectionSchema>