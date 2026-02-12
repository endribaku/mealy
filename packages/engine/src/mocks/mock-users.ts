export interface UserProfile {
  allergies: string[]
  diet: string
  calorieTarget: number
  cookingSkill: string
  householdSize: number
}

export interface LearnedPreferences {
  dislikedIngredients: string[]
  favoriteCuisines: string[]
  spiceLevel: string | null
  preferredComplexity: string | null
}

export interface UserMetadata {
  totalMealPlansGenerated: number
  totalRatings: number
}

export interface MockUser {
  userId: string
  profile: UserProfile
  learnedPreferences: LearnedPreferences
  metadata: UserMetadata
}

export const mockUsers: Record<string, MockUser> = {
  'user-001': {
    userId: 'user-001',
    profile: {
      allergies: ['peanuts'],
      diet: 'vegetarian',
      calorieTarget: 2000,
      cookingSkill: 'beginner',
      householdSize: 2
    },
    learnedPreferences: {
      dislikedIngredients: [],
      favoriteCuisines: ['mediterranean'],
      spiceLevel: null,
      preferredComplexity: null
    },
    metadata: {
      totalMealPlansGenerated: 0,
      totalRatings: 0
    }
  },

  'user-002': {
    userId: 'user-002',
    profile: {
      allergies: ['shellfish'],
      diet: 'omnivore',
      calorieTarget: 2200,
      cookingSkill: 'intermediate',
      householdSize: 3
    },
    learnedPreferences: {
      dislikedIngredients: ['cilantro', 'eggplant', 'olives'],
      favoriteCuisines: ['italian', 'thai', 'mexican'],
      spiceLevel: 'mild',
      preferredComplexity: 'simple'
    },
    metadata: {
      totalMealPlansGenerated: 15,
      totalRatings: 42
    }
  },

  'user-003': {
    userId: 'user-003',
    profile: {
      allergies: [],
      diet: 'vegetarian',
      calorieTarget: 1800,
      cookingSkill: 'beginner',
      householdSize: 1
    },
    learnedPreferences: {
      dislikedIngredients: ['mushrooms', 'tomatoes', 'onions', 'peppers', 'spinach'],
      favoriteCuisines: ['american'],
      spiceLevel: 'none',
      preferredComplexity: 'very-simple'
    },
    metadata: {
      totalMealPlansGenerated: 8,
      totalRatings: 20
    }
  }
}