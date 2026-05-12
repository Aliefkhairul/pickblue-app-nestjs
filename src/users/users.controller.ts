import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard } from 'utils/https/guards'
import { CreateCartRequest } from './dto/users.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('carts')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getCarts(@Req() req: Request) {
        const user = req.withUser
        const userCart = await this.usersService.getCarts(user)

        return {
            message: 'Get Cart Data Successful',
            data: userCart.map(u => ({
                cart_items: {
                    id: u.cartItems.id,
                    customer_id: u.cartItems.customerId,
                    product_id: u.cartItems.productId,
                    quantity: u.cartItems.quantity,
                    created_at: u.cartItems.createdAt,
                    updated_at: u.cartItems.updatedAt
                },
                users: u.users
                    ? {
                          id: u.users.id,
                          name: u.users.name,
                          email: u.users.email,
                          image: u.users.image,
                          verified_at: u.users.verifiedAt,
                          deleted_at: u.users.deletedAt,
                          created_at: u.users.createdAt,
                          updated_at: u.users.updatedAt
                      }
                    : null,
                products: u.products
                    ? {
                          id: u.products.id,
                          creator_id: u.products.creatorId,
                          name: u.products.name,
                          categories: u.products.categories,
                          description: u.products.description,
                          details: u.products.details,
                          slug: u.products.slug,
                          price: u.products.price,
                          likes_count: u.products.likesCount,
                          downloads_count: u.products.downloadsCount,
                          tags: u.products.tags,
                          created_at: u.products.createdAt,
                          updated_at: u.products.updatedAt
                      }
                    : null,
                product_preview_images: u.productPreviewImages.map(ppi => ({
                    id: ppi.id,
                    created_at: ppi.createdAt,
                    updated_at: ppi.updatedAt,
                    product_id: ppi.productId,
                    media_url: ppi.mediaUrl
                }))
            }))
        }
    }

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

    @Delete('carts/:id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteCart(@Req() req: Request, @Param() param: { id: string }) {
        const user = req.withUser
        const deletedCart = await this.usersService.deleteCart({ customerId: user.userId, cartItemId: param.id })

        return {
            message: 'Delete Cart Successful',
            data: {
                id: deletedCart.id,
                customer_id: deletedCart.customerId,
                product_id: deletedCart.productId,
                quantity: deletedCart.quantity,
                created_at: deletedCart.createdAt,
                updated_at: deletedCart.updatedAt
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
                    // media_url: pf.mediaUrl,
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

        const libraryOrders = await this.usersService.getLibraryOrders(user)
        return {
            message: 'Get Library Orders Data Successful',
            data:
                libraryOrders.length === 0
                    ? []
                    : libraryOrders.map(u => ({
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
