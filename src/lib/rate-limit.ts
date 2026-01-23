import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const rateLimitInstance =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({
          url: redisUrl,
          token: redisToken,
        }),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
      })
    : null;

export const checkRateLimit = async (identifier: string) => {
  if (!rateLimitInstance) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await rateLimitInstance.limit(identifier);
  return result;
};
