import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { AuthenticationService } from 'src/authentication/authentication.service'

@Module({
    controllers: [ProductsController],
    providers: [ProductsService, AuthenticationService]
})
export class ProductsModule {}
