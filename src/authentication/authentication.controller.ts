import { Body, Controller, Post } from "@nestjs/common"
import { AuthenticationService } from "./authentication.service"
import { SignUpRequest } from "./dto/authentication.dto"

@Controller("auth")
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
    ) {}

    @Post("sign-up")
    async signUp(@Body() dto: SignUpRequest) {
        try {
            const user = await this.authenticationService.signUp({
                name: dto.name,
                email: dto.email,
                password: dto.password,
                providerId: dto.provider_id,
            })

            return { ok: true, message: "user_created", data: user }
        } catch (err) {
            if (err instanceof Error) {
                return { ok: false, message: err.message, data: null }
            }
        }
    }
}
