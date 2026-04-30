import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { DrizzleQueryError } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { CreateProductFilesParams, CreateProductPreviewImagesParams, CreateProductParams, productFiles, productPreviewImages, products } from 'src/schema'

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
                    userId: params.userId,
                    category: params.category,
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
                if (err.cause.code === '22P02') throw new BadRequestException('invalid_input')
                if (err.cause.code === '23505') throw new ConflictException('product_already_exists')
            }
            throw err
        }
    }

    async createProductFiles(params: CreateProductFilesParams) {
        try {
            if (params.length === 0) throw new HttpException({ message: 'no_files_provided' }, HttpStatus.BAD_REQUEST)

            const prdctFiles = await this.db.insert(productFiles).values(params).returning()
            if (prdctFiles.length === 0) throw new HttpException({ message: 'failed_to_create_product_files' }, HttpStatus.INTERNAL_SERVER_ERROR)

            return prdctFiles
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('invalid_product_id')
            }
            throw err
        }
    }

    async createProductPreviewImages(params: CreateProductPreviewImagesParams) {
        this.logger.debug(params)

        try {
            if (params.length === 0) throw new HttpException({ message: 'no_images_provided' }, HttpStatus.BAD_REQUEST)

            const previewImages = await this.db.insert(productPreviewImages).values(params).returning()
            if (previewImages.length === 0) throw new HttpException({ message: 'failed_to_create_product_preview_images' }, HttpStatus.INTERNAL_SERVER_ERROR)

            return previewImages
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('invalid_product_id')
            }
            throw err
        }
    }
}
