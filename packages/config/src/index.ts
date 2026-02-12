import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

// Resolve root .env manually (monorepo safe)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// config package lives at:
// packages/config/dist/index.js (after build)
// so root is 3 levels up from dist
dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
})


/**
 * Environment Schema Validation
 */
const EnvSchema = z.object({
  // ==========================================================
  // API
  // ==========================================================
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ==========================================================
  // Supabase
  // ==========================================================
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // ==========================================================
  // OpenAI
  // ==========================================================
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // ==========================================================
  // Anthropic
  // ==========================================================
  ANTHROPIC_API_KEY: z.string(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  // ==========================================================
  // Engine Limits
  // ==========================================================
  MAX_FULL_PLAN_REGENERATIONS: z.coerce.number().default(3),
  MAX_INDIVIDUAL_MEAL_MODIFICATIONS: z.coerce.number().default(20),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().default(30),

  // ==========================================================
  // AI Settings
  // ==========================================================
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AI_MAX_TOKENS: z.coerce.number().default(16000),
})

const env = EnvSchema.parse(process.env)

/**
 * Structured Config Object
 */
export const config = {
  api: {
    port: env.PORT,
    environment: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  },

  database: {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },

  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    },
    temperature: env.AI_TEMPERATURE,
    maxTokens: env.AI_MAX_TOKENS,
  },

  engine: {
    limits: {
      maxFullRegenerations: env.MAX_FULL_PLAN_REGENERATIONS,
      maxMealModifications: env.MAX_INDIVIDUAL_MEAL_MODIFICATIONS,
      sessionTimeoutMinutes: env.SESSION_TIMEOUT_MINUTES,
    },
  },
} as const

export type AppConfig = typeof config
