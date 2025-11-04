// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstname?: string;
      lastname?: string;
      role?: string;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }

}