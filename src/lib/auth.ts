import crypto from "node:crypto";
import { getPasscodeCredentials } from "@/lib/data/appSettings";

export const SESSION_COOKIE_NAME = "audax_session";

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.APP_PASSCODE;
  if (!secret) {
    throw new Error("AUTH_SECRET or APP_PASSCODE must be set. Add one to your environment (see .env.example).");
  }
  return secret;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Session tokens are a fixed value signed by AUTH_SECRET, deliberately
 * independent of the passcode's current value. That means validating a
 * session on every request (proxy.ts) never needs a database round trip,
 * and changing the passcode from Settings doesn't retroactively log out
 * every already-open browser — only future logins use the new passcode.
 */
export function computeSessionToken(): string {
  return crypto.createHmac("sha256", sessionSecret()).update("audax-hq-session-v1").digest("hex");
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  return timingSafeStringEqual(token, computeSessionToken());
}

/**
 * Verifies a candidate passcode against the DB-stored passcode (set via
 * Settings) if one has been set, otherwise against the APP_PASSCODE env
 * var — so existing deployments keep working unchanged until someone
 * opts into managing the passcode from Settings.
 */
export async function isCorrectPasscode(candidate: string): Promise<boolean> {
  const stored = await getPasscodeCredentials();
  if (stored) {
    const candidateHash = crypto.scryptSync(candidate, stored.salt, 64);
    const storedHash = Buffer.from(stored.hash, "hex");
    if (candidateHash.length !== storedHash.length) return false;
    return crypto.timingSafeEqual(candidateHash, storedHash);
  }
  const envPasscode = process.env.APP_PASSCODE;
  if (!envPasscode) return false;
  return timingSafeStringEqual(candidate, envPasscode);
}

export function hashPasscode(passcode: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(passcode, salt, 64).toString("hex");
  return { hash, salt };
}
