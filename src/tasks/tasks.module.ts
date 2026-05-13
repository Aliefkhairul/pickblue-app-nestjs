import { Module } from '@nestjs/common'
import { CreatorsService } from 'src/creators/creators.service'
import { TasksService } from './tasks.service'
import { AuthenticationService } from 'src/authentication/authentication.service'

@Module({
    providers: [TasksService, CreatorsService, AuthenticationService]
})
export class TasksModule {}
