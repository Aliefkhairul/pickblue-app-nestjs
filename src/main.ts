/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { HttpExceptionFilter } from 'utils/https/exceptions'
import { HttpResponseInterceptor } from 'utils/https/interceptors'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['debug', 'error', 'log', 'warn']
    })

    app.use(cookieParser())
    app.useGlobalFilters(new HttpExceptionFilter())
    app.useGlobalInterceptors(new HttpResponseInterceptor())

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors: ValidationError[]) => {
                const errorMap = new Map()

                function recursiveErrorTracerFn(errors: ValidationError[], parentPath = '') {
                    errors.forEach(error => {
                        const path = parentPath ? `${parentPath}.${error.property}` : error.property

                        if (error.constraints) {
                            errorMap.set(path, Object.values(error.constraints))
                        }

                        if (error.children && error.children.length > 0) {
                            recursiveErrorTracerFn(error.children, path)
                        }
                    })
                }

                recursiveErrorTracerFn(errors)

                return new BadRequestException({
                    message: 'validation_error',
                    error: Object.fromEntries(errorMap),
                    statusCode: 400
                })
            }
        })
    )

    app.enableCors({
        origin: ['http://localhost:3000', 'https://pickblue-frontend-nextjs.vercel.app', 'https://garden-flavorful-cattishly.ngrok-free.dev'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-CSRF-Token'],
        credentials: true,
        maxAge: 300
    })

    await app.listen(process.env.PORT ?? 3001)
}
void bootstrap()
