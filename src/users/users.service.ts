import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { and, DrizzleQueryError, eq, inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { cartItems, CreateCartParams, products, userPurchases, users } from 'src/schema'
import { UploadersService } from 'src/uploaders/uploaders.service'
import { AuthenticatedUserPayload } from 'utils/https/guards'
import { removeContaintUrl } from 'utils/regex'

type ProductFiles = {
    id: string
    createdAt: Date
    updatedAt: Date
    productId: string
    mediaUrl: string
    fileName: string
    fileSize: number
    publicId: string
    resourceType: string
    format: string
    downloadable_url: string
}

type ProductPreviewImages = {
    id: string
    createdAt: Date
    updatedAt: Date
    productId: string
    mediaUrl: string
}

type FindProductInLibrary = {
    user_purchase_id: string
    user_purchase_product_id: string | null
    user_purchase_created_at: Date
    product_formats: string[] | null
    product_name: string | null
    creator_name: string | null
    product_preview_images: ProductPreviewImages[]
    product_files: ProductFiles[]
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)

    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        private readonly uploadersService: UploadersService
    ) {}

    async createCart(params: CreateCartParams) {
        return await this.db.transaction(async tx => {
            try {
                // is user already purchase related product
                const userPurchases = await tx.query.userPurchases.findFirst({
                    where: userPurchase => and(eq(userPurchase.productId, params.productId), eq(userPurchase.customerId, params.customerId))
                })
                if (userPurchases) throw new HttpException({ message: 'Product Already Bought' }, HttpStatus.BAD_REQUEST)

                // is user's cart already exists
                const existing = await tx.query.cartItems.findFirst({
                    where: ci => and(eq(ci.productId, params.productId), eq(ci.customerId, params.customerId))
                })
                if (existing) throw new HttpException({ message: 'Product Already In Cart' }, HttpStatus.CONFLICT)

                // product check
                const product = await tx.query.products.findFirst({ where: p => eq(p.id, params.productId) })
                if (!product) throw new HttpException({ message: 'Product Not Found' }, HttpStatus.NOT_FOUND)

                const [cartItem] = await tx
                    .insert(cartItems)
                    .values({
                        customerId: params.customerId,
                        productId: params.productId,
                        quantity: params.quantity
                    })
                    .returning()

                return cartItem
            } catch (err) {
                if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                    if (err.cause.code === '23503') throw new BadRequestException('Invalid Product Id')
                    if (err.cause.code === '23505') throw new ConflictException('Product Already In Cart')
                }
                throw err
            }
        })
    }

    async getLibrary(params: AuthenticatedUserPayload) {
        return await this.db.transaction(async tx => {
            const findUserPurchases = await tx
                .select({
                    user_purchase_id: userPurchases.id,
                    user_purchase_product_id: userPurchases.productId,
                    user_purchase_created_at: userPurchases.createdAt,
                    product_name: products.name,
                    product_formats: products.allowedFormats,
                    creator_name: users.name
                })
                .from(userPurchases)
                .leftJoin(products, eq(products.id, userPurchases.productId))
                .leftJoin(users, eq(users.id, products.creatorId))
                .where(eq(userPurchases.customerId, params.userId))

            if (findUserPurchases.length === 0) return []

            const productFiles = await tx.query.productFiles.findMany({
                where: pf =>
                    inArray(
                        pf.productId,
                        findUserPurchases.map(fup => fup.user_purchase_product_id as string)
                    )
            })

            if (productFiles.length === 0) return []

            const createProductFilesPayload = productFiles.reduce((arr: ProductFiles[], current) => {
                const downloadableUrl = this.uploadersService.getSingleDownloadableImage({ publicId: current.publicId, fileName: removeContaintUrl(current.fileName) })
                arr.push({ ...current, downloadable_url: downloadableUrl })
                return arr
            }, [])

            const productPreviewImages = await tx.query.productPreviewImages.findMany({
                where: pf =>
                    inArray(
                        pf.productId,
                        productFiles.map(pf => pf.productId)
                    )
            })

            if (productPreviewImages.length === 0) return []

            const final = findUserPurchases.reduce((arr: FindProductInLibrary[], current) => {
                const pickProductFiles = createProductFilesPayload.filter(pf => pf.productId === current.user_purchase_product_id)
                const pickProductPreview = productPreviewImages.filter(ppi => ppi.productId === current.user_purchase_product_id)

                arr.push({ ...current, product_files: pickProductFiles, product_preview_images: pickProductPreview })
                return arr
            }, [])

            return final
        })
    }

    async getLibraryOrders(params: AuthenticatedUserPayload) {
        const data = await this.db.query.orders.findMany({ where: o => and(eq(o.customerId, params.userId), eq(o.status, 'settled')) })
        if (data.length === 0) return []

        return data
    }
}
