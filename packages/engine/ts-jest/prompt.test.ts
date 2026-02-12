import {
  PromptBuilder,
  DEFAULT_PROMPT_CONFIG,
  PromptConfig,
} from '../src/core/meal-plan/prompt-builder'

import {
  FullContext,
  SessionContext,
} from '../src/core/context-builder'

import { User } from '../src/core/schemas/user-schemas'

/* ========================================================================== */
/*                              TEST FACTORIES                                */
/* ========================================================================== */

function minimalUser(): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',

    profile: {
      name: 'Test User',
      diet: 'omnivore',
      calorieTarget: 2000,
      cookingSkill: 'intermediate',
      householdSize: 1,
      measurementSystem: 'metric',
      goals: [],
      preferences: undefined,
    },

    learnedPreferences: {
      dislikedIngredients: [],
      dislikedCuisines: [],
      dislikedMealTypes: [],
      favoriteCuisines: [],
      favoriteIngredients: [],
      favoriteMealTypes: [],
      spiceLevel: undefined,
      preferredComplexity: undefined,
      patterns: undefined,
    },

    dietaryRestrictions: undefined,
  }
}

function fullContext(
  user: User,
  session: SessionContext | null = null
): FullContext {
  return {
    user,
    session,
    estimatedTokens: 500,
  }
}

/* ========================================================================== */
/*                               TEST SUITE                                   */
/* ========================================================================== */

