import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class RegisterRequest {
    @IsEmail()
    email!: string
}

export class RegisterUserRequest {
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @IsNotEmpty()
    name!: string

    @IsEmail()
    email!: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password!: string

    @IsString({ message: 'Role must be a string' })
    @IsEnum(['user', 'creator'], {
        message: "Role must be either 'user' or 'creator'"
    })
    @IsNotEmpty()
    role!: string

    @IsString({ message: 'Token must be a string' })
    @MinLength(2, { message: 'Token must be at least 16 characters long' })
    @IsNotEmpty()
    token!: string

    @IsString({ message: 'Provider must be a string' })
    @IsEnum(['credentials', 'google'], {
        message: "Provider must be either 'credentials' or 'google'"
    })
    @IsNotEmpty()
    provider_id!: string
}

export class LoginRequest {
    @IsEmail()
    email!: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password!: string

    @IsString({ message: 'Provider must be a string' })
    @IsEnum(['credentials', 'google'], {
        message: "Provider must be either 'credentials' or 'google'"
    })
    @IsNotEmpty()
    provider_id!: string
}
