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
});
