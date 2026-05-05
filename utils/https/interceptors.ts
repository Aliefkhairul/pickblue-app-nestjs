/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp()
        const response = ctx.getResponse<Response>()

        return next.handle().pipe(
            map(data => {
                const createMessage = data?.message ? data.message : 'Success'
                const createData = data?.data ? data.data : data
                const createMeta = data.meta ? data.meta : {}

                return {
                    ok: true,
                    status_code: response.statusCode,
                    message: createMessage,
                    data: createData,
                    meta: createMeta
                }
            })
        )
    }
}
