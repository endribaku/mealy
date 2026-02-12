# Context Builder Documentation

## Overview

The Context Builder is the first critical component in the meal planner engine. It implements the **Context Builder Process Flow** exactly as shown in the flowchart diagram.

## Purpose

The Context Builder's job is to gather all relevant user and session information and package it into a format that can be used by the AI to generate personalized meal plans.

## Process Flow

The Context Builder follows this exact process (matching the flowchart):

```
1. User requests meal plan generation
   ↓
2. Call buildFullContext(userId, sessionId?)
   ↓
3. Build User Context
   ├─ Lookup user in mockUsers
   ├─ Extract Hard Constraints (allergies, diet, calorieTarget)
   ├─ Extract Learned Preferences (dislikedIngredients, favoriteCuisines, etc.)
   ├─ Extract Metadata (cookingSkill, householdSize, stats)
   └─ Create UserContext object
   ↓
4. Build Session Context (if sessionId provided)
   ├─ Lookup session in mockSessions
   ├─ Extract modifications[] (rejections, regenerations)
   ├─ Extract temporaryConstraints[]
   └─ Create SessionContext object
   ↓ (if no sessionId: SessionContext = null)
   ↓
5. Combine & Estimate
   ├─ Combine UserContext + SessionContext
   ├─ Estimate token count (JSON length / 4)
   └─ Create FullContext object
   ↓
6. Return FullContext
```

## Core Components

### 1. UserContext

**Permanent** preferences and constraints for a user.

```typescript
interface UserContext {
  hardConstraints: {
    allergies: string[]       // Must be avoided (e.g., ['peanuts', 'shellfish'])
    diet: string              // Diet type (e.g., 'vegetarian', 'vegan', 'omnivore')
    calorieTarget: number     // Daily calorie target (e.g., 2000)
  }
  learnedPreferences: {
    dislikedIngredients: string[]  // Learned from feedback (e.g., ['cilantro'])
    favoriteCuisines: string[]     // Preferred cuisines (e.g., ['italian', 'thai'])
    spiceLevel: string | null      // Preferred spice level (e.g., 'mild')
    preferredComplexity: string | null  // Recipe complexity (e.g., 'simple')
  }
  metadata: {
    cookingSkill: string      // Skill level (e.g., 'beginner', 'intermediate')
    householdSize: number     // Number of people (e.g., 2)
    totalPlansGenerated: number   // Lifetime plan count
    totalRatings: number      // Total ratings given
  }
}
```

**Key Points:**
- **Hard Constraints** are non-negotiable (allergies, diet restrictions)
- **Learned Preferences** are accumulated over time through user feedback
- **Metadata** provides additional context about the user's situation

### 2. SessionContext

**Temporary** constraints and modifications for the current session.

```typescript
interface SessionContext {
  modifications: Array<{
    mealId?: string        // Present for single meal modifications
    action: string         // 'reject', 'regenerate', or 'regenerate-all'
    reason: string         // Why the user made this modification
    timestamp: string      // When this happened
  }>
  temporaryConstraints: string[]  // Session-specific constraints
}
```

**Key Points:**
- **Modifications** track what the user has rejected or regenerated
- **Temporary Constraints** only apply to this session (e.g., "Low-carb this week only")
- This data is **deleted** when the session ends
- Different from learned preferences which are permanent

**Example Temporary Constraints:**
- "Lighter meals this week"
- "Low-carb meals this week only"
- "Quick prep meals (under 30 minutes)"
- "No spicy dishes this week"

### 3. FullContext

The combined context that gets passed to the AI.

```typescript
interface FullContext {
  user: UserContext          // Permanent user preferences
  session: SessionContext | null  // Temporary session data (null for first generation)
  estimatedTokens: number    // Estimated token count for this context
}
```

## Usage

### Basic Usage

```typescript
import { ContextBuilder } from './context-builder-expanded.js'

const builder = new ContextBuilder()

// First generation (no session yet)
const context = builder.buildFullContext('user-001')
console.log(context)
// Output:
// {
//   user: { hardConstraints: {...}, learnedPreferences: {...}, metadata: {...} },
//   session: null,
//   estimatedTokens: 156
// }

// Subsequent generation (with session)
const contextWithSession = builder.buildFullContext('user-001', 'session-001')
console.log(contextWithSession)
// Output:
// {
//   user: { ... },
//   session: { modifications: [...], temporaryConstraints: [...] },
//   estimatedTokens: 234
// }
```

### Converting to Prompt String

```typescript
const context = builder.buildFullContext('user-001')
const promptString = builder.toPromptString(context)

// Use in AI prompt
const systemMessage = `
You are a meal planning assistant.

Here is the user context:
${promptString}

Generate a 7-day meal plan following these constraints...
`
```

### Error Handling

```typescript
import { UserNotFoundError, SessionNotFoundError } from './context-builder-expanded.js'

try {
  const context = builder.buildFullContext('user-999')
} catch (error) {
  if (error instanceof UserNotFoundError) {
    console.error('User does not exist')
    // Handle: Create new user or return error to client
  }
}

try {
  const context = builder.buildFullContext('user-001', 'session-999')
} catch (error) {
  if (error instanceof SessionNotFoundError) {
    console.error('Session does not exist')
    // Handle: Create new session or return error to client
  }
}
```

## Helper Functions

### Session Management Functions

These functions help enforce limits and track session state:

#### 1. Count Regenerations

```typescript
import { getFullPlanRegenerationCount } from './context-builder-expanded.js'

const session = builder.buildSessionContext('activeSession')
const count = getFullPlanRegenerationCount(session)

if (count >= MAX_REGENERATIONS) {
  // Prevent further regenerations
  console.log('User has reached regeneration limit')
}
```

