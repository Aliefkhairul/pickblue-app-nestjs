import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { AuthenticationService } from 'src/authentication/authentication.service'
import { UploadersService } from 'src/uploaders/uploaders.service'

@Module({
    controllers: [ProductsController],
    providers: [ProductsService, AuthenticationService, UploadersService]
})
export class ProductsModule {}
