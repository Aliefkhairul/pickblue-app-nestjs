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

    async getSellerBalances(creator: AuthenticatedUserPayload) {
        const sellerBalances = await this.db.query.sellerBalances.findFirst({ where: sb => eq(sb.creatorId, creator.userId) })
        if (!sellerBalances) throw new NotFoundException('Seller Balances Not Found')

        return sellerBalances
    }
}
