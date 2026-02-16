import { z } from 'zod'

// ============================================================
// OPTIONAL FUTURE: ADD CONSTRAINT
// ============================================================

export const AddConstraintBodySchema = z.object({
	constraint: z.string().min(1)
}).strict()
