import type { IDataAccess } from '@mealy/engine'
import {
  User,
  UserSchema,
  UserProfileUpdate,
  LearnedPreferencesUpdate,
  DietaryRestrictionsUpdate,
  Session,
  SessionSchema,
  MealPlan,
  StoredMealPlan
} from '@mealy/engine'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from '@mealy/config'

/**
 * Supabase Data Access Implementation
 * 
 * Implements IDataAccess interface using Supabase as the database.
 * Handles serialization/deserialization between TypeScript and JSONB.
 */
export class SupabaseDataAccess implements IDataAccess {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = config.database.supabaseUrl
    const supabaseKey = config.database.supabaseAnonKey


    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

    // ============================================================================
  // USER OPERATIONS (DOMAIN-ALIGNED)
  // ============================================================================

  async findUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find user: ${error.message}`)
    }

    if (!data) return null

    return this.deserializeUser(data)
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find user by email: ${error.message}`)
    }

    if (!data) return null

    return this.deserializeUser(data)
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const userId = crypto.randomUUID()

    const defaultMetadata = {
      totalMealPlansGenerated: 0,
      totalRatings: 0,
      averageRating: null,
    }

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        id: userId,
        email: user.email,
        profile: user.profile,                     // JSONB NOT NULL
        learned_preferences: user.learnedPreferences, // JSONB NOT NULL
        metadata: defaultMetadata,                 // JSONB NOT NULL
        dietary_restrictions: user.dietaryRestrictions ?? null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return this.deserializeUser(data)
  }



  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<User> {
    const currentUser = await this.findUserById(userId)
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`)
    }

    const updatedProfile = {
      ...currentUser.profile,
      ...updates,
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({
        profile: updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return this.deserializeUser(data)
  }


  async updateLearnedPreferences(
      userId: string,
      updates: LearnedPreferencesUpdate
    ): Promise<User> {
      const currentUser = await this.findUserById(userId)
      if (!currentUser) {
        throw new Error(`User not found: ${userId}`)
      }

      const updatedPreferences = {
        ...currentUser.learnedPreferences,
        ...updates,
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          learned_preferences: updatedPreferences,
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update learned preferences: ${error.message}`)
      }

      return this.deserializeUser(data)
    }

    async updateDietaryRestrictions(
    userId: string,
    updates: DietaryRestrictionsUpdate
  ): Promise<User> {
    const currentUser = await this.findUserById(userId)
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`)
    }

    const updatedRestrictions = {
      ...(currentUser.dietaryRestrictions || {}),
      ...updates,
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({
        dietary_restrictions: updatedRestrictions,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update dietary restrictions: ${error.message}`)
    }

    return this.deserializeUser(data)
  }


  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return true
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async findSessionById(sessionId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find session: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return this.deserializeSession(data)
  }

  async findSessionsByUserId(userId: string, limit: number = 50): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit) // ✅ FIX: Add pagination limit

    if (error) {
      throw new Error(`Failed to find sessions for user: ${error.message}`)
    }

    return data.map(row => this.deserializeSession(row))
  }

  async createSession(userId: string): Promise<Session> {
    const sessionId = crypto.randomUUID()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        created_at: now,
        updated_at: now,
        expires_at: expiresAt,
        status: 'active',
        modifications: [],
        temporary_constraints: [],
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return this.deserializeSession(data)
  }

  async updateSessionMealPlan(sessionId: string, mealPlan: MealPlan): Promise<Session> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        current_meal_plan: mealPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update session meal plan: ${error.message}`)
    }

    return this.deserializeSession(data)
  }

  async addSessionModification(
    sessionId: string,
    modification: {
      action: 'regenerate-meal' | 'regenerate-all'
      mealId?: string
      reason: string
    }
  ): Promise<Session> {
    // Get current session
    const session = await this.findSessionById(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    // Add new modification
    const newModification = {
      timestamp: new Date().toISOString(),
      action: modification.action,
      mealId: modification.mealId,
      reason: modification.reason,
    }

    const updatedModifications = [...session.modifications, newModification]

    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        modifications: updatedModifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add session modification: ${error.message}`)
    }

    return this.deserializeSession(data)
  }

  async addSessionConstraint(sessionId: string, constraint: string): Promise<Session> {
    const session = await this.findSessionById(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const updatedConstraints = [...session.temporaryConstraints, constraint]

    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        temporary_constraints: updatedConstraints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add session constraint: ${error.message}`)
    }

    return this.deserializeSession(data)
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`)
    }

    return true
  }

  async expireOldSessions(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('sessions')
      .delete()
      .lt('expires_at', cutoffDate.toISOString())
      .neq('status', 'confirmed')
      .select('id')

    if (error) {
      throw new Error(`Failed to expire old sessions: ${error.message}`)
    }

    return data?.length || 0
  }

  async applySessionRegeneration(
    sessionId: string,
    mealPlan: MealPlan,
    modification: {
      action: 'regenerate-meal' | 'regenerate-all'
      mealId?: string
      reason: string
    }
  ): Promise<Session> {

    // 1️⃣ Fetch existing session
    const session = await this.findSessionById(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    // 2️⃣ Build new modification entry
    const newModification = {
      timestamp: new Date().toISOString(),
      action: modification.action,
      mealId: modification.mealId,
      reason: modification.reason,
    }

    const updatedModifications = [
      ...session.modifications,
      newModification
    ]

    // 3️⃣ Single update query
    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        current_meal_plan: mealPlan,
        modifications: updatedModifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(
        `Failed to apply session regeneration: ${error.message}`
      )
    }

    return this.deserializeSession(data)
  }


  // ============================================================================
  // MEAL PLAN OPERATIONS
  // ============================================================================

  async saveMealPlan(
    userId: string,
    mealPlan: MealPlan
  ): Promise<StoredMealPlan> {

    const mealPlanId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('meal_plans')
      .insert({
        id: mealPlanId,
        user_id: userId,
        plan: mealPlan,
        number_of_days: mealPlan.days.length,
        status: 'active',
        created_at: now,
        confirmed_at: now
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save meal plan: ${error.message}`)
    }

    return {
      id: data.id,
      userId: data.user_id,
      mealPlan: data.plan,
      createdAt: data.created_at,
      status: data.status
    }
  }



  async findMealPlanById(
    mealPlanId: string
  ): Promise<StoredMealPlan | null> {

    const { data, error } = await this.supabase
      .from('meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find meal plan: ${error.message}`)
    }

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      mealPlan: data.plan,
      createdAt: data.created_at,
      status: data.status
    }
  }


  async findMealPlansByUserId(
    userId: string,
    limit: number = 50
  ): Promise<StoredMealPlan[]> {

    const { data, error } = await this.supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(
        `Failed to find meal plans for user: ${error.message}`
      )
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      mealPlan: row.plan,
      createdAt: row.created_at,
      status: row.status
    }))
  }


  async deleteMealPlan(mealPlanId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)

    if (error) {
      throw new Error(`Failed to delete meal plan: ${error.message}`)
    }

    return true
  }

  // ============================================================================
  // ANALYTICS / REPORTING
  // ============================================================================

  async getUserStats(userId: string): Promise<{
    totalPlans: number
    favoritesCuisines: string[]
    mostCommonAllergies: string[]
  }> {

    const { count } = await this.supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const user = await this.findUserById(userId)

    return {
      totalPlans: count || 0,
      favoritesCuisines: user?.learnedPreferences.favoriteCuisines || [],
      mostCommonAllergies:
        user?.dietaryRestrictions?.allergies.map(a => a.name) || [],
    }
  }

  async getPlatformStats(): Promise<{
    totalUsers: number
    activeUsers: number
    totalPlansGenerated: number
  }> {

    const { count: totalUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalPlansGenerated } = await this.supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalPlansGenerated: totalPlansGenerated || 0,
    }
  }


  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Deserialize database row to User object
   * Converts JSONB fields and validates with Zod
   */
  private deserializeUser(row: any): User {
    return UserSchema.parse({
      id: row.id,
      email: row.email,
      profile: row.profile,
      learnedPreferences: row.learned_preferences,
      dietaryRestrictions: row.dietary_restrictions ?? undefined,
    })
  }


  /**
   * Deserialize database row to Session object
   */
  private deserializeSession(row: any): Session {
    return SessionSchema.parse({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      // Convert null to undefined for optional field
      currentMealPlan: row.current_meal_plan ?? undefined,
      modifications: row.modifications || [],
      temporaryConstraints: row.temporary_constraints || [],
      status: row.status,
    })
  }
}