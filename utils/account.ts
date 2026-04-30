import * as bcrypt from "bcrypt"

const saltOrRounds = 10

export async function hashPasswordFn(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, saltOrRounds)
    return hash
}
