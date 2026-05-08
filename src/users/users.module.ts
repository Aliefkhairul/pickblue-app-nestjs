import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { AuthenticationService } from 'src/authentication/authentication.service'
import { UploadersService } from 'src/uploaders/uploaders.service'

@Module({
    controllers: [UsersController],
    providers: [UsersService, AuthenticationService, UploadersService]
})
export class UsersModule {}
