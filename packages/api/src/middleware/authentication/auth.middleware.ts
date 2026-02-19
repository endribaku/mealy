import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedUser } from '../../types/authenticated-request'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { URL } from 'node:url'

const supabaseUrl = process.env.SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL not defined')
}

// Official Supabase JWKS endpoint (documented)
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
)

/**
 * Supabase JWT Authentication Middleware
 *
 * - Verifies JWT using Supabase JWKS
 * - Ensures signature is valid
 * - Ensures token is not expired
 * - Ensures issuer is correct
 * - Attaches verified user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.slice(7)

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
    })

    if (!payload.sub) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token payload'
        })
    }

    const user: AuthenticatedUser = {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined
    }

    // Attach user safely without global augmentation
    ;(req as Request & { user: AuthenticatedUser }).user = user

    next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}
