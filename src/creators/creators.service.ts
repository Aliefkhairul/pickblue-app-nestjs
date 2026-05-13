import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { creatorBalances, creatorEarnings, products } from 'src/schema'
import { AuthenticatedUserPayload } from 'utils/https/guards'

type SummaryProduct = {
    productId: string
    productName: string
    productPrice: number
    productDownloadCount: number
    productPreviewImages: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        mediaUrl: string
    }[]
}

type MergeCreatorEarningsPayload = {
    id: string
    creatorId: string
    amount: number
    status: 'pending' | 'settled' | 'distributed'
    availableAt: Date | null
}

@Injectable()
export class CreatorsService {
    private readonly logger = new Logger(CreatorsService.name)

    constructor(
        private readonly configService: ConfigService,
        @Inject(dbConnection) private readonly db: PgDB
    ) {}

    async getDashboardSummaryProduct(creator: AuthenticatedUserPayload) {
        const summaryProduct = await this.db
            .select({
                productId: products.id,
                productName: products.name,
                productPrice: products.price,
                productDownloadCount: products.downloadsCount
            })
            .from(products)
            .where(eq(products.creatorId, creator.userId))

        if (summaryProduct.length === 0) return []

        const productPreviewImages = await this.db.query.productPreviewImages.findMany({
            where: p =>
                inArray(
                    p.productId,
                    summaryProduct.map(sp => sp.productId)
                )
        })

        if (productPreviewImages.length === 0) return []

        const data = summaryProduct.reduce((arr: SummaryProduct[], current) => {
            arr.push({ ...current, productPreviewImages: productPreviewImages.filter(p => p.productId === current.productId) })
            return arr
        }, [])

        if (data.length === 0) return []

        return data
    }

    async getCreatorBalances(creator: AuthenticatedUserPayload) {
        const creatorBalances = await this.db.query.creatorBalances.findFirst({ where: cb => eq(cb.creatorId, creator.userId) })
        if (!creatorBalances) throw new NotFoundException('Creator Balances Not Found')

        return creatorBalances
    }

    async getWithdrawalCreatorBalances(creator: AuthenticatedUserPayload) {
        const creatorBalances = await this.db.query.creatorBalances.findFirst({ where: cb => eq(cb.creatorId, creator.userId) })
        if (!creatorBalances) throw new NotFoundException('Creator Balances Not Found')

        // BUGS: FIX ADD "AND METHOD TO INCLUDE CREATOR_ID"
        const setteldCreatorEarnings = await this.db.query.creatorEarnings.findMany({
            where: ce => and(eq(ce.status, 'settled'), eq(ce.creatorId, creator.userId))
        })
        if (setteldCreatorEarnings.length === 0) {
            return { balance: creatorBalances.balance, balanceToWithdrawn: creatorBalances.balance }
        }

        const calcCreatorEarningsSettled = setteldCreatorEarnings.reduce((t, c) => t + c.amount, 0)
        return { balance: creatorBalances.balance + calcCreatorEarningsSettled, balanceToWithdrawn: creatorBalances.balance }
    }

    async getWithdrawalHistory(creator: AuthenticatedUserPayload) {
        const withdrawalHistory = await this.db.query.withdrawals.findMany({ where: w => eq(w.userId, creator.userId) })
        if (withdrawalHistory.length === 0) return { withdrawalHistory: [] }

        return { withdrawalHistory }
    }

    async releaseCreatorEarningsToBalance() {
        const now = new Date()
        const findCreatorEarnings = await this.db.query.creatorEarnings.findMany({
            where: ce => and(eq(ce.status, 'settled'), lt(ce.availableAt, now))
        })

        if (findCreatorEarnings.length === 0) {
            this.logger.debug("Creator Earning With 'Settled' Status Not Found ")
            return
        }

        const mergeCreatorEarningsPayload = findCreatorEarnings.reduce((arr: MergeCreatorEarningsPayload[], current) => {
            const isSameCreator = arr.find(obj => obj.creatorId === current.creatorId)

            if (isSameCreator) {
                isSameCreator.amount += current.amount
            } else {
                arr.push({
                    id: current.id,
                    creatorId: current.creatorId,
                    amount: current.amount,
                    status: 'settled',
                    availableAt: current.availableAt
                })
            }

            return arr
        }, [])

        if (mergeCreatorEarningsPayload.length === 0) return

        await this.db.transaction(async tx => {
            for (const currentCreatorEarning of mergeCreatorEarningsPayload) {
                const [updateCreatorBalance] = await tx
                    .update(creatorBalances)
                    .set({
                        balance: sql`${creatorBalances.balance} + COALESCE(${currentCreatorEarning.amount}, 0)`,
                        lastSettledAt: now
                    })
                    .where(eq(creatorBalances.creatorId, currentCreatorEarning.creatorId))
                    .returning()

                if (!updateCreatorBalance) throw new InternalServerErrorException('Update Creator Balance Failed')

                const [updateCreatorEarnings] = await tx
                    .update(creatorEarnings)
                    .set({
                        status: 'distributed'
                    })
                    .where(and(eq(creatorEarnings.id, currentCreatorEarning.id)))
                    .returning()

                if (!updateCreatorEarnings) throw new InternalServerErrorException('Update Creator Earnings Failed')

                this.logger.debug('Crob Job Is Running, Updating Creator Balance And Creator Earnings Is Successful')
            }
        })
    }
}
