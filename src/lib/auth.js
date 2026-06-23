import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("redhope");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      bloodGroup: {
        type: "string",
        required: false,
        returned: true,
      },
      district: {
        type: "string",
        required: false,
        returned: true,
      },
      upazila: {
        type: "string",
        required: false,
        returned: true,
      },
      role: {
        type: "string",
        defaultValue: "donor",
        returned: true,
      },
      status: {
        type: "string",
        defaultValue: "active",
        returned: true,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // Max age in seconds
    }
  },
  plugins: [
    jwt()
  ]
});
