import { Inject, Injectable } from '@nestjs/common'
import { dbConnection, type PgDB } from 'src/database/database.module'

type CreateProductParams = {
    name: string
    category: string
    description: string
    details: string
    slug: string
    price: number
    allowed_formats: string[]
    tags: string[]
}

@Injectable()
export class ProductsService {
    constructor(@Inject(dbConnection) private readonly db: PgDB) {}

    async createProduct(params: CreateProductParams) {}
}
