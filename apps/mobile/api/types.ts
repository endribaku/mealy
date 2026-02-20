export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

export type GenerationOptions = {
  provider?: 'openai' | 'anthropic'
  temperature?: number
  maxTokens?: number
}
