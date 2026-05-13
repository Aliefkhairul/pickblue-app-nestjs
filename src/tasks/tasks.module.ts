import { Module } from '@nestjs/common'
import { CreatorsService } from 'src/creators/creators.service'
import { TasksService } from './tasks.service'

@Module({
    providers: [TasksService, CreatorsService]
})
export class TasksModule {}
