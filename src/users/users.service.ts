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
        try {
            const existing = await this.db.query.cartItems.findFirst({
                where: eq(cartItems.productId, params.productId)
            })
            if (existing) throw new HttpException({ message: 'product_already_in_cart' }, HttpStatus.CONFLICT)

            const [cartItem] = await this.db
                .insert(cartItems)
                .values({
                    userId: params.userId,
                    productId: params.productId,
                    quantity: params.quantity
                })
                .returning()

            return cartItem
        } catch (err) {
            if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                if (err.cause.code === '23503') throw new BadRequestException('invalid_product_id')
                if (err.cause.code === '23505') throw new ConflictException('product_already_in_cart')
            }
            throw err
        }
    }
}
