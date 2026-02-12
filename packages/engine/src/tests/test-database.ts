import { config } from '@mealy/config'
import { SupabaseDataAccess } from '../data/supabase-data-access.js'
import { MealPlanGenerator, AIProvider } from '../core/meal-plan/meal-plan-generator.js'
import { ContextBuilder } from '../core/context-builder.js'
import { User } from '../core/schemas/user-schemas.js'

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase Database & Meal Plan Engine...\n')

  // Confirm config loaded
  console.log('Loaded config:')
  console.log('OpenAI model:', config.ai.openai.model)
  console.log('Supabase URL:', config.database.supabaseUrl)
  console.log('')

  const dataAccess = new SupabaseDataAccess()
  console.log('✅ Supabase client initialized')

  // ============================================================
  // TEST 1: Create User
  // ============================================================

  const userInput: Omit<User, 'id'> = {
    email: `test-${Date.now()}@example.com`,
    profile: {
      name: 'Endri',
      diet: 'vegetarian',
      calorieTarget: 2000,
      cookingSkill: 'intermediate',
      householdSize: 2,
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

  const createdUser = await dataAccess.createUser(userInput)
  console.log(`✅ User created: ${createdUser.id}`)

  // ============================================================
  // TEST 2: Create Session
  // ============================================================

  const session = await dataAccess.createSession(createdUser.id)
  console.log(`✅ Session created: ${session.id}`)

  // ============================================================
  // TEST 3: Generate Initial Plan
  // ============================================================

  const generator = new MealPlanGenerator(dataAccess)

  const initialResult = await generator.generateMealPlan(
    createdUser.id,
    session.id,
    {
      provider: AIProvider.OPENAI,
      temperature: 0.7,
      promptConfig: {
        numberOfDays: 3,
        mealsPerDay: 3,
        includeNutritionSummary: true,
      }
    }
  )

  console.log(`✅ Initial plan generated`)
  console.log(`   Days: ${initialResult.mealPlan.days.length}`)

  await dataAccess.updateSessionMealPlan(session.id, initialResult.mealPlan)

  // ============================================================
  // TEST 4: Reject Single Meal
  // ============================================================



  console.log('\n🔄 TEST 4: Regenerating single meal with integrity checks...')

  const rejectedMealId = 'dinner-day1'
  const rejectionReason = 'Too spicy'

  // Take snapshot BEFORE regeneration
  const beforeRegenSnapshot = JSON.parse(
    JSON.stringify(initialResult.mealPlan)
  )

  await dataAccess.addSessionModification(session.id, {
    action: 'regenerate-meal',
    mealId: rejectedMealId,
    reason: rejectionReason
  })

  const regeneratedMealResult = await generator.regenerateSingleMeal(
    createdUser.id,
    session.id,
    rejectedMealId,
    rejectionReason
  )

  console.log(`✅ Single meal regenerated`)

  // Integrity validation
  const afterRegen = regeneratedMealResult.mealPlan

  let integrityPassed = true

  for (let dayIndex = 0; dayIndex < beforeRegenSnapshot.days.length; dayIndex++) {
    const beforeDay = beforeRegenSnapshot.days[dayIndex]
    const afterDay = afterRegen.days[dayIndex]

    if (!beforeDay || !afterDay) {
      integrityPassed = false
      console.error(`❌ Day mismatch at index ${dayIndex}`)
      continue
    }

    for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
      const beforeMeal = beforeDay.meals[mealType]
      const afterMeal = afterDay.meals[mealType]

      const mealIdentifier = `${mealType}-day${dayIndex + 1}`

      if (mealIdentifier === rejectedMealId) {
        // This meal SHOULD be different
        if (beforeMeal.name === afterMeal.name) {
          console.error(`❌ Rejected meal did NOT change`)
          integrityPassed = false
        } else {
          console.log(`   ✅ Rejected meal changed correctly`)
        }
      } else {
        // These meals MUST remain unchanged
        if (beforeMeal.name !== afterMeal.name) {
          console.error(`❌ ${mealType} on day ${dayIndex + 1} was modified unexpectedly`)
          integrityPassed = false
        }
      }
    }
  }

  if (!integrityPassed) {
    throw new Error('Single meal regeneration integrity check failed')
  }

  console.log('✅ Integrity check passed — only targeted meal was modified')

  await dataAccess.updateSessionMealPlan(
    session.id,
    regeneratedMealResult.mealPlan
  )


  // ============================================================
  // TEST 5: Full Plan Regeneration
  // ============================================================

  const fullReason = 'Need more variety'

  await dataAccess.addSessionModification(session.id, {
    action: 'regenerate-all',
    reason: fullReason
  })

  const fullRegenResult = await generator.regenerateFullPlan(
    createdUser.id,
    session.id,
    fullReason
  )

  console.log(`✅ Full plan regenerated`)

  await dataAccess.updateSessionMealPlan(
    session.id,
    fullRegenResult.mealPlan
  )

  // ============================================================
  // TEST 6: Save Confirmed Plan
  // ============================================================

  const savedPlan = await dataAccess.saveMealPlan(
    createdUser.id,
    fullRegenResult.mealPlan
  )

  console.log(`✅ Plan saved: ${savedPlan.id}`)

  // ============================================================
  // TEST 7: Context Builder
  // ============================================================

  const contextBuilder = new ContextBuilder(dataAccess)

  const fullContext = await contextBuilder.buildFullContext(
    createdUser.id,
    session.id
  )

  console.log(`✅ Context built`)
  console.log(`   Estimated tokens: ${fullContext.estimatedTokens}`)

  // ============================================================
  // CLEANUP
  // ============================================================

  await dataAccess.deleteMealPlan(savedPlan.id)
  await dataAccess.deleteSession(session.id)
  await dataAccess.deleteUser(createdUser.id)

  console.log('\n' + '='.repeat(60))
  console.log('🎉 ALL TESTS PASSED (Domain-Aligned)')
  console.log('='.repeat(60))
}

console.log('Starting test suite...\n')

testDatabaseConnection().catch((error) => {
  console.error('\n❌ TEST FAILED')
  console.error(error)
})
