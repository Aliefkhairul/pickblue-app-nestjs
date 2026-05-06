import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'
import { Response } from 'express'
import { dateUtils } from 'utils/times'

function generateSessionToken(): string {
    return randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

function setSessionCookie(res: Response, token: string, configService: ConfigService): void {
    const isProd = configService.get<string>('APP_ENV') === 'production'

    res.cookie('session_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: dateUtils.addSevenDaysUseNumber(),
        path: '/'
    })
}

function clearSessionCookie(res: Response): void {
    res.clearCookie('session_token', { path: '/' })
}

async function hashPasswordFn(password: string): Promise<string> {
    const saltOrRounds = 10
    const hash = await bcrypt.hash(password, saltOrRounds)
    return hash
}

async function comparePasswordFn(password: string, hashedPassword: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hashedPassword)
    return isMatch
}

export { clearSessionCookie, comparePasswordFn, generateSessionToken, hashPasswordFn, hashToken, setSessionCookie }
