import { envSchema } from './schema.js'

export const config = envSchema.parse(process.env)
