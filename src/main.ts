import { NestFactory } from '@nestjs/core'
import { HttpExceptionFilter } from 'utils/http_exceptions'
import { AppModule } from './app.module'
import { HttpResponseInterceptor } from 'utils/http_interceptors'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    app.useGlobalInterceptors(new HttpResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
