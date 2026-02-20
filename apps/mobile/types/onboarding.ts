export type OnboardingData = {
  diet: string | null
  goals: string[]
  calorieTarget: number | null
  householdSize: number
  measurementSystem: 'metric' | 'imperial'
  cookingSkill: string | null
  spiceLevel: string | null
  preferredComplexity: string | null
  allergies: { name: string; severity: string }[]
  intolerances: { name: string }[]
  favoriteCuisines: string[]
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  diet: null,
  goals: [],
  calorieTarget: null,
  householdSize: 1,
  measurementSystem: 'imperial',
  cookingSkill: null,
  spiceLevel: null,
  preferredComplexity: null,
  allergies: [],
  intolerances: [],
  favoriteCuisines: [],
}

export const DIET_OPTIONS = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'low-carb', label: 'Low Carb' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'whole30', label: 'Whole30' },
] as const

export const GOAL_OPTIONS = [
  { value: 'maintain-weight', label: 'Maintain Weight' },
  { value: 'lose-weight', label: 'Lose Weight' },
  { value: 'gain-weight', label: 'Gain Weight' },
  { value: 'build-muscle', label: 'Build Muscle' },
  { value: 'improve-health', label: 'Improve Health' },
  { value: 'save-time', label: 'Save Time' },
  { value: 'save-money', label: 'Save Money' },
  { value: 'eat-healthier', label: 'Eat Healthier' },
  { value: 'try-new-foods', label: 'Try New Foods' },
] as const

export const COOKING_SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'I can follow simple recipes' },
  { value: 'intermediate', label: 'Intermediate', description: 'I cook regularly' },
  { value: 'advanced', label: 'Advanced', description: 'I enjoy complex dishes' },
  { value: 'expert', label: 'Expert', description: 'Cooking is my passion' },
] as const

export const SPICE_LEVEL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'extra-spicy', label: 'Extra Spicy' },
] as const

export const COMPLEXITY_OPTIONS = [
  { value: 'very-simple', label: 'Very Simple' },
  { value: 'simple', label: 'Simple' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'complex', label: 'Complex' },
  { value: 'advanced', label: 'Advanced' },
] as const

export const COMMON_ALLERGIES = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat',
  'Soy', 'Fish', 'Shellfish', 'Sesame',
] as const

export const COMMON_CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
  'Thai', 'Mediterranean', 'Korean', 'French', 'American',
  'Middle Eastern', 'Vietnamese', 'Greek', 'Spanish', 'Brazilian',
] as const
