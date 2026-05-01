import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

export const mailService = 'MAIL_TOKEN_RESEND'

@Global()
@Module({
    providers: [
        {
            provide: mailService,
            inject: [ConfigService],
            useFactory: async function (c: ConfigService) {
                const resendApiKey = c.getOrThrow<string>('RESEND_API_KEY')
                const resend = new Resend(resendApiKey)

                console.log('Resend has initialize')
                return resend
            }
        }
    ],
    exports: [mailService]
})
export class MailsModule {}
