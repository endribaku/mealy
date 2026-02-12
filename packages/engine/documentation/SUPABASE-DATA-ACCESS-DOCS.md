# SupabaseDataAccess Documentation

Complete guide to using the SupabaseDataAccess class in your meal planner engine.

## 📚 Table of Contents

1. [Setup & Initialization](#setup--initialization)
2. [User Operations](#user-operations)
3. [Session Operations](#session-operations)
4. [Meal Plan Operations](#meal-plan-operations)
5. [Analytics Operations](#analytics-operations)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Setup & Initialization

### Prerequisites

```bash
# Install dependencies
npm install @supabase/supabase-js
```

### Environment Variables

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Basic Initialization

```typescript
import { SupabaseDataAccess } from './data/supabase-data-access.js'

// Initialize (reads from environment variables)
const dataAccess = new SupabaseDataAccess()
```

---

## User Operations

### Create User

**Purpose:** Create a new user in the database

**Method:** `createUser(user: Omit<User, 'id'>): Promise<User>`

**Example:**

```typescript
import { createNewUser } from './core/user-schemas.js'

// Create user with helper function
const newUser = createNewUser({
  email: 'john@example.com',
  name: 'John Doe',
  diet: 'vegetarian',
  calorieTarget: 2000,
  cookingSkill: 'intermediate',
  householdSize: 2,
})

const user = await dataAccess.createUser(newUser)
console.log('User created:', user.id)
```

**Returns:**
```typescript
User {
  id: 'uuid',
  profile: { email, name, diet, ... },
  learnedPreferences: { favoriteCuisines: [], ... },
  metadata: { totalMealPlansGenerated: 0, ... }
}
```

---

### Find User by ID

**Purpose:** Retrieve a user by their unique ID

**Method:** `findUserById(userId: string): Promise<User | null>`

**Example:**

```typescript
const user = await dataAccess.findUserById('user-uuid')

if (user) {
  console.log(`Found: ${user.profile.name}`)
  console.log(`Diet: ${user.profile.diet}`)
  console.log(`Cooking skill: ${user.profile.cookingSkill}`)
} else {
  console.log('User not found')
}
```

**Returns:** `User` object or `null` if not found

---

### Find User by Email

**Purpose:** Retrieve a user by their email address

**Method:** `findUserByEmail(email: string): Promise<User | null>`

**Example:**

```typescript
const user = await dataAccess.findUserByEmail('john@example.com')

if (user) {
  console.log('User exists:', user.id)
} else {
  console.log('No user with that email')
}
```

**Use Cases:**
- Check if email already exists before signup
- Login systems
- User lookup

---

### Update User Profile

**Purpose:** Update user's profile information (name, diet, preferences, etc.)

**Method:** `updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<User>`

**Example:**

```typescript
// Update diet and calorie target
const updatedUser = await dataAccess.updateUserProfile(userId, {
  diet: 'vegan',
  calorieTarget: 1800,
  cookingSkill: 'advanced',
})

console.log('Profile updated!')
```

**Partial Updates Supported:**
```typescript
// Only update what changed
await dataAccess.updateUserProfile(userId, {
  householdSize: 4,  // Only this changes
})
```

---

### Update Learned Preferences

**Purpose:** Update AI-learned preferences (favorites, dislikes)

**Method:** `updateLearnedPreferences(userId: string, updates: LearnedPreferencesUpdate): Promise<User>`

**Example:**

```typescript
// User liked Italian food
await dataAccess.updateLearnedPreferences(userId, {
  favoriteCuisines: ['italian', 'mexican', 'thai'],
})

// User dislikes mushrooms
await dataAccess.updateLearnedPreferences(userId, {
  dislikedIngredients: ['mushrooms', 'olives'],
})

// AI learned user prefers medium spice
await dataAccess.updateLearnedPreferences(userId, {
  spiceLevel: 'medium',
  preferredComplexity: 'moderate',
})
```

**Confidence Scores:**
```typescript
// Update with confidence
await dataAccess.updateLearnedPreferences(userId, {
  spiceLevel: 'spicy',
  confidence: {
    spiceLevel: 0.85,  // 85% confident
    preferredComplexity: 0.6,
  }
})
```

---

### Update User Metadata

**Purpose:** Update usage statistics and activity tracking

**Method:** `updateUserMetadata(userId: string, updates: UserMetadataUpdate): Promise<User>`

**Example:**

```typescript
// Track meal cooked
await dataAccess.updateUserMetadata(userId, {
  totalMealsCooked: user.metadata.totalMealsCooked + 1,
  lastLoginAt: new Date(),
})

// Track recipe viewed
await dataAccess.updateUserMetadata(userId, {
  totalRecipesViewed: user.metadata.totalRecipesViewed + 1,
})
```

**Helper Methods:**

```typescript
// Increment generation count (easier than manual update)
await dataAccess.incrementGenerationCount(userId)

// Add rating and auto-calculate average
await dataAccess.addRating(userId, 5)  // 5-star rating
```

---

### Delete User

**Purpose:** Soft delete (deactivate) a user

**Method:** `deleteUser(userId: string): Promise<boolean>`

**Example:**

```typescript
const success = await dataAccess.deleteUser(userId)

if (success) {
  console.log('User deactivated')
} else {
  console.log('Failed to deactivate user')
}
```

**Note:** This is a **soft delete** - sets `is_active = false`
- User data remains in database
- User cannot log in
- Can be reactivated if needed

---

## Session Operations

### Create Session

**Purpose:** Create a new meal planning session (expires in 7 days)

**Method:** `createSession(userId: string): Promise<Session>`

**Example:**

```typescript
const session = await dataAccess.createSession(userId)

console.log('Session created:', session.id)
console.log('Expires:', session.expiresAt)
console.log('Status:', session.status)  // 'active'
```

**What's Created:**
```typescript
Session {
  id: 'session-uuid',
  userId: 'user-uuid',
  status: 'active',
  createdAt: '2024-02-09T...',
  expiresAt: '2024-02-16T...',  // 7 days later
  modifications: [],
  temporaryConstraints: [],
  currentMealPlan: null,
}
```

---

### Find Session by ID

**Purpose:** Retrieve a session by its ID

**Method:** `findSessionById(sessionId: string): Promise<Session | null>`

**Example:**

```typescript
const session = await dataAccess.findSessionById(sessionId)

if (session) {
  console.log('Session found')
  console.log('Has meal plan:', !!session.currentMealPlan)
  console.log('Modifications:', session.modifications.length)
}
```

---

### Find User's Sessions

**Purpose:** Get all sessions for a user (newest first)

**Method:** `findSessionsByUserId(userId: string): Promise<Session[]>`

**Example:**

```typescript
const sessions = await dataAccess.findSessionsByUserId(userId)

console.log(`User has ${sessions.length} session(s)`)

sessions.forEach(session => {
  console.log(`- ${session.id}: ${session.status}`)
})
```

**Use Cases:**
- Show user's session history
- Resume previous session
- Clean up old sessions

---

### Update Session Meal Plan

**Purpose:** Save/update the current meal plan in a session

**Method:** `updateSessionMealPlan(sessionId: string, mealPlan: MealPlan): Promise<Session>`

**Example:**

```typescript
// After generating meal plan
const generator = new MealPlanGenerator()
const result = await generator.generateMealPlan(userId, sessionId)

// Save to session
await dataAccess.updateSessionMealPlan(sessionId, result.mealPlan)

console.log('Meal plan saved to session!')
```

**What's Saved:**
```typescript
session.currentMealPlan = {
  days: [
    { dayNumber: 1, meals: { breakfast, lunch, dinner } },
    { dayNumber: 2, meals: { ... } },
    // ...
  ],
  nutritionSummary: { avgDailyCalories, avgProtein }
}
```

---

### Add Session Modification

**Purpose:** Track when user regenerates meals (for learning)

**Method:** `addSessionModification(sessionId, modification): Promise<Session>`

**Example:**

```typescript
// User regenerated a single meal
await dataAccess.addSessionModification(sessionId, {
  action: 'regenerate-meal',
  mealId: 'dinner-day3',
  reason: 'Too spicy'
})

// User regenerated entire plan
await dataAccess.addSessionModification(sessionId, {
  action: 'regenerate-all',
  reason: 'Not enough variety'
})
```

**Why Track This:**
- Learn user preferences (AI)
- Understand what users don't like
- Improve future generations

---

### Add Session Constraint

**Purpose:** Add temporary constraint for this session only

**Method:** `addSessionConstraint(sessionId: string, constraint: string): Promise<Session>`

**Example:**

```typescript
// User: "Make it lighter this week"
await dataAccess.addSessionConstraint(sessionId, 'Lower calorie meals this week')

// User: "Quick meals only"
await dataAccess.addSessionConstraint(sessionId, 'All meals under 30 minutes prep')
```

**Note:** These constraints are **temporary** - only apply to this session

---

### Delete Session

**Purpose:** Remove a session (hard delete)

**Method:** `deleteSession(sessionId: string): Promise<boolean>`

**Example:**

```typescript
await dataAccess.deleteSession(sessionId)
console.log('Session deleted')
```

**Use Cases:**
- User cancels meal planning
- Clean up expired sessions
- User wants to start fresh

---

### Expire Old Sessions

**Purpose:** Cleanup job to remove expired sessions

**Method:** `expireOldSessions(olderThanDays: number): Promise<number>`

**Example:**

```typescript
// Delete sessions older than 30 days
const deletedCount = await dataAccess.expireOldSessions(30)

console.log(`Cleaned up ${deletedCount} old sessions`)
```

**Run Periodically:**
```typescript
// In a cron job or scheduled task
setInterval(async () => {
  await dataAccess.expireOldSessions(30)
}, 24 * 60 * 60 * 1000)  // Daily
```

---

## Meal Plan Operations

### Save Meal Plan

**Purpose:** Permanently save a confirmed meal plan

**Method:** `saveMealPlan(userId: string, mealPlan: MealPlan): Promise<MealPlan & { id: string }>`

**Example:**

```typescript
// User confirms: "Yes, I'll use this plan!"
const savedPlan = await dataAccess.saveMealPlan(userId, mealPlan)

console.log('Meal plan saved!')
console.log('ID:', savedPlan.id)
console.log('Days:', savedPlan.days.length)
```

**Difference from Session:**
- **Session:** Temporary working copy (7 days)
- **Saved Plan:** Permanent record (history)

---

### Find Meal Plan by ID

**Purpose:** Retrieve a specific meal plan

**Method:** `findMealPlanById(mealPlanId: string): Promise<(MealPlan & { id: string }) | null>`

**Example:**

```typescript
const plan = await dataAccess.findMealPlanById(planId)

if (plan) {
  console.log('Found plan:', plan.id)
  console.log('Days:', plan.days.length)
  console.log('Calories:', plan.nutritionSummary.avgDailyCalories)
}
```

---

### Find User's Meal Plans

**Purpose:** Get all saved meal plans for a user (history)

**Method:** `findMealPlansByUserId(userId: string): Promise<Array<MealPlan & { id: string }>>`

**Example:**

```typescript
const plans = await dataAccess.findMealPlansByUserId(userId)

console.log(`User has ${plans.length} saved meal plan(s)`)

plans.forEach((plan, index) => {
  console.log(`Plan ${index + 1}:`)
  console.log(`  - ${plan.days.length} days`)
  console.log(`  - ${plan.nutritionSummary.avgDailyCalories} cal/day`)
})
```

**Use Cases:**
- Show "My Meal Plans" page
- "Cook Again" feature
- Export meal history

---

### Delete Meal Plan

**Purpose:** Remove a saved meal plan

**Method:** `deleteMealPlan(mealPlanId: string): Promise<boolean>`

**Example:**

```typescript
await dataAccess.deleteMealPlan(planId)
console.log('Meal plan deleted')
```

---

## Analytics Operations

### Get User Stats

**Purpose:** Get statistics for a specific user

**Method:** `getUserStats(userId: string): Promise<UserStatsObject>`

**Example:**

```typescript
const stats = await dataAccess.getUserStats(userId)

console.log('Total plans:', stats.totalPlans)
console.log('Average rating:', stats.averageRating)
console.log('Favorite cuisines:', stats.favoritesCuisines)
console.log('Allergies:', stats.mostCommonAllergies)
```

**Returns:**
```typescript
{
  totalPlans: 15,
  averageRating: 4.5,
  favoritesCuisines: ['italian', 'mexican'],
  mostCommonAllergies: ['peanuts']
}
```

---

### Get Platform Stats

**Purpose:** Get overall platform statistics (admin)

**Method:** `getPlatformStats(): Promise<PlatformStatsObject>`

**Example:**

```typescript
const stats = await dataAccess.getPlatformStats()

console.log('Total users:', stats.totalUsers)
console.log('Active users:', stats.activeUsers)
console.log('Total plans:', stats.totalPlansGenerated)
console.log('Average rating:', stats.averageRating)
```

**Use Cases:**
- Admin dashboard
- Growth metrics
- Quality metrics

---

## Error Handling

### Common Errors

```typescript
try {
  const user = await dataAccess.createUser(newUser)
} catch (error) {
  if (error.message.includes('duplicate')) {
    console.error('Email already exists')
  } else if (error.message.includes('credentials')) {
    console.error('Check your SUPABASE_URL and SUPABASE_ANON_KEY')
  } else {
    console.error('Unknown error:', error.message)
  }
}
```

### Null Checks

```typescript
const user = await dataAccess.findUserById(userId)
if (!user) {
  throw new Error('User not found')
}

// Now safe to use user
console.log(user.profile.name)
```

### Validation

```typescript
import { UserSchema } from './core/user-schemas.js'

// Zod validation happens automatically in dataAccess
// But you can validate manually if needed:
try {
  const validated = UserSchema.parse(userData)
} catch (error) {
  console.error('Invalid user data:', error.errors)
}
```

---

## Best Practices

### 1. Always Check for Null

```typescript
// ✅ Good
const user = await dataAccess.findUserById(userId)
if (!user) {
  return res.status(404).json({ error: 'User not found' })
}

// ❌ Bad
const user = await dataAccess.findUserById(userId)
console.log(user.profile.name)  // May crash if null!
```

### 2. Use Helper Methods

```typescript
// ✅ Good - use helper
await dataAccess.incrementGenerationCount(userId)

// ❌ Bad - manual update
const user = await dataAccess.findUserById(userId)
await dataAccess.updateUserMetadata(userId, {
  totalMealPlansGenerated: user.metadata.totalMealPlansGenerated + 1
})
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  await dataAccess.createUser(newUser)
  return { success: true }
} catch (error) {
  console.error('User creation failed:', error)
  return { success: false, error: 'Email already exists' }
}
```

### 4. Clean Up Sessions

```typescript
// ✅ Good - delete old sessions periodically
setInterval(() => {
  dataAccess.expireOldSessions(30)
}, 24 * 60 * 60 * 1000)  // Daily
```

### 5. Use Transactions for Complex Operations

```typescript
// For operations that should succeed/fail together
async function confirmMealPlan(userId: string, sessionId: string) {
  const session = await dataAccess.findSessionById(sessionId)
  if (!session?.currentMealPlan) throw new Error('No plan to confirm')
  
  // Save plan
  await dataAccess.saveMealPlan(userId, session.currentMealPlan)
  
  // Update session status
  await dataAccess.addSessionModification(sessionId, {
    action: 'regenerate-all',
    reason: 'Plan confirmed'
  })
  
  // Update user stats
  await dataAccess.incrementGenerationCount(userId)
}
```

---

## Common Patterns

### Pattern 1: New User Signup Flow

```typescript
async function handleSignup(email: string, password: string, profile: any) {
  // 1. Create user
  const newUser = createNewUser({
    email,
    name: profile.name,
    diet: profile.diet,
    calorieTarget: profile.calorieTarget,
    cookingSkill: profile.cookingSkill,
  })
  
  const user = await dataAccess.createUser(newUser)
  
  // 2. Create first session
  const session = await dataAccess.createSession(user.id)
  
  return { user, session }
}
```

### Pattern 2: Generate & Save Meal Plan

```typescript
async function generateAndSavePlan(userId: string, days: number) {
  // 1. Create session
  const session = await dataAccess.createSession(userId)
  
  // 2. Generate plan
  const generator = new MealPlanGenerator()
  const result = await generator.generateMealPlan(userId, session.id, {
    promptConfig: { numberOfDays: days }
  })
  
  // 3. Save to session
  await dataAccess.updateSessionMealPlan(session.id, result.mealPlan)
  
  // 4. Update user stats
  await dataAccess.incrementGenerationCount(userId)
  
  return { session, mealPlan: result.mealPlan }
}
```

### Pattern 3: Regenerate Single Meal

```typescript
async function regenerateMeal(
  userId: string, 
  sessionId: string, 
  mealId: string, 
  reason: string
) {
  // 1. Track modification
  await dataAccess.addSessionModification(sessionId, {
    action: 'regenerate-meal',
    mealId,
    reason
  })
  
  // 2. Generate new meal
  const generator = new MealPlanGenerator()
  const result = await generator.regenerateSingleMeal(
    userId,
    sessionId,
    mealId,
    reason
  )
  
  // 3. Save updated plan
  await dataAccess.updateSessionMealPlan(sessionId, result.mealPlan)
  
  return result.mealPlan
}
```

### Pattern 4: User Confirms Plan

```typescript
async function confirmPlan(userId: string, sessionId: string) {
  // 1. Get session
  const session = await dataAccess.findSessionById(sessionId)
  if (!session?.currentMealPlan) {
    throw new Error('No meal plan to confirm')
  }
  
  // 2. Save permanently
  const savedPlan = await dataAccess.saveMealPlan(
    userId, 
    session.currentMealPlan
  )
  
  // 3. Mark session as confirmed
  await dataAccess.addSessionModification(sessionId, {
    action: 'regenerate-all',
    reason: 'User confirmed plan'
  })
  
  return savedPlan
}
```

---

## Troubleshooting

### Issue: "Missing Supabase credentials"

**Error:** `Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY`

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify variables are set
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Load environment variables
source .env
```

---

### Issue: "User not found" returns null

**Error:** `await dataAccess.findUserById(userId)` returns `null`

**Debugging:**
```typescript
// Check if user exists in database
const { data, error } = await supabase
  .from('users')
  .select('id')
  
console.log('Total users:', data?.length)
console.log('Looking for:', userId)
```

**Common causes:**
- Wrong user ID
- User was soft-deleted (is_active = false)
- Database connection issue

---

### Issue: "Failed to create user: duplicate"

**Error:** Email already exists

**Solution:**
```typescript
// Check if email exists first
const existing = await dataAccess.findUserByEmail(email)
if (existing) {
  throw new Error('Email already registered')
}

// Then create
await dataAccess.createUser(newUser)
```

---

### Issue: Session expired

**Error:** Session returns status = 'expired'

**Solution:**
```typescript
const session = await dataAccess.findSessionById(sessionId)

if (new Date(session.expiresAt) < new Date()) {
  // Create new session
  const newSession = await dataAccess.createSession(userId)
  return newSession
}
```

---

### Issue: RLS (Row Level Security) blocking access

**Error:** Can't read/write data even though it exists

**Solution:**
```sql
-- In Supabase SQL Editor, check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable with proper policies later
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## Quick Reference

| Operation | Method | Returns |
|-----------|--------|---------|
| Create user | `createUser(user)` | `User` |
| Find user | `findUserById(id)` | `User \| null` |
| Update profile | `updateUserProfile(id, updates)` | `User` |
| Create session | `createSession(userId)` | `Session` |
| Save meal plan | `updateSessionMealPlan(id, plan)` | `Session` |
| Track change | `addSessionModification(id, mod)` | `Session` |
| Save confirmed | `saveMealPlan(userId, plan)` | `MealPlan & { id }` |
| Get stats | `getUserStats(userId)` | `StatsObject` |

---

## Additional Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [JSONB Operations Guide](./JSONB-OPERATIONS-GUIDE.md)
- [User Schemas Documentation](./user-schemas.ts)
- [Session Schemas Documentation](./session-and-meal-schemas.ts)

---

**🎉 You're now ready to build with SupabaseDataAccess!**
