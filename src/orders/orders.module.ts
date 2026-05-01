import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { AuthenticationService } from 'src/authentication/authentication.service'

@Module({
    controllers: [OrdersController],
    providers: [OrdersService, AuthenticationService]
})
export class OrdersModule {}
