import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_JWT_SECRET: z.string().min(16),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  APIFY_TOKEN: z.string().optional().default(""),
  APIFY_INSTAGRAM_ACTOR_ID: z.string().optional().default(""),
  APIFY_TIKTOK_ACTOR_ID: z.string().optional().default(""),
  FETCH_LIMIT_PER_CHANNEL: z.coerce.number().int().positive().optional().default(30)
});

export type Env = z.infer<typeof schema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  cachedEnv = schema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    APIFY_INSTAGRAM_ACTOR_ID: process.env.APIFY_INSTAGRAM_ACTOR_ID,
    APIFY_TIKTOK_ACTOR_ID: process.env.APIFY_TIKTOK_ACTOR_ID,
    FETCH_LIMIT_PER_CHANNEL: process.env.FETCH_LIMIT_PER_CHANNEL
  });

  return cachedEnv;
}
