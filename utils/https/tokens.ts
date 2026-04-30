import { ConfigService } from '@nestjs/config'
import { createHash, randomBytes } from 'crypto'
import { Response } from 'express'
import { dateUtils } from 'utils/times'

export function generateSessionToken(): string {
    return randomBytes(32).toString('hex')
}

export function generateCsrfToken(): string {
    return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

export function setSessionCookie(res: Response, token: string, configService: ConfigService): void {
    const isProd = configService.get<string>('APP_ENV') === 'production'

    res.cookie('session_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: dateUtils.addSevenDaysUseNumber(),
        path: '/'
    })
}

export function setCsrfCookie(res: Response, token: string, configService: ConfigService): void {
    const isProd = configService.get<string>('APP_ENV') === 'production'

    res.cookie('csrf_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: dateUtils.addSevenDaysUseNumber(),
        path: '/'
    })
}

export function clearSessionCookie(res: Response): void {
    res.clearCookie('session_token', { path: '/' })
}

export function clearCsrfCookie(res: Response): void {
    res.clearCookie('csrf_token', { path: '/' })
}
