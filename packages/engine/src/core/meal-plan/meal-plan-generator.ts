import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { config } from '@mealy/config'
import { FullContext } from '../context-builder.js'
import {
  PromptBuilder,
  PromptConfig
} from './prompt-builder.js'
import { MealPlanSchema, MealPlan } from '../schemas/schemas.js'
import {
  sanitizeSpecialInstructions,
  sanitizeReason
} from '../../utils/input-sanitizer.js'
import { IMealPlanGenerator } from '../interfaces/meal-plan-generator.interface.js'

export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai'
}

export interface EngineUsage {
	totalTokens: number
}


export interface GenerationOptions {
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  promptConfig?: PromptConfig
  specialInstructions?: string
}

export interface GenerationResult {
  mealPlan: MealPlan
  tokensUsed: EngineUsage
  provider: AIProvider
  generationTime: number
}

/**
 * PURE ENGINE ORCHESTRATOR
 * No database access.
 */
export class MealPlanGenerator implements IMealPlanGenerator {
    private promptBuilder: PromptBuilder

    constructor() {
      this.promptBuilder = new PromptBuilder()
    }

    async generateMealPlan(
      context: FullContext,
      options: GenerationOptions = {}
    ): Promise<GenerationResult> {

      const startTime = Date.now()

      const sanitizedInstructions = sanitizeSpecialInstructions(
        options.specialInstructions
      )

      const prompt = this.promptBuilder.buildPrompt(
        context,
        options.promptConfig,
        sanitizedInstructions
      )

      const result = await this.callAI(prompt, options)
      const mealPlan = this.validateAndParse(result)

      return {
        mealPlan,
        tokensUsed: this.normalizeUsage(result.usage),
        provider: options.provider ?? AIProvider.OPENAI,
        generationTime: Date.now() - startTime
      }

    }

    /**
     * Regenerate a specific meal
     * (Original prompt preserved exactly)
     */
    async regenerateSingleMeal(
      context: FullContext,
      mealId: string,
      rejectionReason: string,
      options: GenerationOptions = {}
    ): Promise<GenerationResult> {

      const startTime = Date.now()

      const sanitizedReason = sanitizeReason(rejectionReason)

      const currentPlanInfo = context.session?.currentMealPlan
        ? `\n\nCURRENT MEAL PLAN CONTEXT:\nThe user's current meal plan has these other meals (keep these unchanged):\n${JSON.stringify(context.session.currentMealPlan, null, 2)}`
        : ''

      console.log(currentPlanInfo)
        
      const specialInstructions = `
  You are regenerating ONLY the meal: ${mealId}

  The user rejected it because: "${sanitizedReason}"

  IMPORTANT:
  - The replacement meal MUST be clearly different from the original meal.
  - Do NOT reuse the same recipe.
  - Do NOT reuse the same meal name.

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

      console.log(options.temperature)

      const result = await this.callAI(prompt, options)
      const mealPlan = this.validateAndParse(result)

      // 🔒 Enforce structural change
      const originalPlan = context.session?.currentMealPlan

      if (originalPlan) {
        const beforeMeal = this.findMeal(originalPlan, mealId)
        const afterMeal = this.findMeal(mealPlan, mealId)

        if (beforeMeal && afterMeal && this.mealsAreIdentical(beforeMeal, afterMeal)) {

          console.warn('⚠ Regenerated meal identical — retrying with higher temperature')

          // Retry once with higher temperature
          const retryResult = await this.callAI(prompt, {
            ...options,
            temperature: 0.9
          })

          const retryPlan = this.validateAndParse(retryResult)

          const retryMeal = this.findMeal(retryPlan, mealId)

          if (retryMeal && !this.mealsAreIdentical(beforeMeal, retryMeal)) {
            return {
              mealPlan: retryPlan,
              tokensUsed: this.normalizeUsage(retryResult.usage),
              provider: options.provider ?? AIProvider.OPENAI,
              generationTime: Date.now() - startTime
            }
          }

          throw new Error('Regeneration failed to produce a different meal after retry')
        }
      }


      return {
        mealPlan,
        tokensUsed: this.normalizeUsage(result.usage),
        provider: options.provider ?? AIProvider.OPENAI,
        generationTime: Date.now() - startTime
      }
    }

    /**
     * Regenerate the entire meal plan
     * (Original prompt preserved exactly)
     */
    async regenerateFullPlan(
      context: FullContext,
      regenerationReason: string,
      options: GenerationOptions = {}
    ): Promise<GenerationResult> {

      const startTime = Date.now()

      const sanitizedReason = sanitizeReason(regenerationReason)

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

      return {
        mealPlan,
        tokensUsed: this.normalizeUsage(result.usage),
        provider: options.provider ?? AIProvider.OPENAI,
        generationTime: Date.now() - startTime
      }
    }

    // ------------------------------------------------------------------------

    private async callAI(
      prompt: { systemMessage: string; userMessage: string },
      options: GenerationOptions
    ) {
      const provider = options.provider ?? AIProvider.OPENAI
      const temperature = options.temperature ?? config.ai.temperature
      const maxTokens = options.maxTokens ?? config.ai.maxTokens

      console.log(temperature)
      const model =
        provider === AIProvider.ANTHROPIC
          ? anthropic(config.ai.anthropic.model)
          : openai(config.ai.openai.model)

      return generateText({
        model,
        messages: [
          { role: 'system', content: prompt.systemMessage },
          { role: 'user', content: prompt.userMessage }
        ],
        temperature,
        maxOutputTokens: maxTokens,
        output: Output.object({
          schema: MealPlanSchema
        })
      })
    }

    private validateAndParse(result: any): MealPlan {
      const parsed = MealPlanSchema.safeParse(result.output)

      if (!parsed.success) {
        const errorDetails = parsed.error.issues
          .map(issue => {
            const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
            return `${path}: ${issue.message}`
          })
          .join('; ')

        throw new Error(`Invalid meal plan generated: ${errorDetails}`)
      }

      return parsed.data
    }


    private mealsAreIdentical(a: any, b: any): boolean {
      return JSON.stringify(a) === JSON.stringify(b)
    }

    private findMeal(plan: MealPlan, mealId: string) {
      for (let i = 0; i < plan.days.length; i++) {
        const day = plan.days[i]
        for (const type of ['breakfast', 'lunch', 'dinner'] as const) {
          const identifier = `${type}-day${i + 1}`
          if (identifier === mealId) {
            return day.meals[type]
          }
        }
      }
      return null
    }
    

    private normalizeUsage(usage: any): EngineUsage {
      return {
        totalTokens: usage?.totalTokens ?? 0
      }
    }


}