#### 2. Count Individual Modifications

```typescript
import { getIndividualModificationCount } from './context-builder-expanded.js'

const session = builder.buildSessionContext('activeSession')
const count = getIndividualModificationCount(session)

if (count >= MAX_MODIFICATIONS) {
  // Prevent further individual meal modifications
  console.log('User has reached modification limit')
}
```

#### 3. Check Limits

```typescript
import { 
  hasReachedRegenerationLimit,
  hasReachedModificationLimit 
} from './context-builder-expanded.js'

const session = builder.buildSessionContext('activeSession')

if (hasReachedRegenerationLimit(session, 3)) {
  console.log('Cannot regenerate full plan anymore')
}

if (hasReachedModificationLimit(session, 20)) {
  console.log('Cannot modify individual meals anymore')
}
```

#### 4. Get Session Statistics

```typescript
import { getSessionStats } from './context-builder-expanded.js'

const session = builder.buildSessionContext('activeSession')
const stats = getSessionStats(session)

console.log(stats)
// Output:
// {
//   totalModifications: 5,
//   fullPlanRegenerations: 1,
//   individualModifications: 4,
//   rejectedMeals: 3,
//   temporaryConstraints: 2,
//   mostRecentAction: 'reject'
// }
```

## Real-World Scenarios

### Scenario 1: First-Time User

```typescript
// User just signed up, no previous meal plans
const context = builder.buildFullContext('user-001')

// Context will have:
// - User's hard constraints (allergies, diet)
// - Empty learned preferences (no history yet)
// - session: null (first generation)
```

### Scenario 2: User Rejects Spicy Meals

```typescript
// User generates plan, rejects 2 meals that were too spicy
// Session now tracks these rejections

const context = builder.buildFullContext('user-002', 'activeSession')

// Context will have:
// - User's preferences
// - Session modifications: 2 rejections with reason "too spicy"
// - Temporary constraint: "Avoid spicy dishes"
```

### Scenario 3: User Regenerates Whole Plan

```typescript
// User is unhappy with overall plan variety
// Regenerates entire plan

const context = builder.buildFullContext('user-002', 'regeneratedPlan')

// Context will have:
// - Session modifications: "regenerate-all" action
// - Temporary constraint: "More variety in cuisines"

// Check if limit reached
const session = context.session!
if (hasReachedRegenerationLimit(session, 3)) {
  console.log('User has reached max regenerations')
  // Force user to either accept plan or start new session
}
```

### Scenario 4: Temporary Diet Change

```typescript
// User wants low-carb meals just this week
// Created session with temporary constraints

const context = builder.buildFullContext('user-002', 'temporaryDiet')

// Context will have:
// - User's permanent preferences (unchanged)
// - Temporary constraints: ["Low-carb meals this week only"]
// 
// Important: These constraints are deleted when session ends
// User's permanent preferences remain unchanged
```

## Integration with Meal Planner Engine

The Context Builder is the first step in the meal planning flow:

```typescript
// Meal Planner Engine (pseudocode)
class MealPlannerEngine {
  async generateMealPlan(userId: string, sessionId?: string) {
    // Step 1: Build context
    const context = this.contextBuilder.buildFullContext(userId, sessionId)
    
    // Step 2: Check limits (if session exists)
    if (context.session) {
      if (hasReachedRegenerationLimit(context.session, MAX_REGENERATIONS)) {
        throw new Error('Regeneration limit reached')
      }
    }
    
    // Step 3: Convert to prompt
    const contextPrompt = this.contextBuilder.toPromptString(context)
    
    // Step 4: Generate meal plan with AI
    const mealPlan = await this.ai.generatePlan({
      systemMessage: this.buildSystemMessage(contextPrompt),
      userMessage: this.buildUserMessage(...)
    })
    
    // Step 5: Return meal plan
    return mealPlan
  }
}
```

## Token Estimation

The Context Builder estimates how many tokens the context will use:

```typescript
const context = builder.buildFullContext('user-002', 'activeSession')
console.log(`Estimated tokens: ${context.estimatedTokens}`)

// Rule of thumb: 1 token ≈ 4 characters
// A typical context uses 150-300 tokens
// This leaves plenty of room in the AI's context window for:
// - System message
// - Meal plan schema
// - Generated meal plan
```

## Differences from Learned Preferences

It's important to understand the difference between **Session Context** and **Learned Preferences**:

| Aspect | Session Context | Learned Preferences |
|--------|----------------|---------------------|
| Duration | Temporary (current session only) | Permanent (across all sessions) |
| Examples | "Low-carb this week only" | "User dislikes cilantro" |
| Storage | Deleted when session ends | Stored in user profile forever |
| Use Case | Temporary diet changes, one-off requests | Long-term preferences from feedback |

**Example:**
- User says "I want lighter meals this week" → **Session Context** (temporary)
- User consistently rejects meals with mushrooms → **Learned Preference** (permanent)

## Testing

Run the comprehensive test suite:

```bash
npx tsx test-context-builder-comprehensive.ts
```

This tests:
- ✓ User context building
- ✓ Session context building
- ✓ Full context combination
- ✓ Error handling
- ✓ Helper functions
- ✓ Real-world scenarios

## Next Steps

After implementing the Context Builder, the next components are:

1. **Meal Plan Generator** - Uses this context to prompt AI
2. **Session Manager** - Creates, updates, and times out sessions
3. **Modification Tracker** - Records user rejections and regenerations
4. **Learned Preference Updater** - Updates permanent preferences from feedback

## API Reference

See `context-builder-expanded.ts` for complete TypeScript definitions and inline documentation.