import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as CloudinaryAPI, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'
import { MIN_LOW_RES_UPLOAD } from './uploaders.module'
import { generateRandomCode } from 'utils/random.code'

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

        this.logger.debug('fetching to cloudinary...')
        const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = CloudinaryAPI.uploader.upload_stream(
                {
                    folder: !options.lowRes ? originalFolder : lowResFolder,
                    public_id: generateRandomCode(),
                    resource_type: 'image',
                    overwrite: true,
                    unique_filename: false,
                    use_filename: true,
                    allowed_formats: ['jpg', 'png', 'psd', 'ai', 'svg'],
                    transformation: !options.lowRes
                        ? undefined
                        : {
                              width: MIN_LOW_RES_UPLOAD,
                              crop: 'limit' // resize tapi tidak melebihi 800px
                          }
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        this.logger.error('fetching to cloudinary fails')
                        return reject(error)
                    }
                    if (!result) {
                        this.logger.error('fetching to cloudinary fails')
                        return reject(new Error('upload_result_undefined'))
                    }

                    this.logger.debug('fetching to cloudinary success')
                    resolve(result)
                }
            )

            Readable.from(file.buffer).pipe(uploadStream)
        })

        return uploadResponse
    }

    async getSingleDownloadableImage(params: GetSingleDownloadableImageParams) {
        try {
            this.logger.debug('fetching to cloudinary...')
            const url = CloudinaryAPI.url(params.publicId, {
                resource_type: 'image',
                secure: true,
                sign_url: true,
                transformation: [{ flags: params.fileName ? `attachment:${params.fileName}` : 'attachment' }]
            })

            this.logger.debug('fetching to cloudinary success')
            return url.toString()
        } catch (err) {
            this.logger.error('fetching to cloudinary fails')
            throw err
        }
    }

    async destroySingleImage(params: DestroySingleImageParams) {
        try {
            this.logger.debug('fetching to cloudinary...')
            const response = CloudinaryAPI.uploader.destroy(params.publicId, {
                resource_type: 'image'
            })

            this.logger.debug('fetching to cloudinary success')
            return response
        } catch (err) {
            this.logger.error('fetching to cloudinary fails')
            throw err
        }
    }
}
