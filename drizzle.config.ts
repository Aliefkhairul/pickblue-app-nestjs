import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/schema',
    out: './migrations',
    dbCredentials: {
        url: process.env.DB_CONNECTION_STRING!
    }
})
