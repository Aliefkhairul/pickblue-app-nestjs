import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard } from 'utils/https/guards'
import { CreateCartRequest } from './dto/users.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('carts')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createCart(@Req() req: Request, @Body() dto: CreateCartRequest) {
        const user = req.withUser
        const userCart = await this.usersService.createCart({
            customerId: user.userId,
            productId: dto.product_id,
            quantity: dto.quantity
        })

        return {
            message: 'Create Cart Successful',
            data: {
                id: userCart.id,
                created_at: userCart.createdAt,
                updated_at: userCart.updatedAt,
                product_id: userCart.productId,
                customer_id: userCart.customerId,
                quantity: userCart.quantity
            }
        }
    }

    @Get('library')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async getLibrary(@Req() req: Request) {
        const user = req.withUser

        const userCart = await this.usersService.getLibrary(user)
        return {
            message: 'Get Library Data Successul',
            data: userCart.map(u => ({
                user_purchase_id: u.userPurchaseId,
                user_purchase_product_id: u.userPurchaseProductId,
                user_purchase_created_at: u.userPurchaseCreatedAt,
                product_formats: u.productFormats,
                product_name: u.productName,
                creator_name: u.creatorName,
                product_preview_images: u.productPreviewImages.map(ppi => ({
                    id: ppi.id,
                    created_at: ppi.createdAt,
                    updated_at: ppi.updatedAt,
                    product_id: ppi.productId,
                    media_url: ppi.mediaUrl
                })),
                product_files: u.productFiles.map(pf => ({
                    id: pf.id,
                    created_at: pf.createdAt,
                    updated_at: pf.updatedAt,
                    product_id: pf.productId,
                    media_url: pf.mediaUrl,
                    file_name: pf.fileName,
                    file_size: pf.fileSize,
                    public_id: pf.publicId,
                    resource_type: pf.resourceType,
                    format: pf.format,
                    downloadable_url: pf.downloadableUrl
                }))
            }))
        }
    }

    @Get('library-orders')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async getLibraryOrders(@Req() req: Request) {
        const user = req.withUser

        const userCart = await this.usersService.getLibraryOrders(user)
        return {
            message: 'Get Library Orders Data Successful',
            data: userCart.map(u => ({
                id: u.id,
                created_at: u.createdAt,
                updated_at: u.updatedAt,
                customer_id: u.customerId,
                order_code: u.orderCode,
                total_amount: u.totalAmount,
                status: u.status,
                paid_at: u.paidAt
            }))
        }
    }
}
