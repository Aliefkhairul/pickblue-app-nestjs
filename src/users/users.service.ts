import { ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq, inArray } from 'drizzle-orm'
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
    downloadableUrl: string
}

type ProductPreviewImages = {
    id: string
    createdAt: Date
    updatedAt: Date
    productId: string
    mediaUrl: string
}

type ProductInLibrary = {
    userPurchaseId: string
    userPurchaseProductId: string | null
    userPurchaseCreatedAt: Date
    productFormats: string[] | null
    productName: string | null
    creatorName: string | null
    productPreviewImages: ProductPreviewImages[]
    productFiles: ProductFiles[]
}

type GetCartItems = {
    cartItems: {
        id: string
        customerId: string
        productId: string
        quantity: number
        createdAt: Date
        updatedAt: Date
    }
    users: {
        id: string
        name: string
        email: string
        image: string | null
        verifiedAt: Date | null
        deletedAt: Date | null
        createdAt: Date
        updatedAt: Date
    } | null
    products: {
        id: string
        creatorId: string
        name: string
        categories: string[]
        description: string
        details: string | null
        slug: string
        price: number
        likesCount: number
        downloadsCount: number
        allowedFormats: string[]
        tags: string[]
        createdAt: Date
        updatedAt: Date
    } | null
    productPreviewImages: ProductPreviewImages[]
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)

    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        private readonly uploadersService: UploadersService
    ) {}

    async getCarts(user: AuthenticatedUserPayload) {
        const getCartItems = await this.db
            .select()
            .from(cartItems)
            .leftJoin(products, eq(products.id, cartItems.productId))
            .leftJoin(users, eq(users.id, products.creatorId))
            .where(eq(cartItems.customerId, user.userId))
        if (getCartItems.length === 0) return []

        const productPreviewImages = await this.db.query.productPreviewImages.findMany({
            where: p =>
                inArray(
                    p.productId,
                    getCartItems.map(c => c.products?.id as string)
                )
        })

        const data = getCartItems.reduce((arr: GetCartItems[], current) => {
            const findProductPreviewImages = productPreviewImages.filter(p => p.productId === current.products?.id)
            arr.push({
                cartItems: current.cart_items,
                users: current.users,
                products: current.products,
                productPreviewImages: findProductPreviewImages
            })
            return arr
        }, [])
        if (data.length === 0) return []

        return data
    }

    async createCart(params: CreateCartParams) {
        return await this.db.transaction(async tx => {
            // BUGS: "FINDFIRST AND CREATORID"
            const isOwnerOfTheProduct = await tx.query.products.findFirst({
                where: p => and(eq(p.id, params.productId), eq(p.creatorId, params.customerId))
            })
            if (isOwnerOfTheProduct) throw new ConflictException('Cannot Add Your Own Product')

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
        })
    }

    async deleteCart(params: { customerId: string; cartItemId: string }) {
        const cartItem = await this.db.query.cartItems.findFirst({
            where: ci => and(eq(ci.id, params.cartItemId), eq(ci.customerId, params.customerId))
        })
        if (!cartItem) throw new HttpException({ message: 'Cart Item Not Found' }, HttpStatus.NOT_FOUND)

        const [deleted] = await this.db.delete(cartItems).where(eq(cartItems.id, params.cartItemId)).returning()
        return deleted
    }

    async getLibrary(params: AuthenticatedUserPayload) {
        return await this.db.transaction(async tx => {
            const findUserPurchases = await tx
                .select({
                    userPurchaseId: userPurchases.id,
                    userPurchaseProductId: userPurchases.productId,
                    userPurchaseCreatedAt: userPurchases.createdAt,
                    productName: products.name,
                    productFormats: products.allowedFormats,
                    creatorName: users.name
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
                        findUserPurchases.map(fup => fup.userPurchaseProductId as string)
                    )
            })

            if (productFiles.length === 0) return []

            const createProductFilesPayload = productFiles.reduce((arr: ProductFiles[], current) => {
                const downloadableUrl = this.uploadersService.getSingleDownloadableImage({ publicId: current.publicId, fileName: removeContaintUrl(current.fileName) })
                arr.push({ ...current, downloadableUrl: downloadableUrl })
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

            const final = findUserPurchases.reduce((arr: ProductInLibrary[], current) => {
                const pickProductFiles = createProductFilesPayload.filter(pf => pf.productId === current.userPurchaseProductId)
                const pickProductPreview = productPreviewImages.filter(ppi => ppi.productId === current.userPurchaseProductId)

                arr.push({ ...current, productFiles: pickProductFiles, productPreviewImages: pickProductPreview })
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