describe('PromptBuilder (Domain-Aligned Suite)', () => {
  let builder: PromptBuilder

  beforeEach(() => {
    builder = new PromptBuilder()
  })

  /* ======================================================================== */
  /*                             SYSTEM MESSAGE                               */
  /* ======================================================================== */

  describe('buildSystemMessage', () => {

    it('contains core instruction sections', () => {
      const msg = builder.buildSystemMessage()

      expect(msg).toContain('expert meal planning assistant')
      expect(msg).toContain('must strictly respect')
    })

    it('never includes undefined or null', () => {
      const msg = builder.buildSystemMessage()
      expect(msg).not.toMatch(/undefined|null/)
    })
  })

  /* ======================================================================== */
  /*                         HARD CONSTRAINT RENDERING                        */
  /* ======================================================================== */

  describe('Hard Constraints Rendering', () => {

    it('renders diet and calorie target', () => {
      const context = fullContext(minimalUser())

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Diet: omnivore')
      expect(msg).toContain('2000 kcal')
    })

    it('renders allergies when present', () => {
      const user = minimalUser()
      user.dietaryRestrictions = {
        allergies: [
          { name: 'peanuts', severity: 'severe' }
        ],
        intolerances: [],
        religiousRestrictions: [],
        ethicalRestrictions: [],
        medicalConditions: [],
        texturePreferences: undefined,
      }

      const context = fullContext(user)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Allergies: peanuts')
    })

    it('renders medical conditions', () => {
      const user = minimalUser()
      user.dietaryRestrictions = {
        allergies: [],
        intolerances: [],
        religiousRestrictions: [],
        ethicalRestrictions: [],
        medicalConditions: [
          { condition: 'Hypertension', dietaryNotes: 'Low sodium' }
        ],
        texturePreferences: undefined,
      }

      const context = fullContext(user)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Hypertension')
      expect(msg).toContain('Low sodium')
    })
  })

  /* ======================================================================== */
  /*                       LEARNED PREFERENCES                                 */
  /* ======================================================================== */

  describe('Learned Preferences Rendering', () => {

    it('renders optional learned fields correctly', () => {
      const user = minimalUser()
      user.learnedPreferences = {
        dislikedIngredients: ['onion'],
        dislikedCuisines: [],
        dislikedMealTypes: [],
        favoriteCuisines: ['mexican'],
        favoriteIngredients: [],
        favoriteMealTypes: [],
        spiceLevel: 'medium',
        preferredComplexity: 'simple',
        patterns: undefined,
      }

      const context = fullContext(user)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Disliked ingredients: onion')
      expect(msg).toContain('Favorite cuisines: mexican')
      expect(msg).toContain('Preferred spice level: medium')
      expect(msg).toContain('Preferred complexity: simple')
    })
  })

  /* ======================================================================== */
  /*                               GOALS                                      */
  /* ======================================================================== */

  describe('Goals', () => {

    it('formats goals properly', () => {
      const user = minimalUser()
      user.profile.goals = ['lose-weight', 'eat-healthier']

      const context = fullContext(user)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('lose weight')
      expect(msg).toContain('eat healthier')
    })
  })

  /* ======================================================================== */
  /*                               SESSION                                    */
  /* ======================================================================== */

  describe('Session Context', () => {

    it('renders rejected meal feedback', () => {
      const session: SessionContext = {
        currentMealPlan: null,
        modifications: [
          {
            mealId: 'dinner-day1',
            action: 'regenerate-meal',
            reason: 'Too spicy',
            timestamp: '2024-01-01',
          },
        ],
        temporaryConstraints: [],
      }

      const context = fullContext(minimalUser(), session)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Rejected dinner-day1')
      expect(msg).toContain('Too spicy')
    })

    it('renders temporary constraints', () => {
      const session: SessionContext = {
        currentMealPlan: null,
        modifications: [],
        temporaryConstraints: ['No red meat'],
      }

      const context = fullContext(minimalUser(), session)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('No red meat')
    })
  })

  /* ======================================================================== */
  /*                        GENERATION INSTRUCTIONS                            */
  /* ======================================================================== */

  describe('Generation Instructions', () => {

    it('uses correct number of days from config', () => {
      const config: PromptConfig = {
        numberOfDays: 5,
        mealsPerDay: 3,
        includeNutritionSummary: true,
      }

      const context = fullContext(minimalUser())

      const msg = builder.buildUserMessage(context, config)

      expect(msg).toContain('Generate a 5-day meal plan')
    })

    it('adds beginner warning when cooking skill is beginner', () => {
      const user = minimalUser()
      user.profile.cookingSkill = 'beginner'

      const context = fullContext(user)

      const msg = builder.buildUserMessage(context)

      expect(msg).toContain('Cooking skill: beginner')
    })


  })

  /* ======================================================================== */
  /*                              INTEGRATION                                  */
  /* ======================================================================== */

  describe('buildPrompt Integration', () => {

    it('builds complete prompt object', () => {
      const context = fullContext(minimalUser())

      const prompt = builder.buildPrompt(context)

      expect(prompt.systemMessage.length).toBeGreaterThan(50)
      expect(prompt.userMessage.length).toBeGreaterThan(200)
    })

    it('never includes undefined or null anywhere', () => {
      const context = fullContext(minimalUser())

      const prompt = builder.buildPrompt(context)

      expect(prompt.systemMessage).not.toMatch(/undefined|null/)
      expect(prompt.userMessage).not.toMatch(/undefined|null/)
    })
  })

  /* ======================================================================== */
/*                    EXTENDED PREFERENCES RENDERING                         */
/* ======================================================================== */

describe('Extended Preferences Rendering', () => {

  it('renders intolerances, religious and ethical restrictions', () => {
    const user = minimalUser()

    user.dietaryRestrictions = {
      allergies: [],
      intolerances: [{ name: 'lactose' }],
      religiousRestrictions: ['halal'],
      ethicalRestrictions: ['no factory farming'],
      medicalConditions: [],
      texturePreferences: undefined,
    }

    const context = fullContext(user)

    const msg = builder.buildUserMessage(context)

    expect(msg).toContain('Intolerances: lactose')
    expect(msg).toContain('Religious restrictions: halal')
    expect(msg).toContain('Ethical restrictions: no factory farming')
  })

  it('renders texture preferences', () => {
    const user = minimalUser()

    user.dietaryRestrictions = {
      allergies: [],
      intolerances: [],
      religiousRestrictions: [],
      ethicalRestrictions: [],
      medicalConditions: [],
      texturePreferences: {
        avoid: ['mushy'],
        prefer: ['crispy'],
      },
    }

    const context = fullContext(user)

    const msg = builder.buildUserMessage(context)

    expect(msg).toContain('Avoid textures: mushy')
    expect(msg).toContain('Prefer textures: crispy')
  })

  it('renders favorite ingredients and meal types', () => {
    const user = minimalUser()

    user.learnedPreferences.favoriteIngredients = ['avocado']
    user.learnedPreferences.favoriteMealTypes = ['salads']
    user.learnedPreferences.dislikedMealTypes = ['soups']

    const context = fullContext(user)

    const msg = builder.buildUserMessage(context)

    expect(msg).toContain('Favorite ingredients: avocado')
    expect(msg).toContain('Favorite meal types: salads')
    expect(msg).toContain('Disliked meal types: soups')
  })

  it('renders pattern-based preferences', () => {
    const user = minimalUser()

    user.learnedPreferences.patterns = {
      proteinPreferences: ['salmon'],
      cookingMethodPreferences: ['grilling'],
      prefersLeftovers: true,
      prefersBatchCooking: true,
      prefersMealPrep: true,
    }

    const context = fullContext(user)

    const msg = builder.buildUserMessage(context)

    expect(msg).toContain('Preferred proteins: salmon')
    expect(msg).toContain('Preferred cooking methods: grilling')
    expect(msg).toContain('Prefers leftovers')
    expect(msg).toContain('Prefers batch cooking')
    expect(msg).toContain('Prefers structured meal prep')
  })

  it('renders profile-level preferences', () => {
    const user = minimalUser()

    user.profile.preferences = {
      breakfastPreference: 'light',
      lunchPreference: 'packed',
      dinnerPreference: 'family-style',
      maxPrepTime: 20,
      maxCookTime: 40,
      budgetPerMeal: 8,
      organicPreferred: true,
      localPreferred: true,
      seasonalPreferred: true,
    }

    const context = fullContext(user)

    const msg = builder.buildUserMessage(context)

    expect(msg).toContain('Breakfast style: light')
    expect(msg).toContain('Lunch style: packed')
    expect(msg).toContain('Dinner style: family-style')
    expect(msg).toContain('Max prep time: 20 minutes')
    expect(msg).toContain('Max cook time: 40 minutes')
    expect(msg).toContain('Budget per meal: 8')
    expect(msg).toContain('Organic ingredients preferred')
    expect(msg).toContain('Local ingredients preferred')
    expect(msg).toContain('Seasonal ingredients preferred')
  })

  it('does not render empty optional blocks', () => {
    const context = fullContext(minimalUser())

    const msg = builder.buildUserMessage(context)

    expect(msg).not.toContain('Intolerances:')
    expect(msg).not.toContain('Religious restrictions:')
    expect(msg).not.toContain('Ethical restrictions:')
    expect(msg).not.toContain('Avoid textures:')
    expect(msg).not.toContain('Preferred proteins:')
  })

})

})
