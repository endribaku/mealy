/**
 * Input Sanitization Utilities
 *
 * Simple sanitization for user inputs to prevent:
 * - Prompt injection attempts
 * - Excessive length
 * - Control characters
 */

/**
 * Sanitize user text input
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized input
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Trim whitespace
  let sanitized = input.trim()

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // Basic prompt injection prevention - remove common injection patterns
  // Note: This is basic MVP protection, not comprehensive
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?previous\s+instructions/gi,
    /forget\s+(all\s+)?previous\s+instructions/gi,
    /you\s+are\s+now/gi,
    /new\s+instructions:/gi,
    /system\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ]

  for (const pattern of suspiciousPatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  }

  return sanitized
}

/**
 * Sanitize constraint text (for temporary constraints)
 *
 * @param constraint - Raw constraint text
 * @returns Sanitized constraint
 */
export function sanitizeConstraint(constraint: string): string {
  return sanitizeText(constraint, 500) // Shorter max length for constraints
}

/**
 * Sanitize rejection reason
 *
 * @param reason - Raw rejection reason
 * @returns Sanitized reason
 */
export function sanitizeReason(reason: string): string {
  return sanitizeText(reason, 300) // Even shorter for reasons
}

/**
 * Validate and sanitize special instructions
 *
 * @param instructions - Raw special instructions
 * @returns Sanitized instructions with safety notice
 */
export function sanitizeSpecialInstructions(instructions: string | undefined): string | undefined {
  if (!instructions) {
    return undefined
  }

  const sanitized = sanitizeText(instructions, 2000)

  if (!sanitized) {
    return undefined
  }

  // Wrap in clear markers to prevent confusion with system instructions
  return `USER PROVIDED SPECIAL INSTRUCTIONS:\n${sanitized}\n[END OF USER INSTRUCTIONS]`
}
