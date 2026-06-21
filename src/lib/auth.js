import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("redhope");

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      bloodGroup: {
        type: "string",
        required: false,
      },
      district: {
        type: "string",
        required: false,
      },
      upazila: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "donor",
      },
      status: {
        type: "string",
        defaultValue: "active",
      },
    },
  },
});
