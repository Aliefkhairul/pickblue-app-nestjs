import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator'

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

    @IsNumber({}, { message: 'Number must be a number' })
    @IsNotEmpty()
    number!: number

    @IsString({ message: 'Holder must be a string' })
    @IsNotEmpty()
    holder!: string
}
