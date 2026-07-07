import crypto from "node:crypto";
import { getPasscodeCredentials } from "@/lib/data/appSettings";
import type { SessionClaims, SessionRole } from "@/lib/types";

export const SESSION_COOKIE_NAME = "audax_session";

const SESSION_ROLES: SessionRole[] = ["OWNER", "TEAM_MEMBER"];

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

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/**
 * Session tokens carry who's logged in (owner vs. a specific team member) as
 * a signed payload, so proxy.ts can route on identity without a database
 * round trip. The signature is independent of the passcode's current value,
 * so changing a passcode from Settings doesn't retroactively log out every
 * already-open browser — only future logins are affected.
 */
export function createSessionToken(claims: SessionClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionClaims | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!timingSafeStringEqual(signature, signPayload(payload))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (!SESSION_ROLES.includes(claims.role)) return null;
    if (claims.role === "TEAM_MEMBER" && typeof claims.teamMemberId !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}

export function isCorrectPasscodeHash(candidate: string, hash: string, salt: string): boolean {
  const candidateHash = crypto.scryptSync(candidate, salt, 64);
  const storedHash = Buffer.from(hash, "hex");
  if (candidateHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(candidateHash, storedHash);
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
    return isCorrectPasscodeHash(candidate, stored.hash, stored.salt);
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

/** A random, single-use passcode-reset token — sent to the operator via email, never stored raw (see hashResetToken). */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isValidResetToken(candidateTokenHash: string, storedTokenHash: string): boolean {
  return timingSafeStringEqual(candidateTokenHash, storedTokenHash);
}
