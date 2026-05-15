import {
    BadRequestException,
    ConflictException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    Logger
} from '@nestjs/common'
import { and, arrayContains, desc, DrizzleQueryError, eq, gte, inArray, lte, SQL, sql } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import {
    CreateProductFilesParams,
    CreateProductParams,
    CreateProductPreviewImagesParams,
    productFiles,
    productLikes,
    productPreviewImages,
    products
} from 'src/schema'

type GetProductsWithPrevParams = {
    category: string
    minPrice: number
    maxPrice: number
    sortBy: 'most_downloads' | 'most_likely' | 'created_at'
    query: string
    // user: AuthenticatedUserPayload | null
}

type Creator = {
    id: string
    name: string
    email: string
    image: string | null
    verifiedAt: Date | null
    deletedAt: Date | null
    createdAt: Date
    updatedAt: Date
}

type ProductWithPrevImagesAndCreator = {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    creatorId: string
    categories: string[]
    description: string
    details: string | null
    slug: string
    price: number
    likesCount: number
    downloadsCount: number
    // isLiked: boolean
    tags: string[]
    creator: Creator
    productPreviewImages: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        mediaUrl: string
    }[]
    productLikes: {
        id: string
        createdAt: Date
        updatedAt: Date
        userId: string
        productId: string
    }[]
}

