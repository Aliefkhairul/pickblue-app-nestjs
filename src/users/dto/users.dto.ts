import { IsEnum, IsNotEmpty, IsNumber, IsOptional, isString, IsString } from 'class-validator'

export class CreateCartRequest {
    @IsString({ message: 'Product ID must be a string' })
    @IsNotEmpty()
    product_id!: string

    @IsNumber({}, { message: 'Quantity must be a number' })
    @IsNotEmpty()
    quantity!: number
}

export class UpdateProfileRequest {
    @IsString({ message: 'Name must be a string' })
    @IsOptional()
    name?: string
}

export class CreateUserWalletsRequest {
    @IsString({ message: 'Type must be a string' })
    @IsEnum(['bank', 'e-wallet'], {
        message: "Type must be 'bank' or 'e-wallet'"
    })
    @IsNotEmpty()
    type!: string

    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty()
    name!: string

    @IsString({ message: 'Number must be a number' })
    @IsNotEmpty()
    number!: string

    @IsString({ message: 'Holder must be a string' })
    @IsNotEmpty()
    holder!: string
}
