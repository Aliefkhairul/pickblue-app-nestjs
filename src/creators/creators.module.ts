import { Module } from '@nestjs/common'
import { AuthenticationService } from 'src/authentication/authentication.service'
import { CreatorsController } from './creators.controller'
import { CreatorsService } from './creators.service'

@Module({
    controllers: [CreatorsController],
    providers: [CreatorsService, AuthenticationService]
})
export class CreatorsModule {}
