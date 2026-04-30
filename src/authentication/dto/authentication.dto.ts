import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class SignUpRequest {
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @IsNotEmpty()
    name: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password: string

    @IsString({ message: 'Provider must be a string' })
    @IsEnum(['credentials', 'google'], {
        message: "Provider must be either 'credentials' or 'google'"
    })
    @IsNotEmpty()
    provider_id: string
}
