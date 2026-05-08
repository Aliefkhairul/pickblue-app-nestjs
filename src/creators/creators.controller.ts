import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard, Role, Roles } from 'utils/https/guards'
import { CreatorsService } from './creators.service'

@Controller('creators')
export class CreatorsController {
    constructor(private readonly creatorsService: CreatorsService) {}

    @Get('dashboard-summary-products')
    @UseGuards(AuthGuard)
    @Roles(Role.Seller)
    @HttpCode(HttpStatus.OK)
    async getDashboardSummaryProduct(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getDashboardSummaryProduct(creator)
        return { message: 'Get Dashborad Summary Product Successful', data }
    }

    @Get('dashboard-seller-balances')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getDashboardSellerBalances(@Req() req: Request) {
        const creator = req.withUser
        const data = await this.creatorsService.getSellerBalances(creator)
        return { message: 'Get Dashborad Seller Balances Successful', data }
    }
}
