export interface RateLimiterStrategy {
	consume(key: string): boolean
}
