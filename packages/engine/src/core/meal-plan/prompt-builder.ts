import { FullContext } from '../context-builder.js'

export interface PromptConfig {
  numberOfDays: number
  mealsPerDay: 3
  includeNutritionSummary: boolean
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  numberOfDays: 7,
  mealsPerDay: 3,
  includeNutritionSummary: true
}

export class PromptBuilder {

  buildSystemMessage(): string {
    return `You are an expert meal planning assistant.

You must strictly respect:
- Allergies and medical restrictions
- Diet type
- Calorie targets
- User preferences
- Session feedback

Generate practical, balanced, personalized meal plans.`
  }

  buildUserMessage(
    context: FullContext,
    config: PromptConfig = DEFAULT_PROMPT_CONFIG,
    specialInstructions?: string
  ): string {

    let message = this.buildContextSection(context)
    message += '\n\n' + this.buildGenerationInstructions(context, config)

    if (specialInstructions) {
      message += '\n\n=== SPECIAL INSTRUCTIONS ===\n\n' + specialInstructions
    }

    return message
  }

  buildPrompt(
    context: FullContext,
    config: PromptConfig = DEFAULT_PROMPT_CONFIG,
    specialInstructions?: string
  ) {
    return {
      systemMessage: this.buildSystemMessage(),
      userMessage: this.buildUserMessage(context, config, specialInstructions)
    }
  }

  // ============================================================
  // CONTEXT SECTION (USES ACTUAL USER SCHEMA)
  // ============================================================

