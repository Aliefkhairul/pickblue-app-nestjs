import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthenticatedUserPayload, AuthGuard } from 'utils/https/http_auth_guard'
import { HttpExceptionFilter } from 'utils/https/http_exceptions'
import { HttpResponseInterceptor } from 'utils/https/http_interceptors'
import { HttpValidationPipe } from 'utils/https/http_validations'
import { CreateProductFileRequestList, CreateProductPreviewImageRequestList, CreateProductRequest } from './dto/products.dto'
import { ProductsService } from './products.service'
import { CategoryName, CreateProductFilesParams, CreateProductPreviewImagesParams } from 'src/schema'

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post('/')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createProduct(@Req() req: any, @Body(new HttpValidationPipe()) dto: CreateProductRequest) {
        const user = req.withUser as AuthenticatedUserPayload
        return await this.productsService.createProduct({
            userId: user.userId,
            name: dto.name,
            category: dto.category as CategoryName,
            description: dto.description,
            details: dto.details,
            slug: dto.slug,
            price: dto.price,
            allowedFormats: dto.allowed_formats,
            tags: dto.tags
        })
    }

    @Post('/files')
    // @UseGuards(AuthGuard)
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
        return await this.productsService.createProductFiles(payload)
    }

    @Post('/preview-images')
    // @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createProductPreviewImages(@Req() req: any, @Body(new HttpValidationPipe()) dto: CreateProductPreviewImageRequestList) {
        const payload: CreateProductPreviewImagesParams = dto.images.map(img => ({
            productId: img.product_id,
            mediaUrl: img.media_url
        }))
        return await this.productsService.createProductPreviewImages(payload)
    }
}
