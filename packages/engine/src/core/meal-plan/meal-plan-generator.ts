import { generateText, LanguageModelUsage, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { config } from '@mealy/config'
import { IDataAccess } from '../data-access.js'
import { ContextBuilder } from '../context-builder.js'
import {
  PromptBuilder,
  PromptConfig
} from './prompt-builder.js'
import { MealPlanSchema, MealPlan } from '../schemas/schemas.js'
import { sanitizeSpecialInstructions, sanitizeReason } from '../../utils/input-sanitizer.js'

/**
 * AI Provider enum
 */
export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai'
}

/**
 * Generation options
 */
export interface GenerationOptions {
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  promptConfig?: PromptConfig
  specialInstructions?: string
}

/**
 * Generation result
 */
export interface GenerationResult {
  mealPlan: MealPlan
  tokensUsed: LanguageModelUsage
  provider: AIProvider
  generationTime: number
}

/**
 * Meal Plan Generator 
 * 
 * This generator receives IDataAccess through constructor injection.
 * 
 */
export class MealPlanGenerator {
  private contextBuilder: ContextBuilder
  private promptBuilder: PromptBuilder
  
  constructor(dataAccess: IDataAccess) {  // ✅ DI: Require IDataAccess
    this.contextBuilder = new ContextBuilder(dataAccess)
    this.promptBuilder = new PromptBuilder()
  }
  
  async generateMealPlan(
    userId: string,
    sessionId?: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now()

    // Step 1: Build context
    const context = await this.contextBuilder.buildFullContext(userId, sessionId)

    console.log(`📊 Context built: ${context.estimatedTokens} estimated tokens`)

    // Step 2: Build prompt
    const sanitizedInstructions = sanitizeSpecialInstructions(
      options.specialInstructions
    )

    const prompt = this.promptBuilder.buildPrompt(
      context,
      options.promptConfig,
      sanitizedInstructions
    )

    // Step 3: Call AI
    const result = await this.callAI(prompt, options)

    // Step 4: Parse and validate response
    const mealPlan = this.validateAndParse(result)

    const endTime = Date.now()
    const generationTime = endTime - startTime

    console.log(`✅ Meal plan generated in ${generationTime}ms`)

    return {
      mealPlan,
      tokensUsed: result.usage ?? { totalTokens: 0 },
      provider: options.provider || AIProvider.OPENAI,
      generationTime
    }
  }

  
  /**
   * Regenerate a specific meal
   */
  async regenerateSingleMeal(
    userId: string,
    sessionId: string,
    mealId: string,
    rejectionReason: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now()

    const sanitizedReason = sanitizeReason(rejectionReason)

    const context = await this.contextBuilder.buildFullContext(userId, sessionId)

    console.log(`🔄 Regenerating meal: ${mealId}`)
    console.log(`   Reason: ${sanitizedReason}`)

    const currentPlanInfo = context.session?.currentMealPlan
      ? `\n\nCURRENT MEAL PLAN CONTEXT:\nThe user's current meal plan has these other meals (keep these unchanged):\n${JSON.stringify(context.session.currentMealPlan, null, 2)}`
      : ''

    const specialInstructions = `
You are regenerating ONLY the meal: ${mealId}

The user rejected it because: "${sanitizedReason}"

Generate a replacement meal that addresses this feedback while maintaining:
- The same meal type (breakfast/lunch/dinner)
- Complementary nutrition for the day
- Variety from other meals in the plan

Output the FULL meal plan JSON with the new meal replacing the old one.
Keep all other meals exactly the same.${currentPlanInfo}
`
    
    const prompt = this.promptBuilder.buildPrompt(
      context,
      options.promptConfig,
      specialInstructions
    )
    
    const result = await this.callAI(prompt, options)
    const mealPlan = this.validateAndParse(result)
    
    const endTime = Date.now()
    const generationTime = endTime - startTime
    
    console.log(`✅ Meal regenerated in ${generationTime}ms`)
    
    return {
      mealPlan,
      tokensUsed: result.usage,
      provider: options.provider || AIProvider.OPENAI,
      generationTime
    }
  }
  
  /**
   * Regenerate the entire meal plan
   */
  async regenerateFullPlan(
    userId: string,
    sessionId: string,
    regenerationReason: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now()


    const sanitizedReason = sanitizeReason(regenerationReason)

    const context = await this.contextBuilder.buildFullContext(userId, sessionId)

    console.log(`🔄 Regenerating full plan`)
    console.log(`   Reason: ${sanitizedReason}`)

    const specialInstructions = `
    The user rejected the entire plan because: "${sanitizedReason}"

    Generate a completely NEW meal plan that addresses this feedback.
    Make significant changes to ensure the new plan feels fresh and different.
    ` 
    
    const prompt = this.promptBuilder.buildPrompt(
      context,
      options.promptConfig,
      specialInstructions
    )
    
    const result = await this.callAI(prompt, options)
    const mealPlan = this.validateAndParse(result)
    
    const endTime = Date.now()
    const generationTime = endTime - startTime
    
    console.log(`✅ Full plan regenerated in ${generationTime}ms`)
    
    return {
      mealPlan,
      tokensUsed: result.usage,
      provider: options.provider || AIProvider.OPENAI,
      generationTime
    }
  }
  
  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================
  
