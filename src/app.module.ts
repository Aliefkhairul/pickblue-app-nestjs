import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { ConfigModule } from '@nestjs/config'
import { AuthenticationModule } from './authentication/authentication.module'
import { MailsModule } from './mails/mails.module'
import { ProductsModule } from './products/products.module'

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthenticationModule, MailsModule, ProductsModule],
    controllers: [],
    providers: []
})
export class AppModule {}
