import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard, Role, Roles, RolesGuard } from 'utils/https/guards'
import { CreatorsService } from './creators.service'
import { CreateUserWalletsRequest, CreateUserWithdrawnRequest } from './dto/creators.dto'

type ReqBodyPaymentIrisNotificationWebHook = {
    reference_no: string
    amount: number
    status: string
    updated_at: string
}

@Controller('creators')
export class CreatorsController {
    constructor(private readonly creatorsService: CreatorsService) {}

    @Get('dashboard-summary-products')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardSummaryProduct(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.getDashboardSummaryProduct(creator)
        return {
            message: 'Get Dashborad Summary Product Successful',
            data: data.map(d => ({
                product_id: d.productId,
                product_name: d.productName,
                product_price: d.productPrice,
                product_download_count: d.productDownloadCount,
                product_preview_images: d.productPreviewImages
            }))
        }
    }

    @Get('dashboard-creator-balances')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardCreatorBalances(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.getCreatorBalances(creator)
        return {
            message: 'Get Dashborad Creator Balances Successful',
            data: {
                id: data.id,
                created_at: data.createdAt,
                updated_at: data.updatedAt,
                creator_id: data.creatorId,
                balance: data.balance,
                total_earned: data.totalEarned,
                total_withdrawn: data.totalWithdrawn,
                last_withdrawn_at: data.lastWithdrawnAt,
                last_settled_at: data.lastSettledAt
            }
        }
    }

    @Get('dashboard-withdrawal-creator-balances')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardWithdrawalCreatorBalances(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.getWithdrawalCreatorBalances(creator)
        return {
            message: 'Get Dashborad Creator Balances Successful',
            data: {
                balance: data.balance,
                balance_to_withdrawn: data.balanceToWithdrawn
            }
        }
    }

    @Get('dashboard-withdrawal-history')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getDashboardWithdrawalHistory(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.getWithdrawalHistory(creator)
        return {
            message: 'Get Dashborad Creator Balances Successful',
            data: data.withdrawalHistory.map(w => ({
                id: w.id,
                created_at: w.createdAt,
                updated_at: w.updatedAt,
                user_id: w.userId,
                status: w.status,
                amount: w.amount,
                platform_fee_percent: w.platformFeePercent,
                platform_fee: w.platformFee,
                net_amount: w.netAmount,
                destination_type: w.destinationType,
                destination_name: w.destinationName,
                destination_account: w.destinationAccount,
                destination_holder: w.destinationHolder,
                rejection_reason: w.rejectionReason,
                requested_at: w.requestedAt,
                processed_at: w.processedAt
            }))
        }
    }

    @Get('/wallet')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getUserWallet(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const wallet = await this.creatorsService.getUserWallet(creator)
        if (!wallet) throw new NotFoundException()

        return {
            message: 'Get Wallet Successful',
            data: {
                id: wallet.id,
                type: wallet.type,
                name: wallet.name,
                number: wallet.number,
                holder: wallet.holder,
                created_at: wallet.createdAt,
                updated_at: wallet.updatedAt
            }
        }
    }

    @Post('/wallet')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.CREATED)
    async createUserWallet(@Req() req: Request, @Body() dto: CreateUserWalletsRequest) {
        const creator = req.withUser
        if (!creator) return

        const wallet = await this.creatorsService.createUserWallet(creator, {
            type: dto.type as 'bank' | 'e-wallet',
            name: dto.name,
            number: dto.number,
            holder: dto.holder
        })
        return {
            message: 'Wallet Successfully Saved',
            data: {
                id: wallet.id,
                type: wallet.type,
                name: wallet.name,
                number: wallet.number,
                holder: wallet.holder,
                created_at: wallet.createdAt
            }
        }
    }

    @Get('/balance')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    async getCreatorBalances(@Req() req: Request) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.getCreatorBalances(creator)
        return {
            message: 'Get Creator Balances Successful',
            data: {
                id: data.id,
                created_at: data.createdAt,
                updated_at: data.updatedAt,
                creator_id: data.creatorId,
                balance: data.balance,
                total_earned: data.totalEarned,
                total_withdrawn: data.totalWithdrawn,
                last_withdrawn_at: data.lastWithdrawnAt,
                last_settled_at: data.lastSettledAt
            }
        }
    }

    @Post('/withdrawn')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.CREATED)
    async createUserWithdrawnRequest(@Req() req: Request, @Body() dto: CreateUserWithdrawnRequest) {
        const creator = req.withUser
        if (!creator) return

        const data = await this.creatorsService.createUserWithdrawn(creator, dto)
        return { message: 'Withdrawn Request Successful', data }
    }

    @Post('/payment/iris/notification')
    @HttpCode(HttpStatus.CREATED)
    placeOrderNotification(@Body() req: Request) {
        console.log({ req })
        return { message: 'TEST PING', data: null }
    }
}
