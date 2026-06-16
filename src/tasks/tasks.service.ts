import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AuthenticationService } from 'src/authentication/authentication.service'
import { CreatorsService } from 'src/creators/creators.service'

@Injectable()
export class TasksService {
    constructor(
        private readonly creatorService: CreatorsService,
        private readonly authenticationService: AuthenticationService
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handleReleaseCreatorEarningsToBalance() {
        await this.creatorService.releaseCreatorEarningsToBalance()
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleClearSession() {
        await this.authenticationService.clearSession()
    }
}
