import { AuthenticatedUserPayload } from 'utils/https/auth_guard'

declare module 'express' {
    // Inject additional properties on express.Request
    interface Request {
        withUser: AuthenticatedUserPayload
    }
}
