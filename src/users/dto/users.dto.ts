import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateCartRequest {
    @IsString({ message: 'Product ID must be a string' })
    @IsNotEmpty()
    product_id: string

    @IsNumber({}, { message: 'Quantity must be a number' })
    @IsNotEmpty()
    quantity: number
}
