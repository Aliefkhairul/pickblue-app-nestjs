import {
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common"
import { DrizzleQueryError } from "drizzle-orm"
import { DatabaseError } from "pg"
import { dbConnection, type PgDatabase } from "src/database/db_connection"
import { User, users } from "src/schema"

type SignUpParams = {
    name: string
    email: string
    password: string
    providerId: string
}

@Injectable()
export class AuthenticationService {
    constructor(@Inject(dbConnection) private readonly db: PgDatabase) {}

    async signUp(params: SignUpParams) {
        return await this.db.transaction(async function (tx) {
            let user: User[] = []
            try {
                user = await tx
                    .insert(users)
                    .values({
                        name: params.name,
                        email: params.email,
                    })
                    .returning()
            } catch (err) {
                if (err instanceof DrizzleQueryError) {
                    if (err.cause instanceof DatabaseError) {
                        if (err.cause.code === "23505") {
                            throw new ConflictException("email_already_exists")
                        }
                        throw new InternalServerErrorException("database_error")
                    }
                }
            }

            return user.at(0)
        })
    }
}
