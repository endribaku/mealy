import { mockMealPlans } from './mock-meal-plans.js'

export interface MealModification {
  mealId: string
  action: 'reject' | 'regenerate'
  reason: string
  timestamp: string
}

export interface PlanModification {
  action: 'regenerate-all'
  reason: string
  timestamp: string
}

export type SessionModification = MealModification | PlanModification

export interface MockSession {
  sessionId: string
  userId: string
  mealPlanId: string
  currentMealPlan: any | null  // The actual MealPlan object (null if session just created)
  modifications: SessionModification[]
  temporaryConstraints: string[]
}

export const mockSessions: Record<string, MockSession> = {
  'session-001': {
    sessionId: 'session-001',
    userId: 'user-002',
    mealPlanId: 'plan-001',
    currentMealPlan: null,  // No meal plan generated yet
    modifications: [],
    temporaryConstraints: []
  },

  'session-002': {
    sessionId: 'session-002',
    userId: 'user-002',
    mealPlanId: 'plan-002',
    currentMealPlan: mockMealPlans['plan-002'],  // ✅ Now has actual meal plan
    modifications: [
      {
        mealId: 'dinner-day3',
        action: 'reject',
        reason: 'too spicy',
        timestamp: new Date().toISOString()
      },
      {
        mealId: 'lunch-day5',
        action: 'reject',
        reason: 'too heavy, want something lighter',
        timestamp: new Date().toISOString()
      }
    ],
    temporaryConstraints: [
      'User wants lighter meals this week',
      'Avoid spicy dishes'
    ]
  },

  'session-003': {
    sessionId: 'session-003',
    userId: 'user-003',
    mealPlanId: 'plan-003',
    currentMealPlan: mockMealPlans['plan-003'],  // ✅ Now has actual meal plan
    modifications: [
      {
        mealId: 'breakfast-day1',
        action: 'reject',
        reason: 'has mushrooms',
        timestamp: new Date().toISOString()
      },
      {
        mealId: 'lunch-day2',
        action: 'reject',
        reason: 'too complicated',
        timestamp: new Date().toISOString()
      },
      {
        mealId: 'dinner-day4',
        action: 'reject',
        reason: 'has onions',
        timestamp: new Date().toISOString()
      }
    ],
    temporaryConstraints: [
      'Keep recipes very simple',
      'No mushrooms or onions this week'
    ]
  },

  'session-004': {
    sessionId: 'session-004',
    userId: 'user-002',
    mealPlanId: 'plan-004',
    currentMealPlan: null,
    modifications: [
      {
        action: 'regenerate-all',
        reason: 'not enough variety',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        action: 'regenerate-all',
        reason: 'too many Asian dishes',
        timestamp: new Date().toISOString()
      }
    ],
    temporaryConstraints: [
      'More variety in cuisines',
      'Balance Asian and Western dishes'
    ]
  },

  'session-005': {
    sessionId: 'session-005',
    userId: 'user-002',
    mealPlanId: 'plan-005',
    currentMealPlan: null,
    modifications: [
      {
        action: 'regenerate-all',
        reason: 'generally not satisfied with variety',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        mealId: 'dinner-day3',
        action: 'reject',
        reason: 'still too spicy after regeneration',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        mealId: 'lunch-day6',
        action: 'regenerate',
        reason: 'want something with more protein',
        timestamp: new Date().toISOString()
      }
    ],
    temporaryConstraints: [
      'More variety overall',
      'No spicy dinners',
      'Higher protein lunches'
    ]
  },
  
  'session-006': {
    sessionId: 'session-006',
    userId: 'user-002',
    mealPlanId: 'plan-006',
    currentMealPlan: null,
    modifications: [],
    temporaryConstraints: [
      'Low-carb meals this week only',
      'Higher protein than usual',
      'No pasta or rice'
    ]
  }
}