import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as CloudinaryAPI } from 'cloudinary'
import { UploadersService } from './uploaders.service'

const cloudinaryService = 'CLOUDINARY_SERVICE'
export const MAX_FILE_SIZE_UPLOAD = 2000000 // 1mb
export const MAX_FILE_COUNT = 4
export const ALLOWED_MIME_TYPE = 'image/png|image/jpeg'
export const MIN_LOW_RES_UPLOAD = 600

@Module({
    providers: [
        {
            provide: cloudinaryService,
            inject: [ConfigService],
            useFactory: function (c: ConfigService) {
                CloudinaryAPI.config({
                    cloud_name: c.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
                    api_key: c.getOrThrow<string>('CLOUDINARY_API_KEY'),
                    api_secret: c.getOrThrow<string>('CLOUDINARY_API_SECRET')
                })
                console.log('Cloudinary has initialize')
            }
        },
        UploadersService
    ],
    exports: [UploadersService]
})
export class UploadersModule {}
