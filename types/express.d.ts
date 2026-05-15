import { AuthenticatedUserPayload } from 'utils/https/guards'

declare module 'express' {
    // Inject additional properties on express.Request
    interface Request {
        withUser: AuthenticatedUserPayload | undefined
    }
}
