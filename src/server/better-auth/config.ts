import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  anonymous,
  apiKey,
  emailOTP,
  genericOAuth,
  magicLink,
  openAPI,
  twoFactor,
  username,
} from "better-auth/plugins";
import { appEnv } from "@/env";
import { db } from "@/server/db";
import {
  sendEmailVerification,
  sendMagicLink,
  sendOTPVerification,
  sendResetPassword,
} from "@/server/emails/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerification({
        to: user.email,
        url,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPassword({
        to: user.email,
        url,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: appEnv.BETTER_AUTH_GITHUB_CLIENT_ID,
      clientSecret: appEnv.BETTER_AUTH_GITHUB_CLIENT_SECRET,
      redirectURI: "http://localhost:3000/api/auth/callback/github",
    },
  },
  plugins: [
    openAPI(),
    anonymous(),
    username(),
    apiKey({
      keyExpiration: {
        defaultExpiresIn: 1000 * 60 * 60 * 24 * 7, // 7 days default (in ms)
        minExpiresIn: 1, // 1 day minimum (in days)
        maxExpiresIn: 365, // 1 year maximum (in days)
      },
      rateLimit: {
        enabled: true,
        timeWindow: 60 * 60 * 60 * 24, // 1 day window
        maxRequests: 1000, // 1000 requests per day
      },
      permissions: {
        defaultPermissions: {
          scholarships: ["read", "write"],
          universities: ["read"],
          colleges: ["read"],
          departments: ["read"],
          programs: ["read"],
          courses: ["read"],
          resources: ["read", "write"],
          recommendations: ["read", "write"],
          resumes: ["read", "write"],
          ratings: ["read"],
        },
      },
      enableMetadata: true,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink({
          to: email,
          url,
        });
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOTPVerification({
          to: email,
          code: otp,
        });
      },
    }),
    twoFactor(),
    genericOAuth({
      config: [
        {
          providerId: "slack",
          clientId: process.env.SLACK_CLIENT_ID as string,
          clientSecret: process.env.SLACK_CLIENT_SECRET as string,
          discoveryUrl: "https://slack.com/.well-known/openid-configuration",
          scopes: ["openid", "email", "profile"],
        },
      ],
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "user",
      },
    },
  },
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => {
  if (!_schema) {
    _schema = auth.api.generateOpenAPISchema();
  }
  return _schema;
};

export const BetterAuthOpenAPI = {
  getPaths: (prefix = "/api/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as Record<string, any>)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;

export type Session = typeof auth.$Infer.Session;
