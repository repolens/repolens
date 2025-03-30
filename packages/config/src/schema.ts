import { z } from 'zod'

export const githubEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
})

export const openaiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_BASE_URL: z.string().optional(),
})

export type GithubEnvVars = z.infer<typeof githubEnvSchema>
export type OpenaiEnvVars = z.infer<typeof openaiEnvSchema>
