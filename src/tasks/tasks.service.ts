import { Injectable } from '@nestjs/common'
import { CreatorsService } from 'src/creators/creators.service'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class TasksService {
    constructor(private readonly creatorService: CreatorsService) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async handleReleaseCreatorEarningsToBalance() {
        await this.creatorService.releaseCreatorEarningsToBalance()
    }
}
