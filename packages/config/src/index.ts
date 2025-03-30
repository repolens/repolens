import { githubEnvSchema, openaiEnvSchema } from './schema.js'

export const githubConfig = githubEnvSchema.parse(process.env)
export const openaiConfig = openaiEnvSchema.parse(process.env)

export function getGithubConfig() {
  return githubConfig
}

export function getOpenaiConfig() {
  return openaiConfig
}
