import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return (env as any).DB as D1Database;
});

export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return (env as any).DB as D1Database;
});
