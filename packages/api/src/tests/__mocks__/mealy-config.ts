export const config = {
  api: {
    port: 3000,
    environment: 'test' as const,
    corsOrigin: 'http://localhost:5173',
  },
  database: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceRoleKey: 'test-service-role-key',
  },
  ai: {
    openai: {
      apiKey: 'test-openai-key',
      model: 'gpt-4o',
    },
    anthropic: {
      apiKey: 'test-anthropic-key',
      model: 'claude-sonnet-4-20250514',
    },
    temperature: 0.7,
    maxTokens: 16000,
  },
  engine: {
    limits: {
      maxFullRegenerations: 3,
      maxMealModifications: 20,
      sessionTimeoutMinutes: 30,
    },
  },
} as const
