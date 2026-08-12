import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "fdn_admin";

function tokenFor(password: string) {
  return createHash("sha256").update(`fdn:${password}`).digest("hex");
}

export function validPassword(password: string) {
  return password.length > 0 && password === process.env.ADMIN_PASSWORD;
}

export function sessionToken() {
  return tokenFor(process.env.ADMIN_PASSWORD ?? "");
}

export async function setSession() {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  return value === sessionToken();
}
