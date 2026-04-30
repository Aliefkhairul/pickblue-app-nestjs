import { NestFactory } from '@nestjs/core'
import { HttpExceptionFilter } from 'utils/https/http_exceptions'
import { AppModule } from './app.module'
import { HttpResponseInterceptor } from 'utils/https/http_interceptors'
import cookieParser from 'cookie-parser'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['debug', 'error', 'log', 'warn']
    })
    app.use(cookieParser())
    app.useGlobalInterceptors(new HttpResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
