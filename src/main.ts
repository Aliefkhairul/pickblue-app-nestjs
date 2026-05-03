import { NestFactory } from '@nestjs/core'
import { HttpExceptionFilter } from 'utils/https/http.exceptions'
import { AppModule } from './app.module'
import { HttpResponseInterceptor } from 'utils/https/http.interceptors'
import cookieParser from 'cookie-parser'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['debug', 'error', 'log', 'warn']
    })
    app.use(cookieParser())
    app.useGlobalInterceptors(new HttpResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
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
