import { Test, TestingModule } from '@nestjs/testing'
import { UploadersService } from './uploaders.service'

describe('UploadersService', () => {
    let service: UploadersService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UploadersService]
        }).compile()

        service = module.get<UploadersService>(UploadersService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
