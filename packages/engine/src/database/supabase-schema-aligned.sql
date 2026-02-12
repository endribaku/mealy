-- ============================================================================
-- SUPABASE SQL SCHEMA - ALIGNED WITH TYPESCRIPT SCHEMAS
-- ============================================================================
-- This schema uses 3 tables with JSONB columns to store flexible data.
-- It matches your TypeScript Zod schemas exactly for easy serialization.
--
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- TABLE 1: USERS
-- Stores user profiles, preferences, and metadata as JSONB
-- Matches: UserSchema from user-schemas.ts
-- ============================================================================

CREATE TABLE users (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields (extracted for fast lookup)
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  diet TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- JSONB columns (store full schemas)
  profile JSONB NOT NULL,                    -- UserProfileSchema
  learned_preferences JSONB NOT NULL,        -- LearnedPreferencesSchema
  metadata JSONB NOT NULL,                   -- UserMetadataSchema
  dietary_restrictions JSONB,                -- DietaryRestrictionsSchema (optional)
  subscription JSONB,                        -- subscription object (optional)
  notifications JSONB,                       -- notifications object (optional)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_diet ON users(diet);

-- JSONB indexes for common queries
CREATE INDEX idx_users_profile_cooking_skill ON users((profile->>'cookingSkill'));
CREATE INDEX idx_users_profile_household_size ON users(((profile->>'householdSize')::INTEGER));
CREATE INDEX idx_users_favorite_cuisines ON users USING GIN ((learned_preferences->'favoriteCuisines'));
CREATE INDEX idx_users_disliked_ingredients ON users USING GIN ((learned_preferences->'dislikedIngredients'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: SESSIONS
-- Stores temporary meal planning sessions
-- Matches: SessionSchema from session-and-meal-schemas.ts
-- ============================================================================

CREATE TABLE sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session data as JSONB
  current_meal_plan JSONB,                   -- MealPlanSchema (optional)
  modifications JSONB DEFAULT '[]',          -- Array of SessionModificationSchema
  temporary_constraints JSONB DEFAULT '[]',  -- Array of strings
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'expired', 'cancelled')),
  
  -- Timestamps (stored as TEXT to match TypeScript)
  created_at TEXT NOT NULL DEFAULT (NOW()::TEXT),
  updated_at TEXT NOT NULL DEFAULT (NOW()::TEXT),
  expires_at TEXT NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- JSONB index for querying modifications
CREATE INDEX idx_sessions_modifications ON sessions USING GIN (modifications);

-- ============================================================================
-- TABLE 3: MEAL_PLANS
-- Stores confirmed/saved meal plans
-- Stores the full MealPlanSchema as JSONB
-- ============================================================================

CREATE TABLE meal_plans (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  
  -- Full meal plan as JSONB
  plan JSONB NOT NULL,                       -- MealPlanSchema
  
  -- Metadata
  plan_name TEXT,                            -- Optional user-given name
  number_of_days INTEGER,                    -- Extracted for convenience
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_session_id ON meal_plans(session_id);
CREATE INDEX idx_meal_plans_created_at ON meal_plans(created_at DESC);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);

-- JSONB indexes for querying meal plans
CREATE INDEX idx_meal_plans_plan_days ON meal_plans USING GIN ((plan->'days'));
CREATE INDEX idx_meal_plans_plan_nutrition ON meal_plans USING GIN ((plan->'nutritionSummary'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to cleanup expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions 
  WHERE expires_at < NOW()::TEXT 
    AND status NOT IN ('confirmed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to extract number of days from meal plan
CREATE OR REPLACE FUNCTION extract_meal_plan_days(plan_jsonb JSONB)
RETURNS INTEGER AS $$
BEGIN
  RETURN jsonb_array_length(plan_jsonb->'days');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set number_of_days when meal plan is inserted
CREATE OR REPLACE FUNCTION set_meal_plan_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.number_of_days = extract_meal_plan_days(NEW.plan);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_meal_plans_days 
  BEFORE INSERT OR UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION set_meal_plan_days();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - IMPORTANT FOR PRODUCTION
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you'll add proper auth later with Supabase Auth)
-- REPLACE THESE WITH PROPER POLICIES WHEN YOU ADD AUTHENTICATION
CREATE POLICY "Allow all operations on users during development" 
  ON users FOR ALL 
  USING (true);

CREATE POLICY "Allow all operations on sessions during development" 
  ON sessions FOR ALL 
  USING (true);

CREATE POLICY "Allow all operations on meal_plans during development" 
  ON meal_plans FOR ALL 
  USING (true);

-- ============================================================================
-- EXAMPLE: Proper RLS Policies (uncomment when you add Supabase Auth)
-- ============================================================================

-- Users can only see their own data
-- CREATE POLICY "Users can view own profile" 
--   ON users FOR SELECT 
--   USING (auth.uid() = id);
--
-- CREATE POLICY "Users can update own profile" 
--   ON users FOR UPDATE 
--   USING (auth.uid() = id);
--
-- -- Users can only see their own sessions
-- CREATE POLICY "Users can view own sessions" 
--   ON sessions FOR SELECT 
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can manage own sessions" 
--   ON sessions FOR ALL 
--   USING (auth.uid() = user_id);
--
-- -- Users can only see their own meal plans
-- CREATE POLICY "Users can view own meal plans" 
--   ON meal_plans FOR SELECT 
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can manage own meal plans" 
--   ON meal_plans FOR ALL 
--   USING (auth.uid() = user_id);

-- ============================================================================
-- TEST DATA - Verify schema works
-- ============================================================================

-- Insert a test user
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  INSERT INTO users (
    email, 
    name, 
    diet,
    profile,
    learned_preferences,
    metadata
  ) VALUES (
    'test@example.com',
    'Test User',
    'vegetarian',
    jsonb_build_object(
      'email', 'test@example.com',
      'name', 'Test User',
      'diet', 'vegetarian',
      'calorieTarget', 2000,
      'cookingSkill', 'intermediate',
      'householdSize', 1,
      'allergies', '[]'::jsonb,
      'goals', '[]'::jsonb,
      'measurementSystem', 'imperial',
      'isActive', true,
      'createdAt', NOW()::TEXT,
      'updatedAt', NOW()::TEXT
    ),
    jsonb_build_object(
      'dislikedIngredients', '[]'::jsonb,
      'favoriteCuisines', '[]'::jsonb,
      'dislikedCuisines', '[]'::jsonb,
      'dislikedMealTypes', '[]'::jsonb,
      'favoriteIngredients', '[]'::jsonb,
      'favoriteMealTypes', '[]'::jsonb,
      'lastUpdated', NOW()::TEXT
    ),
    jsonb_build_object(
      'totalMealPlansGenerated', 0,
      'totalMealsGenerated', 0,
      'totalRegenerations', 0,
      'totalRatings', 0,
      'totalMealsCooked', 0,
      'totalRecipesViewed', 0,
      'totalExports', 0,
      'activeDays', 0,
      'streakDays', 0,
      'longestStreak', 0,
      'completedPlans', 0,
      'abandonedPlans', 0,
      'featuresUsed', '[]'::jsonb,
      'createdAt', NOW()::TEXT,
      'updatedAt', NOW()::TEXT
    )
  ) RETURNING id INTO test_user_id;
  
  -- Create a test session
  INSERT INTO sessions (
    user_id,
    expires_at
  ) VALUES (
    test_user_id,
    (NOW() + INTERVAL '7 days')::TEXT
  );
  
  RAISE NOTICE 'Test user created with ID: %', test_user_id;
END $$;

-- Verify it worked
SELECT 
  id, 
  email, 
  name,
  diet,
  profile->>'cookingSkill' as cooking_skill,
  learned_preferences->>'favoriteCuisines' as favorite_cuisines
FROM users 
WHERE email = 'test@example.com';

-- ============================================================================
-- SCHEMA COMPLETE! ✅
-- ============================================================================
-- Next steps:
-- 1. Run this in Supabase SQL Editor
-- 2. Verify test data inserted successfully
-- 3. Implement SupabaseDataAccess in TypeScript
-- 4. Connect your meal planner engine!
-- ============================================================================
