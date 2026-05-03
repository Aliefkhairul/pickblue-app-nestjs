import { Body, Controller, Delete, FileTypeValidator, Get, HttpCode, HttpStatus, Logger, MaxFileSizeValidator, ParseBoolPipe, ParseFilePipe, Post, Query, Req, UploadedFiles, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'
import { CreateProductFilesParams, CreateProductPreviewImagesParams } from 'src/schema'
import { ALLOWED_MIME_TYPE, MAX_FILE_COUNT, MAX_FILE_SIZE_UPLOAD } from 'src/uploaders/uploaders.module'
import { UploadersService } from 'src/uploaders/uploaders.service'
import { AuthGuard } from 'utils/https/http.auth.guard'
import { HttpExceptionFilter } from 'utils/https/http.exceptions'
import { HttpResponseInterceptor } from 'utils/https/http.interceptors'
import { HttpValidationPipe } from 'utils/https/http.validations'
import { CreateProductFileRequestList, CreateProductPreviewImageRequestList, CreateProductRequest } from './dto/products.dto'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
    private readonly logger = new Logger(ProductsController.name)

    constructor(
        private readonly productsService: ProductsService,
        private readonly uploadersService: UploadersService
    ) {}

    @Post('/')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createProduct(@Req() req: Request, @Body(new HttpValidationPipe()) dto: CreateProductRequest) {
        const user = req.withUser
        return await this.productsService.createProduct({
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
    }

    @Post('/files')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createProductFiles(@Body(new HttpValidationPipe()) dto: CreateProductFileRequestList) {
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
        return { message: 'create_product_files_successful', data: productFiles }
    }

    @Post('/preview-images')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createProductPreviewImages(@Body(new HttpValidationPipe()) dto: CreateProductPreviewImageRequestList) {
        const payload: CreateProductPreviewImagesParams = dto.images.map(img => ({
            productId: img.product_id,
            mediaUrl: img.media_url
        }))
        const productPreviewImages = await this.productsService.createProductPreviewImages(payload)
        return { message: 'create_product_preview_images_successful', data: productPreviewImages }
    }

    @Post('/upload-files')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor, FilesInterceptor('files', MAX_FILE_COUNT))
    @HttpCode(HttpStatus.CREATED)
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
        return { message: 'upload_files_successful', data: uploadFiles }
    }

    @Get('/files')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    getDownloadableSingleImage(@Query('public_id') publicId: string, @Query('file_name') fileName: string) {
        const downloadableImage = this.uploadersService.getSingleDownloadableImage({ publicId, fileName })
        return { message: 'get_downloadable_image_successful', data: downloadableImage }
    }

    @Delete('/files')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    destroySingleImage(@Query('public_id') publicId: string) {
        const destroyImage = this.uploadersService.destroySingleImage({ publicId })
        return { message: 'destroy_image_successful', data: destroyImage }
    }
}
