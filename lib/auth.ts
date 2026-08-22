import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-change-me");
const COOKIE = "vera_session";
export async function createSession(userId: string) { const token = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret); (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 }); }
export async function destroySession() { (await cookies()).delete(COOKIE); }
export async function getSessionUser() { const token = (await cookies()).get(COOKIE)?.value; if (!token) return null; try { const { payload } = await jwtVerify(token, secret); if (!payload.userId || typeof payload.userId !== "string") return null; return prisma.user.findUnique({ where: { id: payload.userId } }); } catch { return null; } }
export async function requireUser() { const user = await getSessionUser(); if (!user) throw new Error("UNAUTHORIZED"); return user; }
export async function requireAdmin() { const user = await requireUser(); if (user.role !== "ADMIN") throw new Error("FORBIDDEN"); return user; }
