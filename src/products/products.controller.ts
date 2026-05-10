import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    MaxFileSizeValidator,
    Param,
    ParseBoolPipe,
    ParseFilePipe,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'
import { CreateProductFilesParams, CreateProductPreviewImagesParams } from 'src/schema'
import { ALLOWED_MIME_TYPE, MAX_FILE_COUNT, MAX_FILE_SIZE_UPLOAD } from 'src/uploaders/uploaders.module'
import { UploadersService } from 'src/uploaders/uploaders.service'
import { AuthGuard, Role, Roles, RolesGuard } from 'utils/https/guards'
import { HttpResponseInterceptor } from 'utils/https/interceptors'
import { CreateProductFileRequestList, CreateProductPreviewImageRequestList, CreateProductRequest } from './dto/products.dto'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
    private readonly logger = new Logger(ProductsController.name)

    constructor(
        private readonly productsService: ProductsService,
        private readonly uploadersService: UploadersService
    ) {}

    @Get('/')
    @HttpCode(HttpStatus.CREATED)
    async getProductsWithPrev(
        @Query('category') category: string = '',
        @Query('min_price', ParseIntPipe) minPrice: number = 0,
        @Query('max_price', ParseIntPipe) maxPrice: number = 0,
        @Query('sort_by') sortBy: 'most_download' | 'most_likely' | 'created_at' = 'created_at'
    ) {
        const productsWithPrev = await this.productsService.getProductsWithPrev({ category, minPrice, maxPrice, sortBy })
        return {
            message: 'Get Products With Prev Successful',
            data: productsWithPrev.map(p => ({
                id: p.id,
                name: p.name,
                created_at: p.createdAt,
                updated_at: p.updatedAt,
                creator_id: p.creatorId,
                categories: p.categories,
                description: p.description,
                details: p.details,
                slug: p.slug,
                price: p.price,
                likes_count: p.likesCount,
                downloads_count: p.downloadsCount,
                allowed_formats: p.allowedFormats,
                tags: p.tags,
                creator: {
                    id: p.creator.id,
                    name: p.creator.name,
                    email: p.creator.email,
                    image: p.creator.image,
                    verified_at: p.creator.verifiedAt,
                    deleted_at: p.creator.deletedAt,
                    created_at: p.creator.createdAt,
                    updated_at: p.creator.updatedAt
                },
                product_preview_images: p.productPreviewImages.map(p => ({
                    id: p.id,
                    created_at: p.createdAt,
                    updated_at: p.updatedAt,
                    product_id: p.productId,
                    media_url: p.mediaUrl
                }))
            }))
        }
    }

    @Get(':slug')
    @HttpCode(HttpStatus.CREATED)
    async getProductBySlug(@Param() param: { slug: string }) {
        const productsWithPrev = await this.productsService.getProductBySlug(param)
        return {
            message: 'Get Products By Slug Successful',
            data: productsWithPrev.map(p => ({
                id: p.id,
                name: p.name,
                created_at: p.createdAt,
                updated_at: p.updatedAt,
                creator_id: p.creatorId,
                categories: p.categories,
                description: p.description,
                details: p.details,
                slug: p.slug,
                price: p.price,
                likes_count: p.likesCount,
                downloads_count: p.downloadsCount,
                allowed_formats: p.allowedFormats,
                tags: p.tags,
                creator: {
                    id: p.creator.id,
                    name: p.creator.name,
                    email: p.creator.email,
                    image: p.creator.image,
                    verified_at: p.creator.verifiedAt,
                    deleted_at: p.creator.deletedAt,
                    created_at: p.creator.createdAt,
                    updated_at: p.creator.updatedAt
                },
                product_preview_images: p.productPreviewImages.map(img => ({
                    id: img.id,
                    created_at: img.createdAt,
                    updated_at: img.updatedAt,
                    product_id: img.productId,
                    media_url: img.mediaUrl
                })),
                product_files: p.productFiles.map(f => ({
                    id: f.id,
                    created_at: f.createdAt,
                    updated_at: f.updatedAt,
                    product_id: f.productId,
                    file_name: f.fileName,
                    file_size: f.fileSize,
                    public_id: f.publicId,
                    resource_type: f.resourceType,
                    format: f.format
                }))
            }))
        }
    }

    @Post('/')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.CREATED)
    async createProduct(@Req() req: Request, @Body() dto: CreateProductRequest) {
        const user = req.withUser
        const product = await this.productsService.createProduct({
            creatorId: user.userId,
            name: dto.name,
            categories: dto.categories,
            description: dto.description,
            details: dto.details,
            slug: dto.slug,
            price: dto.price,
            allowedFormats: dto.allowed_formats,
            tags: dto.tags
        })

        return {
            message: 'Create-Product Successful',
            data: {
                id: product.id,
                name: product.name,
                created_at: product.createdAt,
                updated_at: product.updatedAt,
                creator_id: product.creatorId,
                categories: product.categories,
                description: product.description,
                details: product.details,
                slug: product.slug,
                price: product.price,
                likes_count: product.likesCount,
                downloads_count: product.downloadsCount,
                allowed_formats: product.allowedFormats,
                tags: product.tags
            }
        }
    }

    @Post('/files')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.CREATED)
    async createProductFiles(@Body() dto: CreateProductFileRequestList) {
        const payload: CreateProductFilesParams = dto.files.map(f => ({
            productId: f.product_id,
            fileName: f.file_name,
            fileSize: f.file_size,
            publicId: f.public_id,
            mediaUrl: f.media_url,
            resourceType: f.resource_type,
            format: f.format
        }))
        const productFiles = await this.productsService.createProductFiles(payload)
        return {
            message: 'Create-Product-Files Successful',
            data: productFiles.map(f => ({
                id: f.id,
                created_at: f.createdAt,
                updated_at: f.updatedAt,
                product_id: f.productId,
                file_name: f.fileName,
                file_size: f.fileSize,
                public_id: f.publicId,
                media_url: f.mediaUrl,
                resource_type: f.resourceType,
                format: f.format
            }))
        }
    }

    @Post('/preview-images')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.CREATED)
    async createProductPreviewImages(@Body() dto: CreateProductPreviewImageRequestList) {
        const payload: CreateProductPreviewImagesParams = dto.images.map(img => ({
            productId: img.product_id,
            mediaUrl: img.media_url
        }))
        const productPreviewImages = await this.productsService.createProductPreviewImages(payload)
        return {
            message: 'Create-Product-Preview_Images Successful',
            data: productPreviewImages.map(img => ({
                id: img.id,
                created_at: img.createdAt,
                updated_at: img.updatedAt,
                product_id: img.productId,
                media_url: img.mediaUrl
            }))
        }
    }

    @Post('/upload-files')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @UseInterceptors(HttpResponseInterceptor, FilesInterceptor('files', MAX_FILE_COUNT))
    @HttpCode(HttpStatus.OK)
    async createUploadFiles(
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_UPLOAD }),
                    new FileTypeValidator({
                        fileType: ALLOWED_MIME_TYPE
                    })
                ]
            })
        )
        files: Array<Express.Multer.File>,
        @Query('low_res', ParseBoolPipe)
        isLowRes: boolean
    ) {
        const uploadFiles = await Promise.all(files.map(file => this.uploadersService.uploadSingleImage(file, { lowRes: isLowRes })))
        return { message: 'Upload-File Successful', data: uploadFiles }
    }

    @Get('/files')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    getDownloadableSingleImage(@Query('public_id') publicId: string, @Query('file_name') fileName: string) {
        const downloadableImage = this.uploadersService.getSingleDownloadableImage({ publicId, fileName })
        return { message: 'Get-Downloadable_Image Sucessful', data: downloadableImage }
    }

    @Delete('/files')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Creator)
    @HttpCode(HttpStatus.OK)
    destroySingleImage(@Query('public_id') publicId: string) {
        const destroyImage = this.uploadersService.destroySingleImage({ publicId })
        return { message: 'Destroy-Image Successful', data: destroyImage }
    }
}