  private buildContextSection(context: FullContext): string {

    const user = context.user
    const profile = user.profile
    const learned = user.learnedPreferences
    const restrictions = user.dietaryRestrictions

    let section = '=== USER CONTEXT ===\n\n'

    // ============================================================
    // HARD CONSTRAINTS
    // ============================================================

    section += '🔴 HARD CONSTRAINTS (MUST FOLLOW):\n'

    section += `- Diet: ${profile.diet}\n`
    section += `- Daily calorie target: ${profile.calorieTarget} kcal\n`

    if (restrictions?.allergies?.length) {
      section += `- Allergies: ${restrictions.allergies.map(a => a.name).join(', ')}\n`
    }

    if (restrictions?.intolerances?.length) {
      section += `- Intolerances: ${restrictions.intolerances.map(i => i.name).join(', ')}\n`
    }

    if (restrictions?.religiousRestrictions?.length) {
      section += `- Religious restrictions: ${restrictions.religiousRestrictions.join(', ')}\n`
    }

    if (restrictions?.ethicalRestrictions?.length) {
      section += `- Ethical restrictions: ${restrictions.ethicalRestrictions.join(', ')}\n`
    }

    if (restrictions?.medicalConditions?.length) {
      section += '  ⚕️ Medical conditions:\n'
      restrictions.medicalConditions.forEach(cond => {
        section += `    • ${cond.condition}`
        if (cond.dietaryNotes) section += `: ${cond.dietaryNotes}`
        section += '\n'
      })
    }

    if (restrictions?.texturePreferences) {
      if (restrictions.texturePreferences.avoid?.length) {
        section += `- Avoid textures: ${restrictions.texturePreferences.avoid.join(', ')}\n`
      }
      if (restrictions.texturePreferences.prefer?.length) {
        section += `- Prefer textures: ${restrictions.texturePreferences.prefer.join(', ')}\n`
      }
    }

    // ============================================================
    // LEARNED PREFERENCES
    // ============================================================

    section += '\n🟡 LEARNED PREFERENCES (SHOULD FOLLOW):\n'

    if (learned.dislikedIngredients.length)
      section += `- Disliked ingredients: ${learned.dislikedIngredients.join(', ')}\n`

    if (learned.dislikedCuisines.length)
      section += `- Disliked cuisines: ${learned.dislikedCuisines.join(', ')}\n`

    if (learned.dislikedMealTypes.length)
      section += `- Disliked meal types: ${learned.dislikedMealTypes.join(', ')}\n`

    if (learned.favoriteCuisines.length)
      section += `- Favorite cuisines: ${learned.favoriteCuisines.join(', ')}\n`

    if (learned.favoriteIngredients.length)
      section += `- Favorite ingredients: ${learned.favoriteIngredients.join(', ')}\n`

    if (learned.favoriteMealTypes.length)
      section += `- Favorite meal types: ${learned.favoriteMealTypes.join(', ')}\n`

    if (learned.spiceLevel)
      section += `- Preferred spice level: ${learned.spiceLevel}\n`

    if (learned.preferredComplexity)
      section += `- Preferred complexity: ${learned.preferredComplexity}\n`

    if (learned.patterns?.proteinPreferences?.length)
      section += `- Preferred proteins: ${learned.patterns.proteinPreferences.join(', ')}\n`

    if (learned.patterns?.cookingMethodPreferences?.length)
      section += `- Preferred cooking methods: ${learned.patterns.cookingMethodPreferences.join(', ')}\n`

    if (learned.patterns?.prefersLeftovers)
      section += `- Prefers leftovers\n`

    if (learned.patterns?.prefersBatchCooking)
      section += `- Prefers batch cooking\n`

    if (learned.patterns?.prefersMealPrep)
      section += `- Prefers structured meal prep\n`

    // ============================================================
    // PROFILE METADATA
    // ============================================================

    section += '\n📊 USER PROFILE:\n'
    section += `- Cooking skill: ${profile.cookingSkill}\n`
    section += `- Household size: ${profile.householdSize}\n`
    section += `- Measurement system: ${profile.measurementSystem}\n`

    if (profile.preferences) {
      section += '\n🟢 PROFILE PREFERENCES:\n'

      if (profile.preferences.breakfastPreference)
        section += `- Breakfast style: ${profile.preferences.breakfastPreference}\n`

      if (profile.preferences.lunchPreference)
        section += `- Lunch style: ${profile.preferences.lunchPreference}\n`

      if (profile.preferences.dinnerPreference)
        section += `- Dinner style: ${profile.preferences.dinnerPreference}\n`

      if (profile.preferences.maxPrepTime)
        section += `- Max prep time: ${profile.preferences.maxPrepTime} minutes\n`

      if (profile.preferences.maxCookTime)
        section += `- Max cook time: ${profile.preferences.maxCookTime} minutes\n`

      if (profile.preferences.budgetPerMeal)
        section += `- Budget per meal: ${profile.preferences.budgetPerMeal}\n`

      if (profile.preferences.organicPreferred)
        section += `- Organic ingredients preferred\n`

      if (profile.preferences.localPreferred)
        section += `- Local ingredients preferred\n`

      if (profile.preferences.seasonalPreferred)
        section += `- Seasonal ingredients preferred\n`
    }

    if (profile.goals?.length) {
      section += '\n🎯 USER GOALS:\n'
      profile.goals.forEach(goal => {
        section += `- ${goal.replace(/-/g, ' ')}\n`
      })
    }

    // ============================================================
    // SESSION CONTEXT
    // ============================================================

    if (context.session) {
      section += '\n🔄 SESSION CONTEXT:\n'

      if (context.session.modifications.length) {
        context.session.modifications.forEach(mod => {
          if (mod.mealId) {
            section += `- Rejected ${mod.mealId}: "${mod.reason}"\n`
          } else {
            section += `- Full regeneration requested: "${mod.reason}"\n`
          }
        })
      }

      if (context.session.temporaryConstraints.length) {
        section += '- Temporary constraints:\n'
        context.session.temporaryConstraints.forEach(c => {
          section += `  • ${c}\n`
        })
      }
    }

    return section
  }

  // ============================================================
  // GENERATION INSTRUCTIONS
  // ============================================================

  private buildGenerationInstructions(
    context: FullContext,
    config: PromptConfig
  ): string {

    let instructions = '\n=== GENERATION INSTRUCTIONS ===\n\n'

    instructions += `Generate a ${config.numberOfDays}-day meal plan with breakfast, lunch, and dinner for each day.\n\n`

    const goals = context.user.profile.goals ?? []

    if (goals.includes('build-muscle'))
      instructions += '⚠ Ensure strong protein distribution across meals.\n'

    if (goals.includes('lose-weight'))
      instructions += '⚠ Slight calorie control while maintaining satiety.\n'

    if (goals.includes('save-time'))
      instructions += '⚠ Favor quick, efficient recipes.\n'

    if (goals.includes('save-money'))
      instructions += '⚠ Use cost-effective ingredients.\n'

    if (goals.includes('try-new-foods'))
      instructions += '⚠ Increase cuisine diversity.\n'

    return instructions
  }
}
