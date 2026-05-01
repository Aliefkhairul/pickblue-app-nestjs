import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { AuthenticationService } from 'src/authentication/authentication.service'

@Module({
    controllers: [UsersController],
    providers: [UsersService, AuthenticationService]
})
export class UsersModule {}
