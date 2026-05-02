import * as ngrok from '@ngrok/ngrok'
import * as dotenv from 'dotenv'

dotenv.config()

export async function ngrokBootstrap() {
    const listener = await ngrok.forward({
        addr: 3001,
        authtoken: process.env.NGROK_AUTHTOKEN
    })

    console.log(`Ingress established at ${listener.url()}`)
}

ngrokBootstrap()
process.stdin.resume()
