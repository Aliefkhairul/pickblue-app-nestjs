import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard, Role, Roles, RolesGuard } from 'utils/https/guards'
import { CreatorsService } from './creators.service'

@Controller('creators')
export class CreatorsController {
    constructor(private readonly creatorsService: CreatorsService) {}

    @Get('dashboard-summary-products')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardSummaryProduct(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getDashboardSummaryProduct(creator)
        return { message: 'Get Dashborad Summary Product Successful', data }
    }

    @Get('dashboard-creator-balances')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardCreatorBalances(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getCreatorBalances(creator)
        return { message: 'Get Dashborad Creator Balances Successful', data }
    }

    @Get('dashboard-withdrawal-creator-balances')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardWithdrawalCreatorBalances(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getWithdrawalCreatorBalances(creator)
        return { message: 'Get Dashborad Creator Balances Successful', data }
    }

    @Get('dashboard-withdrawal-history')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardWithdrawalHistory(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getWithdrawalHistory(creator)
        return { message: 'Get Dashborad Creator Balances Successful', data }
    }
}
