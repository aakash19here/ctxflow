import "dotenv/config";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/db";
import { magicLink, emailOTP, admin } from "better-auth/plugins";
import { Resend } from "resend";
import { CtxFlowVerifyIdentityEmail, MagicLinkEmail } from "@repo/email";
import { randomUUID } from "crypto";
import { getRateLimitIdentifier, rateLimiters } from "@repo/ratelimit";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  appName: "CtxFlow",
  trustedOrigins: [
    process.env.WEB_APP_URL ?? "http://localhost:3001",
    process.env.WIDGET_APP_URL ?? "http://localhost:3002",
    process.env.EMBED_APP_URL ?? "http://localhost:5173",
  ],
  advanced: {
    cookiePrefix: "__Secure-ctxflow.auth",
    crossSubDomainCookies: {
      enabled: isProduction(),
      domain: process.env.AUTH_COOKIE_DOMAIN ?? ".ctxflow.example.com",
    },
    useSecureCookies: isProduction(),
    defaultCookieAttributes: {
      // SameSite=None is required for third-party iframes
      sameSite: isProduction() ? "none" : "lax",
      // Secure is required when SameSite=None
      secure: isProduction(),
      partitioned: isProduction(),
      path: "/",
    },
    cookies: {
      session_token: {
        attributes: {
          sameSite: isProduction() ? "none" : "lax",
          secure: isProduction(),
          partitioned: isProduction(),
          path: "/",
        },
      },
      session_data: {
        attributes: {
          sameSite: isProduction() ? "none" : "lax",
          secure: isProduction(),
          partitioned: isProduction(),
          path: "/",
        },
      },
      dont_remember: {
        attributes: {
          sameSite: isProduction() ? "none" : "lax",
          secure: isProduction(),
          partitioned: isProduction(),
          path: "/",
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 3, // 1 day (every 1 day the session expiration is updated)
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
  },
  plugins: [
    admin(),
    emailOTP({
      disableSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          const resend = new Resend(process.env.RESEND_API_KEY as string);
          await resend.emails.send({
            from: process.env.AUTH_EMAIL_FROM ?? "noreply@ctxflow.example.com",
            to: email,
            subject: "Login to CtxFlow",
            react: CtxFlowVerifyIdentityEmail({ validationCode: otp }),
            headers: {
              "X-Entity-Ref-ID": randomUUID(),
            },
          });
        }
      },
    }),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async ({ email, url }, request) => {
        const identifer = getRateLimitIdentifier(undefined, request?.headers);

        const { success } = await rateLimiters.auth.limit(identifer);

        if (!success) {
          throw new Error("Rate limit exceeded");
        }

        const resend = new Resend(process.env.RESEND_API_KEY as string);
        await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM ?? "noreply@ctxflow.example.com",
          to: email,
          subject: "Login to CtxFlow",
          react: MagicLinkEmail({ magicLink: url }),
          headers: {
            "X-Entity-Ref-ID": randomUUID(),
          },
        });
      },
    }),
  ],
  baseURL: process.env.BETTER_AUTH_URL,
});
