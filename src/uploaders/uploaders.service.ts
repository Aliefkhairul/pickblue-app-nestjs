import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as CloudinaryAPI, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { generateRandomCode } from 'utils/random.code'
import { MIN_LOW_RES_UPLOAD } from './uploaders.module'

type UploadSingleImageOptionParams = {
    lowRes: boolean
}

type GetSingleDownloadableImageParams = {
    publicId: string
    fileName: string
}

type DestroySingleImageParams = {
    publicId: string
}

@Injectable()
export class UploadersService {
    private readonly logger = new Logger(UploadersService.name)

    constructor(private readonly configService: ConfigService) {}

    async uploadSingleImage(file: Express.Multer.File, options: UploadSingleImageOptionParams) {
        const originalFolder = this.configService.getOrThrow<string>('CLOUDINARY_UPLOAD_FOLDER')
        const lowResFolder = this.configService.getOrThrow<string>('CLOUDINARY_UPLOAD_LOW_RES_FOLDER')

        this.logger.debug({ uploadSingleImage: 'Fetching...' })

        return await new Promise<UploadApiResponse>((resolve, reject) => {
            CloudinaryAPI.uploader
                .upload_stream(
                    {
                        folder: !options.lowRes ? originalFolder : lowResFolder,
                        public_id: generateRandomCode(),
                        resource_type: 'image',
                        unique_filename: true,
                        use_filename: true,
                        transformation: !options.lowRes ? undefined : { width: MIN_LOW_RES_UPLOAD, crop: 'limit' }
                    },
                    (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                        if (error) {
                            this.logger.error({ uploadSingleImage: 'Fetching Fails' })
                            return reject(new Error(error.message))
                        }

                        if (!result) {
                            this.logger.error({ uploadSingleImage: 'Fetching Fails' })
                            return reject(new Error('upload_result_undefined'))
                        }

                        this.logger.debug({ uploadSingleImage: 'Fetching Success' })
                        return resolve(result)
                    }
                )
                .end(file.buffer)
        })
    }

    getSingleDownloadableImage(params: GetSingleDownloadableImageParams) {
        try {
            this.logger.debug({ downloadSingleImage: 'Fetching...' })
            const url = CloudinaryAPI.url(params.publicId, {
                resource_type: 'image',
                secure: true,
                sign_url: true,
                transformation: [{ flags: params.fileName ? `attachment:${params.fileName}` : 'attachment' }]
            })

            this.logger.debug({ downloadSingleImage: 'Fetching Success' })
            return url.toString()
        } catch (err) {
            this.logger.error({ downloadSingleImage: 'Fetching Fails' })
            throw err
        }
    }

    async destroySingleImage(params: DestroySingleImageParams) {
        try {
            this.logger.debug({ destroySingleImage: 'Fetching...' })
            const response = CloudinaryAPI.uploader.destroy(params.publicId, {
                resource_type: 'image'
            })

            this.logger.debug({ destroySingleImage: 'Fetching Success' })
            return response
        } catch (err) {
            this.logger.error({ destroySingleImage: 'Fetching Fails' })
            throw err
        }
    }
}
