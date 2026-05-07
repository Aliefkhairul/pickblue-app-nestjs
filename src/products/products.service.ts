import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { DrizzleQueryError } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { CreateProductFilesParams, CreateProductParams, CreateProductPreviewImagesParams, productFiles, productPreviewImages, products } from 'src/schema'

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name)

    constructor(@Inject(dbConnection) private readonly db: PgDB) {}

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
