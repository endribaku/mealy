import { 
  User,
  UserProfileUpdate,
  LearnedPreferencesUpdate,
  DietaryRestrictionsUpdate
} from '../core/schemas/user-schemas.js'

import { Session, MealPlan } from '../core/schemas/schemas.js'

/**
 * IDataAccess
 *
 * Domain-aligned persistence interface.
 * No analytics.
 * No metadata tracking.
 * No infrastructure leakage.
 */
export interface IDataAccess {

  // ============================================================================
  // USER OPERATIONS (Domain Only)
  // ============================================================================

  findUserById(userId: string): Promise<User | null>

  findUserByEmail(email: string): Promise<User | null>

  createUser(user: Omit<User, 'id'>): Promise<User>

  updateUserProfile(
    userId: string,
    updates: UserProfileUpdate
  ): Promise<User>

  updateLearnedPreferences(
    userId: string,
    updates: LearnedPreferencesUpdate
  ): Promise<User>

  updateDietaryRestrictions(
    userId: string,
    updates: DietaryRestrictionsUpdate
  ): Promise<User>

  deleteUser(userId: string): Promise<boolean>


  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  findSessionById(sessionId: string): Promise<Session | null>

  findSessionsByUserId(
    userId: string,
    limit?: number
  ): Promise<Session[]>

  createSession(userId: string): Promise<Session>

  updateSessionMealPlan(
    sessionId: string,
    mealPlan: MealPlan
  ): Promise<Session>

  addSessionModification(
    sessionId: string,
    modification: {
      action: 'regenerate-meal' | 'regenerate-all'
      mealId?: string
      reason: string
    }
  ): Promise<Session>

  addSessionConstraint(
    sessionId: string,
    constraint: string
  ): Promise<Session>

  deleteSession(sessionId: string): Promise<boolean>

  expireOldSessions(olderThanDays: number): Promise<number>


  // ============================================================================
  // MEAL PLAN OPERATIONS
  // ============================================================================

  saveMealPlan(
    userId: string,
    mealPlan: MealPlan
  ): Promise<MealPlan & { id: string }>

  findMealPlanById(
    mealPlanId: string
  ): Promise<(MealPlan & { id: string }) | null>

  findMealPlansByUserId(
    userId: string,
    limit?: number
  ): Promise<Array<MealPlan & { id: string }>>

  deleteMealPlan(mealPlanId: string): Promise<boolean>
}

