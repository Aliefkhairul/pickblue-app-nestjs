import { Module } from "@nestjs/common"
import { DatabaseModule } from "./database/database.module"
import { ConfigModule } from "@nestjs/config"
import { AuthenticationModule } from "./authentication/authentication.module"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthenticationModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
