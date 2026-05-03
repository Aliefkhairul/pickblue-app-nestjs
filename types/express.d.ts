import { AuthenticatedUserPayload } from 'utils/https/http.auth.guard'

declare module 'express' {
    // Inject additional properties on express.Request
    interface Request {
        withUser: AuthenticatedUserPayload
    }
}
