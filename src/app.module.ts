import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { ConfigModule } from '@nestjs/config'
import { AuthenticationModule } from './authentication/authentication.module'
import { MailsModule } from './mails/mails.module'
import { ProductsModule } from './products/products.module'
import { UsersModule } from './users/users.module'
import { UploadersModule } from './uploaders/uploaders.module'
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

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
