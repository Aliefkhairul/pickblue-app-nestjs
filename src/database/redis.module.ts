import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
    providers: [
        {
            inject: [ConfigService],
            provide: REDIS_CLIENT,
            useFactory: (c: ConfigService) => {
                const redis = new Redis(c.getOrThrow<string>('REDIS_URL'))
                console.log('redis has initialized')
                return redis
            }
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule {}
