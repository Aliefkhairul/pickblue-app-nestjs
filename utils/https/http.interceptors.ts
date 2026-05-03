/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        return next.handle().pipe(
            map(data => {
                let statusCode = response.statusCode
                if (data?.status_code) {
                    statusCode = data.status_code
                }

                return {
                    status_code: statusCode,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    message: data?.message ?? 'success',
                    data: data?.data ?? data
                }
            })
        )
    }
}
