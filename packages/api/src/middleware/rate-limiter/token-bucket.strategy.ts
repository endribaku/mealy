import { RateLimiterStrategy } from "./rate-limiter.strategy"

interface Bucket {
	tokens: number
	lastRefill: number
}

export class TokenBucketStrategy implements RateLimiterStrategy {

	private buckets = new Map<string, Bucket>()

	constructor(
		private capacity: number,
		private refillRate: number // tokens per second
	) {}

	consume(key: string): boolean {

		const now = Date.now()
		const bucket = this.buckets.get(key) ?? {
			tokens: this.capacity,
			lastRefill: now
		}

		// Calculate elapsed time
		const elapsedSeconds =
			(now - bucket.lastRefill) / 1000

		// Refill tokens
		const refillAmount =
			elapsedSeconds * this.refillRate

		bucket.tokens = Math.min(
			this.capacity,
			bucket.tokens + refillAmount
		)

		bucket.lastRefill = now

		// Check if request allowed
		if (bucket.tokens < 1) {
			this.buckets.set(key, bucket)
			return false
		}

		// Consume one token
		bucket.tokens -= 1

		this.buckets.set(key, bucket)

		return true
	}
}