  private async callAI(
    prompt: { systemMessage: string; userMessage: string },
    options: GenerationOptions
  ) {
    const provider = options.provider || AIProvider.OPENAI
    const temperature = options.temperature ?? config.ai.temperature
    const maxTokens = options.maxTokens ?? config.ai.maxTokens

    const model = provider === AIProvider.ANTHROPIC
      ? anthropic(config.ai.anthropic.model)
      : openai(config.ai.openai.model)

    console.log(`🤖 Using ${provider} model: ${provider === AIProvider.ANTHROPIC ? config.ai.anthropic.model : config.ai.openai.model}`)
    console.log(`   Temperature: ${temperature}`)
    console.log(`   Max tokens: ${maxTokens}`)


    const timeoutMs = 120000 // 2 minutes timeout for AI calls
    const aiCallPromise = generateText({
      model,
      messages: [
        {
          role: 'system',
          content: prompt.systemMessage
        },
        {
          role: 'user',
          content: prompt.userMessage
        }
      ],
      temperature,
      maxOutputTokens: maxTokens,
      output: Output.object({
        schema: MealPlanSchema,
      }),
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI call timed out after ${timeoutMs}ms`)), timeoutMs)
    })

    const result = await Promise.race([aiCallPromise, timeoutPromise])

    return result
  }
  
  private validateAndParse(result: any): MealPlan {
    const parsed = MealPlanSchema.safeParse(result.output)

    if (!parsed.success) {
      console.error('❌ AI returned invalid meal plan structure')
      console.error('Validation errors:', JSON.stringify(parsed.error.issues, null, 2))

      // Format error message with all validation issues
      const errorDetails = parsed.error.issues
        .map(issue => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
          return `${path}: ${issue.message}`
        })
        .join('; ')

      throw new Error(`Invalid meal plan generated: ${errorDetails}`)
    }

    const mealPlan = parsed.data
    console.log(`✅ Meal plan validated: ${mealPlan.days.length} days`)
    return mealPlan
  }
}

/**
 * ============================================================================
 * CONVENIENCE FUNCTIONS - NOW WITH DI
 * ============================================================================
 */

/**
 * Quick function to generate a meal plan
 */
export async function quickGenerate(
  dataAccess: IDataAccess,  
  userId: string,
  sessionId?: string,
  provider: AIProvider = AIProvider.OPENAI
): Promise<MealPlan> {
  const generator = new MealPlanGenerator(dataAccess)
  const result = await generator.generateMealPlan(userId, sessionId, { provider })
  return result.mealPlan
}

/**
 * Generate with detailed logging
 */
export async function generateWithLogging(
  dataAccess: IDataAccess,  
  userId: string,
  sessionId?: string,
  provider: AIProvider = AIProvider.OPENAI
): Promise<GenerationResult> {
  console.log('🚀 Starting meal plan generation...')
  console.log(`   User: ${userId}`)
  console.log(`   Session: ${sessionId || 'First generation'}`)
  console.log(`   Provider: ${provider}`)
  
  const generator = new MealPlanGenerator(dataAccess)
  const result = await generator.generateMealPlan(userId, sessionId, { provider })
  
  console.log('\n📊 Generation complete!')
  console.log(`   Tokens used: ${result.tokensUsed.totalTokens}`)
  console.log(`   Generation time: ${result.generationTime}ms`)
  console.log(`   Days generated: ${result.mealPlan.days.length}`)
  console.log(`   Avg daily calories: ${result.mealPlan.nutritionSummary.avgDailyCalories}`)
  
  return result
}

/**
 * Compare generations across providers
 */
export async function compareProviders(
  dataAccess: IDataAccess,  
  userId: string,
  sessionId?: string
): Promise<{ anthropic: GenerationResult; openai: GenerationResult }> {
  const generator = new MealPlanGenerator(dataAccess)
  
  console.log('🔬 Comparing providers...\n')
  
  console.log('1️⃣ Generating with Anthropic...')
  const anthropicResult = await generator.generateMealPlan(userId, sessionId, {
    provider: AIProvider.ANTHROPIC
  })
  
  console.log('\n2️⃣ Generating with OpenAI...')
  const openaiResult = await generator.generateMealPlan(userId, sessionId, {
    provider: AIProvider.OPENAI
  })
  
  console.log('\n📊 Comparison Results:')
  console.log(`   Anthropic: ${anthropicResult.tokensUsed.totalTokens} tokens, ${anthropicResult.generationTime}ms`)
  console.log(`   OpenAI: ${openaiResult.tokensUsed.totalTokens} tokens, ${openaiResult.generationTime}ms`)
  
  return {
    anthropic: anthropicResult,
    openai: openaiResult
  }
}