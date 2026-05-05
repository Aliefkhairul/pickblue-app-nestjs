/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Response } from 'express'

type ExceptionErrorObjectResponse = {
    message: string
    error: any
    statusCode: number
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        const status = exception.getStatus()
        const errorObject = exception.getResponse() as ExceptionErrorObjectResponse

        response.status(status).json({
            ok: false,
            status_code: status,
            message: errorObject.message,
            errors: typeof errorObject.error !== 'object' ? [] : errorObject.error
        })
    }
}
