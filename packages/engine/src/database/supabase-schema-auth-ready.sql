-- ============================================================================
-- SUPABASE SQL SCHEMA - AUTH-READY VERSION
-- ============================================================================
-- This schema is designed to work seamlessly with Supabase Auth
-- User IDs match auth.users table for easy integration
--
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- TABLE 1: USERS (Profile Extension)
-- This extends Supabase auth.users with your custom profile data
-- ============================================================================

CREATE TABLE users (
  -- Primary key - MATCHES Supabase Auth user ID
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
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
-- TRIGGER: Auto-create user profile when someone signs up
-- This automatically creates a users row when someone signs up via Supabase Auth
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (
    id,
    email,
    name,
    diet,
    profile,
    learned_preferences,
    metadata
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),  -- Get name from signup
    'omnivore',  -- Default diet
    jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
      'diet', 'omnivore',
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- TABLE 2: SESSIONS
-- ============================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key - references auth user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session data as JSONB
  current_meal_plan JSONB,
  modifications JSONB DEFAULT '[]',
  temporary_constraints JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'expired', 'cancelled')),
  
  -- Timestamps (stored as TEXT to match TypeScript)
  created_at TEXT NOT NULL DEFAULT (NOW()::TEXT),
  updated_at TEXT NOT NULL DEFAULT (NOW()::TEXT),
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_modifications ON sessions USING GIN (modifications);

-- ============================================================================
-- TABLE 3: MEAL_PLANS
-- ============================================================================

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  
  -- Full meal plan as JSONB
  plan JSONB NOT NULL,
  
  -- Metadata
  plan_name TEXT,
  number_of_days INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_session_id ON meal_plans(session_id);
CREATE INDEX idx_meal_plans_created_at ON meal_plans(created_at DESC);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
CREATE INDEX idx_meal_plans_plan_days ON meal_plans USING GIN ((plan->'days'));

-- Auto-set number_of_days
CREATE OR REPLACE FUNCTION set_meal_plan_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.number_of_days = jsonb_array_length(NEW.plan->'days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_meal_plans_days 
  BEFORE INSERT OR UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION set_meal_plan_days();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - PRODUCTION-READY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Note: INSERT is handled by trigger, DELETE by admin only

-- ============================================================================
-- SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" 
  ON sessions FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" 
  ON sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" 
  ON sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" 
  ON sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- MEAL_PLANS TABLE POLICIES
-- ============================================================================

-- Users can view their own meal plans
CREATE POLICY "Users can view own meal plans" 
  ON meal_plans FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own meal plans
CREATE POLICY "Users can create own meal plans" 
  ON meal_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans
CREATE POLICY "Users can update own meal plans" 
  ON meal_plans FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete own meal plans" 
  ON meal_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- OPTIONAL: Admin policies (uncomment if you need admin access)
-- ============================================================================

-- CREATE POLICY "Admins can view all users" 
--   ON users FOR SELECT 
--   USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins can update all users" 
--   ON users FOR UPDATE 
--   USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- SCHEMA COMPLETE! ✅
-- ============================================================================
-- 
-- How Authentication Works:
-- 
-- 1. User signs up via Supabase Auth (email/password, Google, etc.)
--    → Creates row in auth.users
--    → Trigger automatically creates row in users table with default profile
-- 
-- 2. User logs in
--    → Supabase Auth returns JWT token with user ID
--    → All queries automatically filtered by auth.uid()
-- 
-- 3. User generates meal plan
--    → Your app: const { data } = await supabase.from('sessions').insert(...)
--    → RLS ensures user_id matches auth.uid()
--    → User can only see/modify their own data
-- 
-- 4. User logs out
--    → JWT expires
--    → No access to data until logged back in
-- 
-- ============================================================================
