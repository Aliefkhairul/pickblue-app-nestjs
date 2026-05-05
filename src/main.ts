import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { HttpExceptionFilter } from 'utils/https/exceptions'
import { HttpResponseInterceptor } from 'utils/https/interceptors'
import { HttpCustomValidationPipe } from 'utils/https/pipes'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['debug', 'error', 'log', 'warn']
    })

    app.use(cookieParser())

    app.useGlobalFilters(new HttpExceptionFilter())
    app.useGlobalInterceptors(new HttpResponseInterceptor())
    app.useGlobalPipes(new HttpCustomValidationPipe())

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
