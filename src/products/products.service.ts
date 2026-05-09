import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { and, arrayContains, desc, DrizzleQueryError, eq, gt, inArray, lt } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { CreateProductFilesParams, CreateProductParams, CreateProductPreviewImagesParams, productFiles, productPreviewImages, products } from 'src/schema'

type GetProductsWithPrevParams = {
    category: string
    minPrice: number
    maxPrice: number
    sortBy: 'most_download' | 'most_likely' | 'created_at'
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
    allowedFormats: string[]
    tags: string[]
    creator: Creator
    productPreviewImages: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        mediaUrl: string
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
    allowedFormats: string[]
    tags: string[]
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

    async getProductsWithPrev({ category = '', minPrice = 0, maxPrice = 0, sortBy = 'created_at' }: GetProductsWithPrevParams) {
        const productWithPrevImages = await this.db.query.products.findMany({
            where: p => {
                if (category === 'all') {
                    return and(minPrice > 0 ? gt(p.price, minPrice) : undefined, maxPrice > 0 ? lt(p.price, maxPrice) : undefined)
                } else {
                    // eslint-disable-next-line prettier/prettier
                    return and(
                        arrayContains(p.categories, [category]),
                        minPrice > 0 ? gt(p.price, minPrice) : undefined,
                        maxPrice > 0 ? lt(p.price, maxPrice) : undefined
                    )
                }
            },
            orderBy: p => {
                if (sortBy === 'most_download') return desc(p.downloadsCount)
                else if (sortBy === 'most_likely') return desc(p.likesCount)
                else if (sortBy === 'created_at') return desc(p.createdAt)
                else return desc(p.createdAt)
            },
            with: { productPreviewImages: true }
        })
        if (productWithPrevImages.length === 0) return []

        const users = await this.db.query.users.findMany({
            where: u =>
                inArray(
                    u.id,
                    productWithPrevImages.map(pwvi => pwvi.creatorId)
                )
        })
        if (users.length === 0) return []

        const productWithPrevImagesAndCreator = productWithPrevImages.reduce((arr: ProductWithPrevImagesAndCreator[], current) => {
            const findCreator = users.find(u => u.id === current.creatorId) as Creator
            arr.push({ ...current, creator: findCreator })
            return arr
        }, [])
        if (productWithPrevImagesAndCreator.length === 0) return []

        return productWithPrevImagesAndCreator
    }

    async getProductBySlug(param: { slug: string }) {
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

        const productWithPrevImages = products.reduce((arr: ProductWithPrevImagesAndCreatorBySlug[], current) => {
            const findCreator = creators.find(c => c.id === current.creatorId) as Creator
            arr.push({ ...current, creator: findCreator })
            return arr
        }, [])
        if (productWithPrevImages.length === 0) return []

        return productWithPrevImages
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
                    allowedFormats: params.allowedFormats,
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
            if (prdctFiles.length === 0) throw new HttpException({ message: 'Failed To Create Product Files' }, HttpStatus.INTERNAL_SERVER_ERROR)

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
            if (previewImages.length === 0) throw new HttpException({ message: 'Failed To Create Product Preview Images' }, HttpStatus.INTERNAL_SERVER_ERROR)

            return previewImages
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('Invalid Product Id')
            }
            throw err
        }
    }
}
