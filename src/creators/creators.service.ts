import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq, inArray } from 'drizzle-orm'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { products } from 'src/schema'
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

@Injectable()
export class CreatorsService {
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

        const setteldCreatorEarnings = await this.db.query.creatorEarnings.findMany({ where: ce => eq(ce.status, 'settled') })
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
}
