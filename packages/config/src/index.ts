import { githubEnvSchema, openaiEnvSchema } from './schema.js'

let _githubConfig: ReturnType<typeof githubEnvSchema.parse> | null = null
let _openaiConfig: ReturnType<typeof openaiEnvSchema.parse> | null = null

export function getGithubConfig() {
  if (!_githubConfig) {
    _githubConfig = githubEnvSchema.parse(process.env)
  }
  return _githubConfig
}

export function getOpenaiConfig() {
  if (!_openaiConfig) {
    _openaiConfig = openaiEnvSchema.parse(process.env)
  }
  return _openaiConfig
}
