import { config } from '@mealy/config'
import { SupabaseDataAccess } from '@mealy/data'
import { MealPlanGenerator, AIProvider } from '../core/meal-plan/meal-plan-generator.js'
import { ContextBuilder } from '../core/context-builder.js'
import { User } from '../core/schemas/user-schemas.js'

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase Database & Meal Plan Engine...\n')

  console.log('Loaded config:')
  console.log('OpenAI model:', config.ai.openai.model)
  console.log('Supabase URL:', config.database.supabaseUrl)
  console.log('')

  const dataAccess = new SupabaseDataAccess()
  const generator = new MealPlanGenerator()
  const contextBuilder = new ContextBuilder()

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
  // HELPER: Build FullContext
  // ============================================================

  async function buildContext() {
    const user = await dataAccess.findUserById(createdUser.id)
    if (!user) throw new Error('User not found')

    const rawSession = await dataAccess.findSessionById(session.id)

    const sessionContext = rawSession
      ? contextBuilder.buildSessionContext(rawSession)
      : null

    return contextBuilder.buildFullContext(user, sessionContext)
  }

  // ============================================================
  // TEST 3: Generate Initial Plan
  // ============================================================

  const initialContext = await buildContext()

  const initialResult = await generator.generateMealPlan(
    initialContext,
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
  // TEST 4: Regenerate Single Meal
  // ============================================================

  console.log('\n🔄 TEST 4: Regenerating single meal...')

  const rejectedMealId = 'dinner-day1'
  const rejectionReason = 'Too spicy'

  const beforeSnapshot = JSON.parse(
    JSON.stringify(initialResult.mealPlan)
  )


  await dataAccess.addSessionModification(session.id, {
    action: 'regenerate-meal',
    mealId: rejectedMealId,
    reason: rejectionReason
  })

  const singleContext = await buildContext()

  const regeneratedMealResult = await generator.regenerateSingleMeal(
    singleContext,
    rejectedMealId,
    rejectionReason
  )

  console.log(`✅ Single meal regenerated`)

  const afterRegen = regeneratedMealResult.mealPlan

  let integrityPassed = true

  // Ensure structure consistency first
if (beforeSnapshot.days.length !== afterRegen.days.length) {
  throw new Error(
    `Day count mismatch: before=${beforeSnapshot.days.length}, after=${afterRegen.days.length}`
  )
}

for (let dayIndex = 0; dayIndex < beforeSnapshot.days.length; dayIndex++) {
  const beforeDay = beforeSnapshot.days[dayIndex]
  const afterDay = afterRegen.days[dayIndex]

  if (!afterDay) {
    console.error(`❌ Missing day ${dayIndex + 1}`)
    integrityPassed = false
    continue
  }

  for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
    const beforeMeal = beforeDay.meals[mealType]
    const afterMeal = afterDay.meals[mealType]
    const mealIdentifier = `${mealType}-day${dayIndex + 1}`

    const mealsAreIdentical =
      JSON.stringify(beforeMeal) === JSON.stringify(afterMeal)

    if (mealIdentifier === rejectedMealId) {
      // This meal SHOULD change (structurally)
      if (mealsAreIdentical) {
        console.error(`❌ Rejected meal did NOT change`)
        integrityPassed = false
      } else {
        console.log(`   ✅ Rejected meal changed`)
      }
    } else {
      // All other meals MUST remain identical
        if (!mealsAreIdentical) {
          console.error(
            `❌ ${mealType} day ${dayIndex + 1} changed unexpectedly`
          )
          integrityPassed = false
        }
      }
    }
  }


  if (!integrityPassed) {
    throw new Error('Single meal regeneration integrity check failed')
  }

  console.log('✅ Integrity check passed')

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

  const fullContext = await buildContext()

  const fullRegenResult = await generator.regenerateFullPlan(
    fullContext,
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
  // CLEANUP
  // ============================================================

  await dataAccess.deleteMealPlan(savedPlan.id)
  await dataAccess.deleteSession(session.id)
  await dataAccess.deleteUser(createdUser.id)

  console.log('\n' + '='.repeat(60))
  console.log('🎉 ALL TESTS PASSED (Clean Architecture)')
  console.log('='.repeat(60))
}

console.log('Starting test suite...\n')

testDatabaseConnection().catch((error) => {
  console.error('\n❌ TEST FAILED')
  console.error(error)
})
