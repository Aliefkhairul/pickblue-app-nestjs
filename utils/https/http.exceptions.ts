import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

type ValidationErrorPayload = {
    field: string
    constraints: Record<string, string>
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()

        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const status = exception.getStatus()
        const exceptionPayload = exception.getResponse()

        let valdiationExceptionsPayload: null | ValidationErrorPayload[] = null
        if (exceptionPayload instanceof Object) {
            valdiationExceptionsPayload = exceptionPayload['validationExceptions'] as ValidationErrorPayload[]
        }

        response.status(status).json({
            status_code: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exception.message,
            data: valdiationExceptionsPayload
        })
    }
}
