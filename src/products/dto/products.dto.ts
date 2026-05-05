import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, MinLength, ValidateNested } from 'class-validator'

export class CreateProductRequest {
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @IsNotEmpty()
    name!: string

    @IsArray({ message: 'Categories must be an array' })
    @IsString({ each: true, message: 'Each category must be a string' })
    @IsEnum(['illustration', 'digital_painting', 'concept_art', 'character_design', 'environment_art', 'pixel_art', 'vector_art', 'typography', 'photo_manipulation', 'ui_kit', '3d_render', 'motion_graphic', 'fan_art', 'abstract', 'other'], {
        each: true,
        message: 'Each category must be one of the following: illustration, digital_painting, concept_art, character_design, environment_art, pixel_art, vector_art, typography, photo_manipulation, ui_kit, 3d_render, motion_graphic, fan_art, abstract, other'
    })
    @IsNotEmpty()
    categories!: string[]

    @IsString({ message: 'Description must be a string' })
    @IsNotEmpty()
    description!: string

    @IsString({ message: 'Details must be a string' })
    @IsNotEmpty()
    details!: string

    @IsString({ message: 'Slug must be a string' })
    @IsNotEmpty()
    slug!: string

    @IsNumber({}, { message: 'Price must be a number' })
    @IsNotEmpty()
    price!: number

    @IsArray({ message: 'Allowed formats must be an array' })
    @IsEnum(['JPG', 'PNG', 'PSD', 'AI', 'SVG'], {
        each: true,
        message: 'Each allowed format must be one of the following: jpg, png, psd, ai, svg, pdf, other'
    })
    @IsNotEmpty()
    allowed_formats!: string[]

    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true, message: 'Each tag must be a string' })
    @IsNotEmpty()
    tags!: string[]
}

export class CreateProductFileRequest {
    @IsString({ message: 'File name must be a string' })
    @IsNotEmpty()
    product_id!: string

    @IsString({ message: 'File name must be a string' })
    @IsNotEmpty()
    file_name!: string

    @IsNumber({}, { message: 'File size must be a number' })
    @IsNotEmpty()
    file_size!: number

    @IsString({ message: 'Public ID must be a string' })
    @IsNotEmpty()
    public_id!: string

    @IsString({ message: 'Media URL must be a string' })
    @IsNotEmpty()
    media_url!: string

    @IsString({ message: 'Resource type must be a string' })
    @IsNotEmpty()
    resource_type!: string

    @IsString({ message: 'Format must be a string' })
    @IsNotEmpty()
    format!: string
}

export class CreateProductFileRequestList {
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateProductFileRequest)
    files!: CreateProductFileRequest[]
}

export class CreateProductPreviewImageRequest {
    @IsString({ message: 'Product ID must be a string' })
    @IsNotEmpty()
    product_id!: string

    @IsString({ message: 'Media URL must be a string' })
    @IsNotEmpty()
    media_url!: string
}

export class CreateProductPreviewImageRequestList {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductPreviewImageRequest)
    images!: CreateProductPreviewImageRequest[]
}
