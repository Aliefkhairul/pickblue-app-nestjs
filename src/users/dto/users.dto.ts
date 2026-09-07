import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateCartRequest {
    @IsString({ message: 'Product ID must be a string' })
    @IsNotEmpty()
    product_id!: string

    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(1, { message: 'Quantity must be at least 1' })
    @IsNotEmpty()
    quantity!: number
}

export class UpdateProfileRequest {
    @IsString({ message: 'Name must be a string' })
    @IsOptional()
    name?: string
}
