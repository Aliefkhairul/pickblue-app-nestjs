import { Body, Controller, Delete, FileTypeValidator, Get, HttpCode, HttpStatus, Logger, MaxFileSizeValidator, ParseBoolPipe, ParseFilePipe, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
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

        return { message: 'Create-Product Successful', data: product }
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
        return { message: 'Create-Product-Files Successful', data: productFiles }
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
        return { message: 'Create-Product-Preview_Images Successful', data: productPreviewImages }
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
