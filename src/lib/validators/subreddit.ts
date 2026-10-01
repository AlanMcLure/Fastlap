import { z } from 'zod'

export const SubredditValidator = z.object({
  name: z
    .string()
    .min(3)
    .max(21)
    // The name is part of the URL (/r/<name>): letters, digits and underscores only.
    .regex(/^[a-zA-Z0-9_]+$/),
})

export const SubredditSubscriptionValidator = z.object({
  subredditId: z.string(),
})

export type CreateSubredditPayload = z.infer<typeof SubredditValidator>
export type SubscribeToSubredditPayload = z.infer<
  typeof SubredditSubscriptionValidator
>
