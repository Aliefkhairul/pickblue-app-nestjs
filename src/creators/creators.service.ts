import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { productPreviewImages, products } from 'src/schema'
import { AuthenticatedUserPayload } from 'utils/https/guards'

@Injectable()
export class CreatorsService {
    constructor(
        private readonly configService: ConfigService,
        @Inject(dbConnection) private readonly db: PgDB
    ) {}

    async getDashboardSummaryProduct(creator: AuthenticatedUserPayload) {
        const summaryProduct = await this.db
            .select({
                product_id: products.id,
                product_name: products.name,
                product_price: products.price,
                product_download_count: products.downloadsCount,
                product_preview_image_media_url: productPreviewImages.mediaUrl
            })
            .from(products)
            .leftJoin(productPreviewImages, eq(products.id, productPreviewImages.productId))
            .where(eq(products.creatorId, creator.userId))

        return summaryProduct
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
        return { withdrawalHistory }
    }
}
