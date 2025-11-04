/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('Attempting login...');
          if (!credentials?.email || !credentials?.password) return null;

          const BACKEND_URL = process.env.BACKEND_URL;
          const response = await fetch(`${BACKEND_URL}/api/accounts/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) return null;
          const data = await response.json();

          // Expecting Django to return this JSON:
          // { user: { id, email, user_type, username }, access: "JWT_TOKEN" }
          return {
            id: data.user.id?.toString() || data.user.email,
            email: data.user.email,
            name: data.user.username,
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            role: data.user.user_type,
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
      token.id = user.id;
      token.email = user.email;
      token.firstname = user.firstname;
      token.lastname = user.lastname;
      token.role = user.role;
      token.accessToken = user.accessToken;
      token.refreshToken = user.refreshToken;
    }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user = session.user ?? {};
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.firstname = token.firstname;
      session.user.lastname = token.lastname;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
