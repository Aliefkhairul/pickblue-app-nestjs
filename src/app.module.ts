import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthenticationModule } from './authentication/authentication.module'
import { DatabaseModule } from './database/database.module'
import { MailsModule } from './mails/mails.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentsModule } from './payments/payments.module'
import { ProductsModule } from './products/products.module'
import { UploadersModule } from './uploaders/uploaders.module'
import { UsersModule } from './users/users.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        DatabaseModule,
        AuthenticationModule,
        MailsModule,
        ProductsModule,
        UsersModule,
        UploadersModule,
        OrdersModule,
        PaymentsModule
    ],
    controllers: [],
    providers: []
})
export class AppModule {}
