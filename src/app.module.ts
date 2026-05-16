import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthenticationModule } from './authentication/authentication.module'
import { CreatorsModule } from './creators/creators.module'
import { DatabaseModule } from './database/database.module'
import { MailsModule } from './mails/mails.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentsModule } from './payments/payments.module'
import { ProductsModule } from './products/products.module'
import { TasksModule } from './tasks/tasks.module'
import { UploadersModule } from './uploaders/uploaders.module'
import { UsersModule } from './users/users.module'
import { BullModule } from '@nestjs/bullmq'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        ScheduleModule.forRoot(),
        BullModule.forRoot({
            connection: {
                host: 'localhost',
                port: 6379
            }
        }),
        BullModule.registerQueue({
            name: 'mails'
        }),
        DatabaseModule,
        AuthenticationModule,
        MailsModule,
        ProductsModule,
        UsersModule,
        UploadersModule,
        OrdersModule,
        PaymentsModule,
        CreatorsModule,
        TasksModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
