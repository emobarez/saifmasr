import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// One-time module init log to verify this file is actually loaded by the server
console.log('[AUTH ROUTE INIT]', {
	time: new Date().toISOString(),
	nodeEnv: process.env.NODE_ENV,
	hasSecret: !!process.env.NEXTAUTH_SECRET,
	nextAuthUrl: process.env.NEXTAUTH_URL || 'undefined'
});

const baseHandler = NextAuth(authOptions);

export const GET = (req: any, ctx: any) => {
	console.log('[AUTH ROUTE] GET', req?.nextUrl?.pathname || 'unknown');
	return baseHandler(req, ctx);
};

export const POST = (req: any, ctx: any) => {
	console.log('[AUTH ROUTE] POST', req?.nextUrl?.pathname || 'unknown');
	return baseHandler(req, ctx);
};