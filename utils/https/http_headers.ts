import { Request } from 'express'

export function getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']

    if (forwarded) {
        // x-forwarded-for bisa berisi multiple IP: "client, proxy1, proxy2"
        return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
    }

    return req.socket.remoteAddress ?? 'unknown'
}

export function getUserAgent(req: Request): string {
    return req.headers['user-agent'] ?? 'unknown'
}
