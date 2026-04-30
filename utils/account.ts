import * as bcrypt from 'bcrypt'

const saltOrRounds = 10

export async function hashPasswordFn(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, saltOrRounds)
    return hash
}

export async function comparePasswordFn(password: string, hashedPassword: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hashedPassword)
    return isMatch
}
