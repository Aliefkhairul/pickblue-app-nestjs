import { createHash, randomBytes } from 'crypto'

export function generateRandomCode(): string {
    return randomBytes(8).toString('hex')
    // → "a3f2c1d4e5b6a7f8c9d0e1f2a3b4c5d6"
}

// Email Verification Token (hex, 32 chars)
export function generateEmailVerificationToken(): string {
    return randomBytes(16).toString('hex')
    // → "a3f2c1d4e5b6a7f8c9d0e1f2a3b4c5d6"
}

// Order ID (readable, with timestamp)
export function generateOrderId(): string {
    const date = new Date()
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '') // "20260430"
    const randomPart = randomBytes(3).toString('hex').toUpperCase() // "A3F2C1"
    return `ORD-${datePart}-${randomPart}`
    // → "ORD-20260430-A3F2C1"
}

// Generate token & hashnya sekaligus
export function generateVerificationToken(): { token: string; hashedToken: string } {
    const token = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(token).digest('hex')
    return { token, hashedToken }
}

// Hash token yang datang dari URL untuk di-compare
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}
