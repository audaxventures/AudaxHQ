import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your environment (see .env.example)."
  );
}

// @neondatabase/serverless talks to Neon over HTTP — no TCP connection pool
// to manage, which makes it a good fit for Vercel's serverless functions.
export const sql = neon(connectionString);
