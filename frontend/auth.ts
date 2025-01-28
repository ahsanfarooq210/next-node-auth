/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    accessToken?: string;
    refreshToken?: string;
    password?: string;
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        if (username === "user" && password === "password") {
          return { id: "1", name: "User", email: "user@example.com", password };
        }

        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const customUser = user;
      try {
        const response = await axios.post(
          "https://your-backend-api.com/auth/signin",
          {
            username: customUser.name,
            password: customUser.password,
          }
        );

        if (response.data.accessToken && response.data.refreshToken) {
          customUser.accessToken = response.data.accessToken;
          customUser.refreshToken = response.data.refreshToken;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Error during sign-in callback:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user;
        token.accessToken = customUser.accessToken;
        token.refreshToken = customUser.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
  },
});