type ProductWithPrevImagesAndCreatorBySlug = {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    creatorId: string
    categories: string[]
    description: string
    details: string | null
    slug: string
    price: number
    likesCount: number
    downloadsCount: number
    tags: string[]
    isLiked: boolean
    creator: Creator
    productFiles: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        fileName: string
        fileSize: number
        publicId: string
        // mediaUrl: string
        resourceType: string
        format: string
    }[]
    productPreviewImages: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        mediaUrl: string
    }[]
}

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name)

    constructor(@Inject(dbConnection) private readonly db: PgDB) {}

    async getProductsWithPrev({
        category = '',
        minPrice = 0,
        maxPrice = 0,
        sortBy = 'created_at',
        query = ''
    }: GetProductsWithPrevParams) {
        let createQuery: SQL<unknown> | undefined
        let createOrderBy: SQL<unknown>
        const querySearch = query

        if (category === 'all') {
            createQuery = and(
                query !== ''
                    ? sql`to_tsvector('english', ${products.name}) @@ websearch_to_tsquery('english', ${querySearch})`
                    : undefined,
                minPrice > 0 ? gte(products.price, minPrice) : undefined,
                maxPrice > 0 ? lte(products.price, maxPrice) : undefined
            )
        } else {
            createQuery = and(
                arrayContains(products.categories, [category]),
                query !== ''
                    ? sql`to_tsvector('english', ${products.name}) @@ websearch_to_tsquery('english', ${querySearch})`
                    : undefined,
                minPrice > 0 ? gte(products.price, minPrice) : undefined,
                maxPrice > 0 ? lte(products.price, maxPrice) : undefined
            )
        }

        if (sortBy === 'most_downloads') {
            createOrderBy = desc(products.downloadsCount)
        } else if (sortBy === 'most_likely') {
            createOrderBy = desc(products.likesCount)
        } else if (sortBy === 'created_at') {
            createOrderBy = desc(products.createdAt)
        } else {
            createOrderBy = desc(products.createdAt)
        }

        const findProducts = await this.db.select().from(products).where(createQuery).orderBy(createOrderBy)
        if (findProducts.length === 0) return []

        const findProductPrevImages = await this.db.query.productPreviewImages.findMany({
            where: p =>
                inArray(
                    p.productId,
                    findProducts.map(fp => fp.id)
                )
        })

        const findProductLikes = await this.db.query.productLikes.findMany({
            where: p =>
                inArray(
                    p.productId,
                    findProducts.map(fp => fp.id)
                )
        })

        const findUsers = await this.db.query.users.findMany({
            where: u =>
                inArray(
                    u.id,
                    findProducts.map(fp => fp.creatorId)
                )
        })

        const productsWithPrev = findProducts.reduce((arr: ProductWithPrevImagesAndCreator[], current) => {
            const pickProductPreviewImages = findProductPrevImages.filter(ppi => ppi.productId === current.id)
            const pickProductLikes = findProductLikes.filter(pl => pl.productId === current.id)
            const pickProductCreators = findUsers.find(u => u.id === current.creatorId)

            if (pickProductCreators === undefined) return arr

            arr.push({
                ...current,
                creator: pickProductCreators,
                productPreviewImages: pickProductPreviewImages,
                productLikes: pickProductLikes
            })

            return arr
        }, [])

        return productsWithPrev
    }

    async getProductBySlug(param: { slug: string; userId: string | undefined }) {
        const products = await this.db.query.products.findMany({
            where: p => eq(p.slug, param.slug),
            with: { productPreviewImages: true, productFiles: { columns: { mediaUrl: false } } }
        })
        if (products.length === 0) return []

        const creators = await this.db.query.users.findMany({
            where: u =>
                inArray(
                    u.id,
                    products.map(d => d.creatorId)
                )
        })
        if (creators.length === 0) return []

        let likedProductIds: string[] = []
        if (param.userId) {
            const likes = await this.db.query.productLikes.findMany({
                where: pl => and(eq(pl.userId, param.userId as string), eq(pl.productId, products[0].id))
            })
            likedProductIds = likes.map(l => l.productId)
        }

        const productWithPrevImages = products.reduce((arr: ProductWithPrevImagesAndCreatorBySlug[], current) => {
            const findCreator = creators.find(c => c.id === current.creatorId) as Creator
            arr.push({ ...current, creator: findCreator, isLiked: likedProductIds.includes(current.id) })
            return arr
        }, [])
        if (productWithPrevImages.length === 0) return []

        return productWithPrevImages
    }

    async toggleProductLike(params: { userId: string; productId: string }) {
        return await this.db.transaction(async tx => {
            const existing = await tx.query.productLikes.findFirst({
                where: pl => and(eq(pl.userId, params.userId), eq(pl.productId, params.productId))
            })

            if (existing) {
                await tx.delete(productLikes).where(eq(productLikes.id, existing.id))
                await tx
                    .update(products)
                    .set({ likesCount: sql`${products.likesCount} - 1` })
                    .where(eq(products.id, params.productId))
                return { isLiked: false }
            } else {
                const product = await tx.query.products.findFirst({ where: p => eq(p.id, params.productId) })
                if (!product) throw new HttpException({ message: 'Product Not Found' }, HttpStatus.NOT_FOUND)

                await tx.insert(productLikes).values({ userId: params.userId, productId: params.productId })
                await tx
                    .update(products)
                    .set({ likesCount: sql`${products.likesCount} + 1` })
                    .where(eq(products.id, params.productId))
                return { isLiked: true }
            }
        })
    }

    async createProduct(params: CreateProductParams) {
        try {
            const product = await this.db
                .insert(products)
                .values({
                    name: params.name,
                    creatorId: params.creatorId,
                    categories: params.categories,
                    description: params.description,
                    details: params.details,
                    slug: params.slug,
                    price: params.price,
                    tags: params.tags
                })
                .returning()

            return product[0]
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '22P02') throw new BadRequestException('Invalid Input')
                if (err.cause.code === '23505') throw new ConflictException('Product Already Exists')
            }
            throw err
        }
    }

    async createProductFiles(params: CreateProductFilesParams) {
        try {
            if (params.length === 0) throw new HttpException({ message: 'No Files Provided' }, HttpStatus.BAD_REQUEST)

            const prdctFiles = await this.db.insert(productFiles).values(params).returning()
            if (prdctFiles.length === 0)
                throw new HttpException({ message: 'Failed To Create Product Files' }, HttpStatus.INTERNAL_SERVER_ERROR)

            return prdctFiles
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('Invalid Product Id')
            }
            throw err
        }
    }

    async createProductPreviewImages(params: CreateProductPreviewImagesParams) {
        try {
            if (params.length === 0) throw new HttpException({ message: 'No Images Provided' }, HttpStatus.BAD_REQUEST)

            const previewImages = await this.db.insert(productPreviewImages).values(params).returning()
            if (previewImages.length === 0)
                throw new HttpException(
                    { message: 'Failed To Create Product Preview Images' },
                    HttpStatus.INTERNAL_SERVER_ERROR
                )

            return previewImages
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('Invalid Product Id')
            }
            throw err
        }
    }
}
