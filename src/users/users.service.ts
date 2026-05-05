import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { DrizzleQueryError, eq } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { cartItems, CreateCartParams } from 'src/schema'

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)

    constructor(@Inject(dbConnection) private readonly db: PgDB) {}

    async createCart(params: CreateCartParams) {
        return await this.db.transaction(async tx => {
            try {
                // is user already purchase related product
                const userPurchases = await tx.query.userPurchases.findFirst({
                    where: userPurchase => eq(userPurchase.productId, params.productId)
                })
                if (userPurchases) throw new HttpException({ message: 'Product Already Bought' }, HttpStatus.BAD_REQUEST)

                // is user's cart already exists
                const existing = await tx.query.cartItems.findFirst({
                    where: eq(cartItems.productId, params.productId)
                })
                if (existing) throw new HttpException({ message: 'Product Already In Cart' }, HttpStatus.CONFLICT)

                // product check
                const product = await tx.query.products.findFirst({ where: p => eq(p.id, params.productId) })
                if (!product) throw new HttpException({ message: 'Product Not Found' }, HttpStatus.NOT_FOUND)

                const [cartItem] = await tx
                    .insert(cartItems)
                    .values({
                        customerId: params.customerId,
                        productId: params.productId,
                        quantity: params.quantity
                    })
                    .returning()

                return cartItem
            } catch (err) {
                if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                    if (err.cause.code === '23503') throw new BadRequestException('Invalid Product Id')
                    if (err.cause.code === '23505') throw new ConflictException('Product Already In Cart')
                }
                throw err
            }
        })
    }
}
